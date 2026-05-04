import { supabase } from './supabase';

// Guarda el estado completo del store en Supabase
export async function saveStoreToCloud(userId: string, data: object): Promise<void> {
  try {
    await supabase
      .from('financia_data')
      .upsert(
        { user_id: userId, data, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
  } catch (err) {
    console.error('Error saving to Supabase:', err);
  }
}

// Carga el estado del store desde Supabase
export async function loadStoreFromCloud(userId: string): Promise<object | null> {
  try {
    const { data, error } = await supabase
      .from('financia_data')
      .select('data')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return data.data as object;
  } catch {
    return null;
  }
}