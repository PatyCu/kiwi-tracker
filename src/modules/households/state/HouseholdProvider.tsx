import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useSession } from '@/modules/auth/state/SessionProvider';
import { loadHousehold } from '@/modules/households/persistence/householdStore';

export type HouseholdState =
  | { status: 'loading' }
  | { status: 'ready'; id: string; alias: string }
  /** Signed in, but the account was never added to a household: a setup mistake. */
  | { status: 'missing' }
  | { status: 'error' };

type HouseholdContextValue = {
  household: HouseholdState;
  retryLoad: () => void;
};

const HouseholdContext = createContext<HouseholdContextValue | null>(null);
// One shared object, so the context value only changes when the state does.
const LOADING: HouseholdState = { status: 'loading' };

/** Loads the signed-in user's household once, and again when a different user signs in. */
export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session.status === 'signed-in' ? session.user.id : null;
  const [loaded, setLoaded] = useState<{ userId: string; household: HouseholdState } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    loadHousehold()
      .then(
        (loaded): HouseholdState =>
          loaded ? { status: 'ready', ...loaded } : { status: 'missing' },
        (): HouseholdState => ({ status: 'error' }),
      )
      .then((household) => {
        if (current) setLoaded({ userId, household });
      });
    return () => {
      current = false;
    };
  }, [userId, attempt]);

  const household: HouseholdState = loaded && loaded.userId === userId ? loaded.household : LOADING;
  const retryLoad = useCallback(() => setAttempt((count) => count + 1), []);
  const value = useMemo(() => ({ household, retryLoad }), [household, retryLoad]);

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold(): HouseholdContextValue {
  const value = useContext(HouseholdContext);
  if (!value) throw new Error('useHousehold must be used inside HouseholdProvider.');
  return value;
}
