import { parseSupabaseConfig, SupabaseConfigError } from '@/shared/supabase/supabaseConfig';

const LOCAL_URL = 'http://127.0.0.1:54321';
const PUBLISHABLE_KEY = 'sb_publishable_test';

describe('parseSupabaseConfig', () => {
  it('returns the trimmed URL and publishable key', () => {
    expect(
      parseSupabaseConfig({ url: ` ${LOCAL_URL} `, publishableKey: ` ${PUBLISHABLE_KEY}\n` }),
    ).toEqual({ url: LOCAL_URL, publishableKey: PUBLISHABLE_KEY });
  });

  it.each([undefined, '', '   '])('rejects a missing URL (%p)', (url) => {
    expect(() => parseSupabaseConfig({ url, publishableKey: PUBLISHABLE_KEY })).toThrow(
      new SupabaseConfigError('EXPO_PUBLIC_SUPABASE_URL is not set.'),
    );
  });

  it.each(['127.0.0.1:54321', 'ftp://example.com', 'not a url'])(
    'rejects a URL that is not http(s) (%p)',
    (url) => {
      expect(() => parseSupabaseConfig({ url, publishableKey: PUBLISHABLE_KEY })).toThrow(
        'EXPO_PUBLIC_SUPABASE_URL must be an http(s) URL.',
      );
    },
  );

  it.each([undefined, '', '  '])('rejects a missing publishable key (%p)', (publishableKey) => {
    expect(() => parseSupabaseConfig({ url: LOCAL_URL, publishableKey })).toThrow(
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set.',
    );
  });

  it('rejects a secret key', () => {
    expect(() => parseSupabaseConfig({ url: LOCAL_URL, publishableKey: 'sb_secret_abc' })).toThrow(
      'holds a secret key',
    );
  });

  it('points developers to the setup steps', () => {
    expect(() => parseSupabaseConfig({ url: undefined, publishableKey: undefined })).toThrow(
      'Copy .env.example to .env.local',
    );
  });
});
