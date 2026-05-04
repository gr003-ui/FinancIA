"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, SupabaseUser } from '../lib/supabase';
import { saveStoreToCloud, loadStoreFromCloud } from '../lib/syncStore';
import { useFinanceStore } from '../store/useFinanceStore';

interface AuthContextValue {
  user:         SupabaseUser | null;
  loading:      boolean;
  signInGoogle: () => Promise<void>;
  signOut:      () => Promise<void>;
  syncing:      boolean;
  lastSynced:   Date | null;
}

const AuthContext = createContext<AuthContextValue>({
  user:         null,
  loading:      true,
  signInGoogle: async () => {},
  signOut:      async () => {},
  syncing:      false,
  lastSynced:   null,
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user,       setUser]       = useState<SupabaseUser | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [syncing,    setSyncing]    = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const store = useFinanceStore();

  // Cargar sesión inicial
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user as SupabaseUser);
        loadCloudData(session.user.id);
      }
      setLoading(false);
    });

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user as SupabaseUser);
          if (event === 'SIGNED_IN') {
            await loadCloudData(session.user.id);
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Auto-sync cada vez que el store cambia (con debounce de 2s)
  useEffect(() => {
    if (!user) return;

    const timeout = setTimeout(async () => {
      setSyncing(true);
      const storeData = {
        cards:              store.cards,
        transactions:       store.transactions,
        budgets:            store.budgets,
        exchangeRate:       store.exchangeRate,
        userName:           store.userName,
        accentTheme:        store.accentTheme,
        onboardingComplete: store.onboardingComplete,
      };
      await saveStoreToCloud(user.id, storeData);
      setLastSynced(new Date());
      setSyncing(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [
    user,
    store.cards,
    store.transactions,
    store.budgets,
    store.exchangeRate,
    store.userName,
    store.accentTheme,
  ]);

  const loadCloudData = async (userId: string) => {
    setSyncing(true);
    const cloudData = await loadStoreFromCloud(userId) as Record<string, unknown> | null;

    if (cloudData) {
      const s = useFinanceStore.getState();
      // Solo sobreescribimos si hay más datos en la nube
      if (
        Array.isArray(cloudData.transactions) &&
        (cloudData.transactions as unknown[]).length >= store.transactions.length
      ) {
        if (cloudData.cards        !== undefined) s.cards        = cloudData.cards        as typeof s.cards;
        if (cloudData.transactions !== undefined) s.transactions = cloudData.transactions as typeof s.transactions;
        if (cloudData.budgets      !== undefined) s.budgets      = cloudData.budgets      as typeof s.budgets;
        if (cloudData.exchangeRate !== undefined) s.exchangeRate = cloudData.exchangeRate as number;
        if (cloudData.userName     !== undefined) s.userName     = cloudData.userName     as string;
        if (cloudData.accentTheme  !== undefined) s.accentTheme  = cloudData.accentTheme  as typeof s.accentTheme;
        // Forzamos re-render usando setState de Zustand
        useFinanceStore.setState({
          cards:        cloudData.cards        as typeof s.cards        ?? s.cards,
          transactions: cloudData.transactions as typeof s.transactions ?? s.transactions,
          budgets:      cloudData.budgets      as typeof s.budgets      ?? s.budgets,
          exchangeRate: cloudData.exchangeRate as number                ?? s.exchangeRate,
          userName:     cloudData.userName     as string                ?? s.userName,
          accentTheme:  cloudData.accentTheme  as typeof s.accentTheme  ?? s.accentTheme,
          onboardingComplete: true,
        });
      }
    }
    setLastSynced(new Date());
    setSyncing(false);
  };

  const signInGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInGoogle, signOut, syncing, lastSynced }}>
      {children}
    </AuthContext.Provider>
  );
}