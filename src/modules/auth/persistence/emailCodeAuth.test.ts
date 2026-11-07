import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';

import {
  AuthError,
  getSignInSetupError,
  requestEmailCode,
  signOut,
  subscribeToSignedInUser,
  verifyEmailCode,
} from '@/modules/auth/persistence/emailCodeAuth';
import { getSupabaseClient } from '@/shared/supabase/supabaseClient';

jest.mock('@/shared/supabase/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));

const auth = {
  signInWithOtp: jest.fn(),
  verifyOtp: jest.fn(),
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

describe('emailCodeAuth', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedGetClient.mockReturnValue({ auth } as unknown as ReturnType<typeof getSupabaseClient>);
  });

  it('requests a code and lets new emails create an account', async () => {
    auth.signInWithOtp.mockResolvedValue({ data: {}, error: null });

    await requestEmailCode('new@kiwi.test');

    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'new@kiwi.test',
      options: { shouldCreateUser: true },
    });
  });

  it('verifies the code as an email OTP', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: null });

    await verifyEmailCode('alex@kiwi.test', '123456');

    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: 'alex@kiwi.test',
      token: '123456',
      type: 'email',
    });
  });

  it.each([
    [new AuthApiError('Token has expired or is invalid', 403, 'otp_expired'), 'CODE_REJECTED'],
    [new AuthApiError('Invalid format', 400, 'validation_failed'), 'INVALID_EMAIL'],
    [new AuthApiError('Invalid email', 400, 'email_address_invalid'), 'INVALID_EMAIL'],
    [new AuthApiError('Rate limit', 429, 'over_email_send_rate_limit'), 'RATE_LIMITED'],
    [new AuthApiError('Too many requests', 429, undefined), 'RATE_LIMITED'],
    [new AuthRetryableFetchError('Failed to fetch', 0), 'NETWORK'],
    [new AuthApiError('Boom', 500, 'unexpected_failure'), 'UNKNOWN'],
  ])('maps %p returned by Supabase to %s', async (error, code) => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error });

    await expect(caughtCode(verifyEmailCode('alex@kiwi.test', '123456'))).resolves.toBe(code);
  });

  it('wraps errors thrown by the client', async () => {
    auth.signInWithOtp.mockRejectedValue(new TypeError('Network request failed'));

    await expect(caughtCode(requestEmailCode('alex@kiwi.test'))).resolves.toBe('UNKNOWN');
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
