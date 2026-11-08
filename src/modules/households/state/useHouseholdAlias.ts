import { useHousehold } from '@/modules/households/state/HouseholdProvider';

/**
 * The signed-in user's household alias for labels, or null while it loads or
 * when it can't be loaded; callers show a fallback then. Accounts without a
 * household never reach these screens (see NoHouseholdScreen).
 */
export function useHouseholdAlias(): string | null {
  const { household } = useHousehold();
  return household.status === 'ready' ? household.alias : null;
}
