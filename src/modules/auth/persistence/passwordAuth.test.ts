import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';

import {
  AuthError,
  getSignInSetupError,
  signInWithPassword,
  signOut,
  subscribeToSignedInUser,
} from '@/modules/auth/persistence/passwordAuth';
import { getSupabaseClient } from '@/shared/supabase/supabaseClient';

jest.mock('@/shared/supabase/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));

const auth = {
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChange: jest.fn(),
};
const mockedGetClient = jest.mocked(getSupabaseClient);

async function caughtCode(promise: Promise<unknown>) {
  const error = await promise.then(
    () => null,
    (thrown: unknown) => thrown,
  );
  expect(error).toBeInstanceOf(AuthError);
  return (error as AuthError).code;
}

describe('passwordAuth', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedGetClient.mockReturnValue({ auth } as unknown as ReturnType<typeof getSupabaseClient>);
  });

  it('signs in with the email and password', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });

    await signInWithPassword('alex@kiwi.test', 'secret');

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'alex@kiwi.test',
      password: 'secret',
    });
  });

  it.each([
    [
      new AuthApiError('Invalid login credentials', 400, 'invalid_credentials'),
      'INVALID_CREDENTIALS',
    ],
    [new AuthApiError('Email not confirmed', 400, 'email_not_confirmed'), 'EMAIL_NOT_CONFIRMED'],
    [new AuthApiError('Too many requests', 429, undefined), 'RATE_LIMITED'],
    [new AuthRetryableFetchError('Failed to fetch', 0), 'NETWORK'],
    [new AuthApiError('Boom', 500, 'unexpected_failure'), 'UNKNOWN'],
  ])('maps %p returned by Supabase to %s', async (error, code) => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error });

    await expect(caughtCode(signInWithPassword('alex@kiwi.test', 'secret'))).resolves.toBe(code);
  });

  it('wraps errors thrown by the client', async () => {
    auth.signInWithPassword.mockRejectedValue(new TypeError('Network request failed'));

    await expect(caughtCode(signInWithPassword('alex@kiwi.test', 'secret'))).resolves.toBe(
      'UNKNOWN',
    );
  });

  it('signs out only this device', async () => {
    auth.signOut.mockResolvedValue({ error: null });

    await signOut();

    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('reports the stored user and later changes, then unsubscribes', () => {
    const unsubscribe = jest.fn();
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe } } });
    const listener = jest.fn();

    const stop = subscribeToSignedInUser(listener);
    const onChange = auth.onAuthStateChange.mock.calls[0][0];
    onChange('INITIAL_SESSION', { user: { id: 'u1', email: 'alex@kiwi.test' } });
    onChange('SIGNED_OUT', null);
    stop();

    expect(listener.mock.calls).toEqual([[{ id: 'u1', email: 'alex@kiwi.test' }], [null]]);
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('explains a missing setup instead of throwing', () => {
    mockedGetClient.mockImplementation(() => {
      throw new Error('EXPO_PUBLIC_SUPABASE_URL is not set.');
    });

    expect(getSignInSetupError()).toBe('EXPO_PUBLIC_SUPABASE_URL is not set.');
  });

  it('has no setup error when the client can be created', () => {
    expect(getSignInSetupError()).toBeNull();
  });
});
