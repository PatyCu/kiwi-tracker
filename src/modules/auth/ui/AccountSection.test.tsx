import { render } from '@testing-library/react-native';

import { useSession } from '@/modules/auth/state/SessionProvider';
import { AccountSection } from '@/modules/auth/ui/AccountSection';
import { useHouseholdAlias } from '@/modules/households/state/useHouseholdAlias';
import { AppearanceProvider } from '@/shared/theme/AppearanceProvider';

jest.mock('@/modules/auth/state/SessionProvider', () => ({ useSession: jest.fn() }));
jest.mock('@/modules/households/state/useHouseholdAlias', () => ({
  useHouseholdAlias: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('AccountSection', () => {
  beforeEach(() => {
    jest.mocked(useSession).mockReturnValue({
      session: { status: 'signed-in', user: { id: 'alex', email: 'alex@kiwi.test' } },
      signOut: jest.fn(),
    });
  });

  it('shows the household the signed-in user belongs to', () => {
    jest.mocked(useHouseholdAlias).mockReturnValue('The Burrow');

    const screen = render(<AccountSection />, { wrapper: AppearanceProvider });

    expect(screen.getByText('alex@kiwi.test')).toBeTruthy();
    expect(screen.getByText('Household')).toBeTruthy();
    expect(screen.getByText('The Burrow')).toBeTruthy();
  });

  it('leaves the household out until there is one to show', () => {
    jest.mocked(useHouseholdAlias).mockReturnValue(null);

    const screen = render(<AccountSection />, { wrapper: AppearanceProvider });

    expect(screen.getByText('alex@kiwi.test')).toBeTruthy();
    expect(screen.queryByText('Household')).toBeNull();
  });
});
