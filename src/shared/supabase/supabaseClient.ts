import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/shared/supabase/database.types';
import { parseSupabaseConfig } from '@/shared/supabase/supabaseConfig';

export type KiwiSupabaseClient = SupabaseClient<Database>;

let client: KiwiSupabaseClient | undefined;

/**
 * Returns the app's single Supabase client, creating it on first use.
 * Only persistence modules call this; UI goes through them.
 * Throws a SupabaseConfigError when the env vars are missing or invalid.
 */
export function getSupabaseClient(): KiwiSupabaseClient {
  client ??= createSupabaseClient();
  return client;
}

function createSupabaseClient(): KiwiSupabaseClient {
  // Expo inlines EXPO_PUBLIC_* only when read as literal process.env.NAME expressions.
  const config = parseSupabaseConfig({
    url: process.env.EXPO_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  const supabase = createClient<Database>(config.url, config.publishableKey, {
    auth: {
      // MVP: the session lives in AsyncStorage (localStorage on web).
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      // Sign-in uses email codes, so there are no auth redirects to read from the URL.
      detectSessionInUrl: false,
    },
  });

  // Browsers refresh tokens on their own; native apps refresh only while in the foreground.
  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
  }

  return supabase;
}
