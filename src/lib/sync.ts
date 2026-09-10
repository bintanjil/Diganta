import { buildPayload } from './backup';
import { currentUserId, supabase } from './supabase';
import { useAppStore } from './store';
import type { BackupPayload } from './types';

export async function pushSnapshot(): Promise<{ error?: string }> {
  if (!supabase) return { error: 'not-configured' };
  const userId = await currentUserId();
  if (!userId) return { error: 'not-signed-in' };
  const { error } = await supabase
    .from('snapshots')
    .upsert({ user_id: userId, data: buildPayload().data, updated_at: new Date().toISOString() });
  return error ? { error: error.message } : {};
}

export async function pullSnapshot(): Promise<{ error?: string; pulled?: boolean }> {
  if (!supabase) return { error: 'not-configured' };
  const userId = await currentUserId();
  if (!userId) return { error: 'not-signed-in' };
  const { data, error } = await supabase
    .from('snapshots')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data?.data) return { pulled: false };
  useAppStore.getState().importData(data.data as BackupPayload['data']);
  return { pulled: true };
}
