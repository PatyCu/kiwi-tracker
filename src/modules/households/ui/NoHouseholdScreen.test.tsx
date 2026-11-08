import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { useSession } from '@/modules/auth/state/SessionProvider';
import { useHousehold } from '@/modules/households/state/HouseholdProvider';
import { NoHouseholdScreen } from '@/modules/households/ui/NoHouseholdScreen';
import { AppearanceProvider } from '@/shared/theme/AppearanceProvider';

jest.mock('@/modules/auth/state/SessionProvider', () => ({ useSession: jest.fn() }));
jest.mock('@/modules/households/state/HouseholdProvider', () => ({ useHousehold: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const signOut = jest.fn();
const retryLoad = jest.fn();

describe('NoHouseholdScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(useSession).mockReturnValue({
      session: { status: 'signed-in', user: { id: 'jo', email: 'jo@kiwi.test' } },
      signOut,
    });
    jest.mocked(useHousehold).mockReturnValue({ household: { status: 'missing' }, retryLoad });
  });

  it('explains that the account needs a household instead of opening an empty app', () => {
    const screen = render(<NoHouseholdScreen />, { wrapper: AppearanceProvider });

    expect(screen.getByText("This account isn't in a household yet")).toBeTruthy();
    expect(screen.getByText(/jo@kiwi\.test needs to be added to a household/)).toBeTruthy();
  });

  it('checks again and signs out', () => {
    signOut.mockResolvedValue(undefined);
    const screen = render(<NoHouseholdScreen />, { wrapper: AppearanceProvider });

    fireEvent.press(screen.getByText('Check again'));
    fireEvent.press(screen.getByText('Sign out'));

    expect(retryLoad).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('says so when signing out fails', async () => {
    signOut.mockRejectedValue(new Error('offline'));
    const screen = render(<NoHouseholdScreen />, { wrapper: AppearanceProvider });

    fireEvent.press(screen.getByText('Sign out'));

    await waitFor(() => expect(screen.getByText('Could not sign out. Try again.')).toBeTruthy());
  });
});
