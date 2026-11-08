import { isAuthApiError, isAuthRetryableFetchError, Session } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/shared/supabase/supabaseClient';

export type SignedInUser = {
  id: string;
  email: string;
};

export type AuthErrorCode =
  /** Supabase reports an unknown email and a wrong password the same way. */
  'INVALID_CREDENTIALS' | 'EMAIL_NOT_CONFIRMED' | 'RATE_LIMITED' | 'NETWORK' | 'UNKNOWN';

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
 * Signs in an existing account; accounts are created in the Supabase dashboard,
 * never from the app. The session is stored on the device and session listeners
 * hear about the new user. Throws an AuthError.
 */
export async function signInWithPassword(email: string, password: string): Promise<void> {
  let error: unknown;
  try {
    ({ error } = await getSupabaseClient().auth.signInWithPassword({ email, password }));
  } catch (thrown) {
    error = thrown;
  }
  if (error) throw new AuthError(toAuthErrorCode(error), 'Could not sign in.', error);
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

function toAuthErrorCode(error: unknown): AuthErrorCode {
  if (isAuthRetryableFetchError(error)) return 'NETWORK';
  if (!isAuthApiError(error)) return 'UNKNOWN';
  if (error.status === 429) return 'RATE_LIMITED';
  switch (error.code) {
    case 'invalid_credentials':
    case 'validation_failed':
      return 'INVALID_CREDENTIALS';
    case 'email_not_confirmed':
      return 'EMAIL_NOT_CONFIRMED';
    case 'over_request_rate_limit':
      return 'RATE_LIMITED';
    default:
      return 'UNKNOWN';
  }
}
