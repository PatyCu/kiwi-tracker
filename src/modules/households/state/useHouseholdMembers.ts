import { useCallback, useEffect, useState } from 'react';

import { useSession } from '@/modules/auth/state/SessionProvider';
import { HouseholdMember } from '@/modules/households/model/HouseholdMember';
import { loadHouseholdMembers } from '@/modules/households/persistence/householdStore';

export type HouseholdMembersState =
  { status: 'loading' } | { status: 'ready'; members: HouseholdMember[] } | { status: 'error' };

const LOADING: HouseholdMembersState = { status: 'loading' };

/**
 * Loads the signed-in user's household members when the caller mounts, and
 * again on retry or when a different user signs in.
 */
export function useHouseholdMembers(): {
  members: HouseholdMembersState;
  retryLoad: () => void;
} {
  const { session } = useSession();
  const userId = session.status === 'signed-in' ? session.user.id : null;
  const [loaded, setLoaded] = useState<{
    userId: string;
    attempt: number;
    members: HouseholdMembersState;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    loadHouseholdMembers()
      .then(
        (members): HouseholdMembersState => ({ status: 'ready', members }),
        (): HouseholdMembersState => ({ status: 'error' }),
      )
      .then((members) => {
        if (current) setLoaded({ userId, attempt, members });
      });
    return () => {
      current = false;
    };
  }, [userId, attempt]);

  const members =
    loaded && loaded.userId === userId && loaded.attempt === attempt ? loaded.members : LOADING;
  const retryLoad = useCallback(() => setAttempt((count) => count + 1), []);
  return { members, retryLoad };
}
