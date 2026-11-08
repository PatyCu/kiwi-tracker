import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import {
  getSignInSetupError,
  SignedInUser,
  signOut,
  subscribeToSignedInUser,
} from '@/modules/auth/persistence/passwordAuth';

export type SessionState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: SignedInUser }
  /** Sign-in can't work at all, for example because the Supabase env vars are missing. */
  | { status: 'unavailable'; message: string };

type SessionContextValue = {
  session: SessionState;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(() => {
    const setupError = getSignInSetupError();
    return setupError ? { status: 'unavailable', message: setupError } : { status: 'loading' };
  });
  const available = session.status !== 'unavailable';

  useEffect(() => {
    if (!available) return;
    return subscribeToSignedInUser((user) => setSession((current) => nextSession(current, user)));
  }, [available]);

  const value = useMemo<SessionContextValue>(() => ({ session, signOut }), [session]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/** Token refreshes report the same user again; keeping the old state avoids re-rendering the app. */
function nextSession(current: SessionState, user: SignedInUser | null): SessionState {
  if (!user) return current.status === 'signed-out' ? current : { status: 'signed-out' };
  const unchanged =
    current.status === 'signed-in' &&
    current.user.id === user.id &&
    current.user.email === user.email;
  return unchanged ? current : { status: 'signed-in', user };
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider.');
  return value;
}
