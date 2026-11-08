import { render } from '@testing-library/react-native';

import { useSession } from '@/modules/auth/state/SessionProvider';
import { AccountSection } from '@/modules/auth/ui/AccountSection';
import { AppearanceProvider } from '@/shared/theme/AppearanceProvider';

jest.mock('@/modules/auth/state/SessionProvider', () => ({ useSession: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('AccountSection', () => {
  it('shows who is signed in', () => {
    jest.mocked(useSession).mockReturnValue({
      session: { status: 'signed-in', user: { id: 'alex', email: 'alex@kiwi.test' } },
      signOut: jest.fn(),
    });

    const screen = render(<AccountSection />, { wrapper: AppearanceProvider });

    expect(screen.getByText('alex@kiwi.test')).toBeTruthy();
    expect(screen.getByText('Sign out')).toBeTruthy();
  });
});
