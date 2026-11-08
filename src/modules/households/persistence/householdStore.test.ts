import { loadHouseholdAlias } from '@/modules/households/persistence/householdStore';
import { getSupabaseClient } from '@/shared/supabase/supabaseClient';

jest.mock('@/shared/supabase/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));

const maybeSingle = jest.fn();
const select = jest.fn(() => ({ maybeSingle }));
const from = jest.fn(() => ({ select }));

describe('householdStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(getSupabaseClient)
      .mockReturnValue({ from } as unknown as ReturnType<typeof getSupabaseClient>);
  });

  it("returns the signed-in user's household alias", async () => {
    maybeSingle.mockResolvedValue({ data: { alias: 'The Burrow' }, error: null });

    await expect(loadHouseholdAlias()).resolves.toBe('The Burrow');
    expect(from).toHaveBeenCalledWith('households');
    expect(select).toHaveBeenCalledWith('alias');
  });

  it('returns null when the user is not in a household', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(loadHouseholdAlias()).resolves.toBeNull();
  });

  it('throws when the query fails', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'offline' } });

    await expect(loadHouseholdAlias()).rejects.toThrow('Could not load the household.');
  });
});
