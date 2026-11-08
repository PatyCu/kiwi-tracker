import { Household } from '@/modules/households/model/Household';
import { HouseholdMember } from '@/modules/households/model/HouseholdMember';
import { getSupabaseClient } from '@/shared/supabase/supabaseClient';

/**
 * Returns the signed-in user's household, or null when they aren't in one
 * yet. Access rules only return the user's own household, and each person
 * belongs to at most one. Throws when Supabase can't be reached or the query
 * fails.
 */
export async function loadHousehold(): Promise<Household | null> {
  const { data, error } = await getSupabaseClient()
    .from('households')
    .select('id, alias')
    .maybeSingle();
  if (error) throw new Error('Could not load the household.', { cause: error });
  return data ? { id: data.id, alias: data.alias } : null;
}

/**
 * Returns everyone in the signed-in user's household, the user included,
 * sorted by name. Access rules only return memberships of the user's own
 * household. Throws when Supabase can't be reached or the query fails.
 */
export async function loadHouseholdMembers(): Promise<HouseholdMember[]> {
  const { data, error } = await getSupabaseClient()
    .from('household_members')
    .select('user_id, display_name')
    .order('display_name');
  if (error) throw new Error('Could not load the household members.', { cause: error });
  return data.map((row) => ({ userId: row.user_id, displayName: row.display_name }));
}
