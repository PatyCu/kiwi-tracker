import { act, renderHook } from '@testing-library/react-native';
import { ReactNode } from 'react';

import {
  getSignInSetupError,
  SignedInUser,
  signOut,
  subscribeToSignedInUser,
} from '@/modules/auth/persistence/passwordAuth';
import { SessionProvider, useSession } from '@/modules/auth/state/SessionProvider';

jest.mock('@/modules/auth/persistence/passwordAuth', () => ({
  getSignInSetupError: jest.fn(),
  signOut: jest.fn(),
  subscribeToSignedInUser: jest.fn(),
}));

const mockedSubscribe = jest.mocked(subscribeToSignedInUser);
const wrapper = ({ children }: { children: ReactNode }) => (
  <SessionProvider>{children}</SessionProvider>
);
const alex: SignedInUser = { id: 'u1', email: 'alex@kiwi.test' };

describe('SessionProvider', () => {
  let emit: (user: SignedInUser | null) => void;
  const unsubscribe = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(getSignInSetupError).mockReturnValue(null);
    mockedSubscribe.mockImplementation((listener) => {
      emit = listener;
      return unsubscribe;
    });
  });

  it('is loading until the stored session has been read', () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    expect(result.current.session).toEqual({ status: 'loading' });
  });

  it('follows sign-in and sign-out', () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => emit(null));
    expect(result.current.session).toEqual({ status: 'signed-out' });

    act(() => emit(alex));
    expect(result.current.session).toEqual({ status: 'signed-in', user: alex });

    act(() => emit(null));
    expect(result.current.session).toEqual({ status: 'signed-out' });
  });

  it('keeps the same state when a token refresh reports the same user', () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => emit(alex));
    const before = result.current.session;

    act(() => emit({ ...alex }));

    expect(result.current.session).toBe(before);
  });

  it('is unavailable without subscribing when Supabase is not set up', () => {
    jest.mocked(getSignInSetupError).mockReturnValue('EXPO_PUBLIC_SUPABASE_URL is not set.');

    const { result } = renderHook(() => useSession(), { wrapper });

    expect(result.current.session).toEqual({
      status: 'unavailable',
      message: 'EXPO_PUBLIC_SUPABASE_URL is not set.',
    });
    expect(mockedSubscribe).not.toHaveBeenCalled();
  });

  it('signs out through the auth module and unsubscribes on unmount', async () => {
    const { result, unmount } = renderHook(() => useSession(), { wrapper });

    await act(() => result.current.signOut());
    unmount();

    expect(signOut).toHaveBeenCalled();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
