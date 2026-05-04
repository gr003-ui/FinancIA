"use client";
import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { LogIn, LogOut, Cloud, CloudOff, Loader2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function UserMenu({ collapsed }: { collapsed?: boolean }) {
  const { user, loading, signInGoogle, signOut, syncing, lastSynced } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className={`flex items-center gap-3 p-3 ${collapsed ? 'justify-center' : ''}`}>
        <Loader2 size={16} className="text-slate-500 animate-spin" />
        {!collapsed && <span className="text-xs text-slate-500">Cargando...</span>}
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={signInGoogle}
        title={collapsed ? 'Iniciar sesión con Google' : undefined}
        className={`flex items-center gap-3 p-3 rounded-2xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-bold w-full ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <LogIn size={18} className="flex-shrink-0" />
        {!collapsed && <span className="text-sm">Iniciar sesión</span>}
      </button>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const name      = user.user_metadata?.full_name ?? user.email ?? 'Usuario';

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        title={collapsed ? name : undefined}
        className={`flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 transition-all w-full ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={28}
            height={28}
            className="rounded-full flex-shrink-0"
          />
        ) : (
          <div className="w-7 h-7 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-emerald-400" />
          </div>
        )}

        {!collapsed && (
          <div className="flex-1 text-left min-w-0">
            <p className="text-white text-xs font-bold truncate">{name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {syncing ? (
                <>
                  <Loader2 size={10} className="text-amber-400 animate-spin" />
                  <span className="text-[10px] text-amber-400">Sincronizando...</span>
                </>
              ) : lastSynced ? (
                <>
                  <Cloud size={10} className="text-emerald-400" />
                  <span className="text-[10px] text-slate-500">
                    {lastSynced.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              ) : (
                <>
                  <CloudOff size={10} className="text-slate-600" />
                  <span className="text-[10px] text-slate-600">Sin sincronizar</span>
                </>
              )}
            </div>
          </div>
        )}
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute bottom-full mb-2 bg-slate-800 border border-white/10 rounded-2xl p-2 shadow-xl z-50 min-w-[180px] ${
              collapsed ? 'left-full ml-3 bottom-0' : 'left-0 right-0'
            }`}
          >
            <div className="px-3 py-2 border-b border-white/10 mb-1">
              <p className="text-white text-xs font-bold truncate">{name}</p>
              <p className="text-slate-500 text-[10px] truncate">{user.email}</p>
            </div>
            <button
              onClick={() => { signOut(); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all text-xs font-bold"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}