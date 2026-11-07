export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

type SupabaseConfigInput = {
  url: string | undefined;
  publishableKey: string | undefined;
};

const SETUP_HINT = 'Copy .env.example to .env.local and restart Expo. See docs/supabase.md.';

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(`${message} ${SETUP_HINT}`);
    this.name = 'SupabaseConfigError';
  }
}

/**
 * Validates the Supabase connection settings from the Expo public env vars.
 * Throws a SupabaseConfigError that names the missing or invalid variable.
 */
export function parseSupabaseConfig(input: SupabaseConfigInput): SupabaseConfig {
  const url = input.url?.trim();
  const publishableKey = input.publishableKey?.trim();

  if (!url) throw new SupabaseConfigError('EXPO_PUBLIC_SUPABASE_URL is not set.');
  if (!isHttpUrl(url)) {
    throw new SupabaseConfigError('EXPO_PUBLIC_SUPABASE_URL must be an http(s) URL.');
  }

  if (!publishableKey) {
    throw new SupabaseConfigError('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set.');
  }
  // Public env vars are bundled into the app, so a secret key there would leak it.
  if (publishableKey.startsWith('sb_secret_')) {
    throw new SupabaseConfigError(
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY holds a secret key; use the publishable key.',
    );
  }

  return { url, publishableKey };
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
