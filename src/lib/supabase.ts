import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isCloudConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isCloudConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export async function sendOtp(phone: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'not-configured' };
  const { error } = await supabase.auth.signInWithOtp({ phone });
  return error ? { error: error.message } : {};
}

export async function verifyOtp(phone: string, token: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'not-configured' };
  const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  return error ? { error: error.message } : {};
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}

export async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
