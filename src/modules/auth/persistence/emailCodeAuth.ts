import { isAuthApiError, isAuthRetryableFetchError, Session } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/shared/supabase/supabaseClient';

export type SignedInUser = {
  id: string;
  email: string;
};

export type AuthErrorCode =
  | 'INVALID_EMAIL'
  /** Supabase returns the same error for a wrong code and an expired or replaced one. */
  | 'CODE_REJECTED'
  | 'RATE_LIMITED'
  | 'NETWORK'
  | 'UNKNOWN';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly cause: unknown;

  constructor(code: AuthErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.cause = cause;
  }
}

/**
 * Emails a one-time sign-in code. Creates the account when the email is new.
 * Throws an AuthError.
 */
export async function requestEmailCode(email: string): Promise<void> {
  await runAuthCall('Could not send the sign-in code.', () =>
    getSupabaseClient().auth.signInWithOtp({ email, options: { shouldCreateUser: true } }),
  );
}

/**
 * Exchanges the emailed code for a session, which is stored on the device.
 * Session listeners hear about the new user. Throws an AuthError.
 */
export async function verifyEmailCode(email: string, code: string): Promise<void> {
  await runAuthCall('Could not verify the sign-in code.', () =>
    getSupabaseClient().auth.verifyOtp({ email, token: code, type: 'email' }),
  );
}

/**
 * Signs this device out. The stored session is removed before the server is
 * told, so this works offline too; a failed server call is not an error.
 */
export async function signOut(): Promise<void> {
  await getSupabaseClient().auth.signOut({ scope: 'local' });
}

/**
 * Returns why sign-in can't work on this build (missing or invalid Supabase
 * env vars), or null when it can.
 */
export function getSignInSetupError(): string | null {
  try {
    getSupabaseClient();
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Sign-in is not set up.';
  }
}

/**
 * Calls the listener with the stored user (or null) right away, then on every
 * sign-in, sign-out and token refresh. Returns the unsubscribe function.
 * Check getSignInSetupError first: this throws when the Supabase env vars are missing.
 */
export function subscribeToSignedInUser(listener: (user: SignedInUser | null) => void): () => void {
  const { data } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
    // Runs inside the auth lock: never await other Supabase calls here.
    listener(toSignedInUser(session));
  });
  return () => data.subscription.unsubscribe();
}

function toSignedInUser(session: Session | null): SignedInUser | null {
  if (!session) return null;
  return { id: session.user.id, email: session.user.email ?? '' };
}

async function runAuthCall(
  message: string,
  call: () => Promise<{ error: unknown }>,
): Promise<void> {
  let error: unknown;
  try {
    ({ error } = await call());
  } catch (thrown) {
    error = thrown;
  }
  if (error) throw new AuthError(toAuthErrorCode(error), message, error);
}

function toAuthErrorCode(error: unknown): AuthErrorCode {
  if (isAuthRetryableFetchError(error)) return 'NETWORK';
  if (!isAuthApiError(error)) return 'UNKNOWN';
  if (error.status === 429) return 'RATE_LIMITED';
  switch (error.code) {
    case 'otp_expired':
      return 'CODE_REJECTED';
    case 'validation_failed':
    case 'email_address_invalid':
      return 'INVALID_EMAIL';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'RATE_LIMITED';
    default:
      return 'UNKNOWN';
  }
}
