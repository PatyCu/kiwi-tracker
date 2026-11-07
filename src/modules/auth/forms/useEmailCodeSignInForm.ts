import { useCallback, useState } from 'react';

import {
  EMAIL_CODE_LENGTH,
  isValidEmail,
  isValidEmailCode,
  normalizeEmail,
  normalizeEmailCode,
} from '@/modules/auth/model/emailCode';
import {
  AuthError,
  AuthErrorCode,
  requestEmailCode,
  verifyEmailCode,
} from '@/modules/auth/persistence/emailCodeAuth';

export type SignInStep = 'email' | 'code';
export type SignInPending = 'sending' | 'resending' | 'verifying' | null;

const errorMessages: Record<AuthErrorCode, string> = {
  INVALID_EMAIL: 'Enter a valid email address.',
  CODE_REJECTED:
    'That code is wrong or has expired. Use the code from the latest email, or send a new one.',
  RATE_LIMITED: 'Too many attempts. Wait a minute, then try again.',
  NETWORK: "Can't reach Kiwi Tracker. Check your connection and try again.",
  UNKNOWN: 'Something went wrong. Try again.',
};

const CODE_FORMAT_MESSAGE = `Enter the ${EMAIL_CODE_LENGTH}-digit code from the email.`;

/**
 * Two-step email code sign-in: send a code to an email, then enter it.
 * On success the session listener switches the app over, so the form keeps
 * its "verifying" state until it unmounts.
 */
export function useEmailCodeSignInForm() {
  const [step, setStep] = useState<SignInStep>('email');
  const [email, setEmailInput] = useState('');
  const [code, setCodeInput] = useState('');
  const [pending, setPending] = useState<SignInPending>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const setEmail = useCallback((value: string) => {
    setEmailInput(value);
    setError(null);
  }, []);

  const setCode = useCallback((value: string) => {
    setCodeInput(normalizeEmailCode(value));
    setError(null);
  }, []);

  const sendCode = useCallback(
    async (kind: 'sending' | 'resending'): Promise<boolean> => {
      const normalized = normalizeEmail(email);
      if (!isValidEmail(normalized)) {
        setError(errorMessages.INVALID_EMAIL);
        return false;
      }
      setPending(kind);
      setError(null);
      setNotice(null);
      try {
        await requestEmailCode(normalized);
        setEmailInput(normalized);
        return true;
      } catch (thrown) {
        setError(toMessage(thrown));
        return false;
      } finally {
        setPending(null);
      }
    },
    [email],
  );

  const submitEmail = useCallback(async () => {
    if (pending) return;
    if (await sendCode('sending')) {
      setCode('');
      setStep('code');
    }
  }, [pending, sendCode, setCode]);

  const resendCode = useCallback(async () => {
    if (pending) return;
    if (await sendCode('resending')) {
      setCodeInput('');
      setNotice(`We sent a new code to ${normalizeEmail(email)}. Earlier codes no longer work.`);
    }
  }, [email, pending, sendCode]);

  const submitCode = useCallback(async () => {
    if (pending) return;
    if (!isValidEmailCode(code)) {
      setError(CODE_FORMAT_MESSAGE);
      return;
    }
    setPending('verifying');
    setError(null);
    setNotice(null);
    try {
      await verifyEmailCode(email, code);
    } catch (thrown) {
      setError(toMessage(thrown));
      setPending(null);
    }
  }, [code, email, pending]);

  const changeEmail = useCallback(() => {
    if (pending) return;
    setStep('email');
    setCodeInput('');
    setError(null);
    setNotice(null);
  }, [pending]);

  return {
    step,
    email,
    code,
    pending,
    error,
    notice,
    setEmail,
    setCode,
    submitEmail,
    submitCode,
    resendCode,
    changeEmail,
  };
}

function toMessage(error: unknown): string {
  return error instanceof AuthError ? errorMessages[error.code] : errorMessages.UNKNOWN;
}
