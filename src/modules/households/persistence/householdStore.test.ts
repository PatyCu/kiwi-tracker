import {
  loadHousehold,
  loadHouseholdMembers,
} from '@/modules/households/persistence/householdStore';
import { getSupabaseClient } from '@/shared/supabase/supabaseClient';

jest.mock('@/shared/supabase/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));

const maybeSingle = jest.fn();
const order = jest.fn();
const select = jest.fn(() => ({ maybeSingle, order }));
const from = jest.fn(() => ({ select }));

describe('householdStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(getSupabaseClient)
      .mockReturnValue({ from } as unknown as ReturnType<typeof getSupabaseClient>);
  });

  describe('loadHousehold', () => {
    it("returns the signed-in user's household", async () => {
      maybeSingle.mockResolvedValue({ data: { id: 'burrow', alias: 'The Burrow' }, error: null });

      await expect(loadHousehold()).resolves.toEqual({ id: 'burrow', alias: 'The Burrow' });
      expect(from).toHaveBeenCalledWith('households');
      expect(select).toHaveBeenCalledWith('id, alias');
    });

    it('returns null when the user is not in a household', async () => {
      maybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(loadHousehold()).resolves.toBeNull();
    });

    it('throws when the query fails', async () => {
      maybeSingle.mockResolvedValue({ data: null, error: { message: 'offline' } });

      await expect(loadHousehold()).rejects.toThrow('Could not load the household.');
    });
  });

  describe('loadHouseholdMembers', () => {
    it('returns the household members by name, without their emails', async () => {
      order.mockResolvedValue({
        data: [
          { user_id: 'alex', display_name: 'Alex' },
          { user_id: 'sam', display_name: 'Sam' },
        ],
        error: null,
      });

      await expect(loadHouseholdMembers()).resolves.toEqual([
        { userId: 'alex', displayName: 'Alex' },
        { userId: 'sam', displayName: 'Sam' },
      ]);
      expect(from).toHaveBeenCalledWith('household_members');
      expect(select).toHaveBeenCalledWith('user_id, display_name');
      expect(order).toHaveBeenCalledWith('display_name');
    });

    it('throws when the query fails', async () => {
      order.mockResolvedValue({ data: null, error: { message: 'offline' } });

      await expect(loadHouseholdMembers()).rejects.toThrow('Could not load the household members.');
    });
  });
});
