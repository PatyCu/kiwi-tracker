import { act, renderHook } from '@testing-library/react-native';

import { usePasswordSignInForm } from '@/modules/auth/forms/usePasswordSignInForm';
import { AuthError, signInWithPassword } from '@/modules/auth/persistence/passwordAuth';

jest.mock('@/shared/supabase/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));
jest.mock('@/modules/auth/persistence/passwordAuth', () => {
  const actual = jest.requireActual('@/modules/auth/persistence/passwordAuth');
  return { AuthError: actual.AuthError, signInWithPassword: jest.fn() };
});

const mockedSignIn = jest.mocked(signInWithPassword);

function renderFilledForm(email: string, password: string) {
  const hook = renderHook(() => usePasswordSignInForm());
  act(() => {
    hook.result.current.setEmail(email);
    hook.result.current.setPassword(password);
  });
  return hook;
}

describe('usePasswordSignInForm', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedSignIn.mockResolvedValue();
  });

  it('signs in with the normalized email and the password as typed', async () => {
    const { result } = renderFilledForm('  Alex@Kiwi.test ', ' pass word ');

    await act(() => result.current.submit());

    expect(mockedSignIn).toHaveBeenCalledWith('alex@kiwi.test', ' pass word ');
    expect(result.current).toMatchObject({ signingIn: true, error: null });
  });

  it.each([
    ['', 'secret'],
    ['alex@kiwi.test', ''],
  ])('asks for both fields without calling the server (%p, %p)', async (email, password) => {
    const { result } = renderFilledForm(email, password);

    await act(() => result.current.submit());

    expect(mockedSignIn).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Enter your email and password.');
  });

  it('shows the error and lets the person try again when sign-in fails', async () => {
    mockedSignIn.mockRejectedValue(new AuthError('INVALID_CREDENTIALS', 'Could not sign in.'));
    const { result } = renderFilledForm('alex@kiwi.test', 'wrong');

    await act(() => result.current.submit());

    expect(result.current).toMatchObject({
      signingIn: false,
      error: 'That email and password don’t match an account.',
    });

    act(() => result.current.setPassword('right'));
    expect(result.current.error).toBeNull();
  });

  it('treats unexpected errors as unknown', async () => {
    mockedSignIn.mockRejectedValue(new Error('boom'));
    const { result } = renderFilledForm('alex@kiwi.test', 'secret');

    await act(() => result.current.submit());

    expect(result.current.error).toBe('Something went wrong. Try again.');
  });
});
