import { useHousehold } from '@/modules/households/state/HouseholdProvider';

/**
 * The signed-in user's household alias for labels, or null when there is no
 * loaded household; callers show a fallback then. The app's screens only open
 * once the household has loaded (see the root layout).
 */
export function useHouseholdAlias(): string | null {
  const { household } = useHousehold();
  return household.status === 'ready' ? household.alias : null;
}
