import { useCallback, useState } from 'react';

import {
  AuthError,
  AuthErrorCode,
  signInWithPassword,
} from '@/modules/auth/persistence/passwordAuth';

const errorMessages: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: 'That email and password don’t match an account.',
  EMAIL_NOT_CONFIRMED: 'This account isn’t confirmed yet. Ask whoever set it up to confirm it.',
  RATE_LIMITED: 'Too many attempts. Wait a minute, then try again.',
  NETWORK: "Can't reach Kiwi Tracker. Check your connection and try again.",
  UNKNOWN: 'Something went wrong. Try again.',
};

const MISSING_FIELDS_MESSAGE = 'Enter your email and password.';

/**
 * Email and password sign-in for existing accounts. On success the session
 * listener switches the app over, so the form stays "signing in" until it unmounts.
 */
export function usePasswordSignInForm() {
  const [email, setEmailInput] = useState('');
  const [password, setPasswordInput] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setEmail = useCallback((value: string) => {
    setEmailInput(value);
    setError(null);
  }, []);

  const setPassword = useCallback((value: string) => {
    setPasswordInput(value);
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    if (signingIn) return;
    const normalizedEmail = email.trim().toLowerCase();
    // Passwords are sent as typed: spaces can be part of them.
    if (!normalizedEmail || !password) {
      setError(MISSING_FIELDS_MESSAGE);
      return;
    }
    setSigningIn(true);
    setError(null);
    try {
      await signInWithPassword(normalizedEmail, password);
    } catch (thrown) {
      setError(thrown instanceof AuthError ? errorMessages[thrown.code] : errorMessages.UNKNOWN);
      setSigningIn(false);
    }
  }, [email, password, signingIn]);

  return { email, password, signingIn, error, setEmail, setPassword, submit };
}
