import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { useSession } from '@/modules/auth/state/SessionProvider';
import { loadHouseholdMembers } from '@/modules/households/persistence/householdStore';
import { useHouseholdAlias } from '@/modules/households/state/useHouseholdAlias';
import { HouseholdSection } from '@/modules/households/ui/HouseholdSection';
import { AppearanceProvider } from '@/shared/theme/AppearanceProvider';

jest.mock('@/modules/auth/state/SessionProvider', () => ({ useSession: jest.fn() }));
jest.mock('@/modules/households/state/useHouseholdAlias', () => ({
  useHouseholdAlias: jest.fn(),
}));
jest.mock('@/modules/households/persistence/householdStore', () => ({
  loadHouseholdMembers: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockedLoad = jest.mocked(loadHouseholdMembers);

describe('HouseholdSection', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(useSession).mockReturnValue({
      session: { status: 'signed-in', user: { id: 'alex', email: 'alex@kiwi.test' } },
      signOut: jest.fn(),
    });
    jest.mocked(useHouseholdAlias).mockReturnValue('The Burrow');
  });

  it('shows the household and its members by name, marking the signed-in user', async () => {
    mockedLoad.mockResolvedValue([
      { userId: 'alex', displayName: 'Alex' },
      { userId: 'sam', displayName: 'Sam' },
    ]);

    const screen = render(<HouseholdSection />, { wrapper: AppearanceProvider });

    expect(screen.getByText('The Burrow')).toBeTruthy();
    expect(screen.getByText('Loading…')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Sam')).toBeTruthy());
    expect(screen.getByText(/Alex/)).toHaveTextContent('Alex (you)');
    expect(screen.queryByText(/@kiwi\.test/)).toBeNull();
  });

  it('says so when the members cannot be loaded, and retries', async () => {
    mockedLoad
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([{ userId: 'alex', displayName: 'Alex' }]);
    const screen = render(<HouseholdSection />, { wrapper: AppearanceProvider });
    await waitFor(() => expect(screen.getByText('Could not load the members.')).toBeTruthy());

    fireEvent.press(screen.getByText('Retry'));

    await waitFor(() => expect(screen.getByText(/Alex/)).toHaveTextContent('Alex (you)'));
    expect(mockedLoad).toHaveBeenCalledTimes(2);
  });
});
