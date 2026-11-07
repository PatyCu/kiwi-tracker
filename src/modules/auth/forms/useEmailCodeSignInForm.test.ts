import { act, renderHook } from '@testing-library/react-native';

import { useEmailCodeSignInForm } from '@/modules/auth/forms/useEmailCodeSignInForm';
import {
  AuthError,
  requestEmailCode,
  verifyEmailCode,
} from '@/modules/auth/persistence/emailCodeAuth';

jest.mock('@/shared/supabase/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));
jest.mock('@/modules/auth/persistence/emailCodeAuth', () => {
  const actual = jest.requireActual('@/modules/auth/persistence/emailCodeAuth');
  return { AuthError: actual.AuthError, requestEmailCode: jest.fn(), verifyEmailCode: jest.fn() };
});

const mockedRequest = jest.mocked(requestEmailCode);
const mockedVerify = jest.mocked(verifyEmailCode);

async function renderOnCodeStep() {
  const hook = renderHook(() => useEmailCodeSignInForm());
  act(() => hook.result.current.setEmail('  Alex@Kiwi.test '));
  await act(() => hook.result.current.submitEmail());
  return hook;
}

describe('useEmailCodeSignInForm', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedRequest.mockResolvedValue();
    mockedVerify.mockResolvedValue();
  });

  it('sends a code to the normalized email and moves to the code step', async () => {
    const { result } = await renderOnCodeStep();

    expect(mockedRequest).toHaveBeenCalledWith('alex@kiwi.test');
    expect(result.current).toMatchObject({
      step: 'code',
      email: 'alex@kiwi.test',
      error: null,
      pending: null,
    });
  });

  it('rejects a malformed email without calling the server', async () => {
    const { result } = renderHook(() => useEmailCodeSignInForm());
    act(() => result.current.setEmail('alex@kiwi'));

    await act(() => result.current.submitEmail());

    expect(mockedRequest).not.toHaveBeenCalled();
    expect(result.current.step).toBe('email');
    expect(result.current.error).toBe('Enter a valid email address.');
  });

  it('stays on the email step with a clear message when the network fails', async () => {
    mockedRequest.mockRejectedValue(new AuthError('NETWORK', 'offline'));
    const { result } = renderHook(() => useEmailCodeSignInForm());
    act(() => result.current.setEmail('alex@kiwi.test'));

    await act(() => result.current.submitEmail());

    expect(result.current.step).toBe('email');
    expect(result.current.error).toBe(
      "Can't reach Kiwi Tracker. Check your connection and try again.",
    );
  });

  it('keeps only digits of the code and verifies it', async () => {
    const { result } = await renderOnCodeStep();
    act(() => result.current.setCode('123 456'));

    await act(() => result.current.submitCode());

    expect(result.current.code).toBe('123456');
    expect(mockedVerify).toHaveBeenCalledWith('alex@kiwi.test', '123456');
    // The session gate unmounts the form on success, so it stays busy.
    expect(result.current.pending).toBe('verifying');
  });

  it('asks for all six digits before verifying', async () => {
    const { result } = await renderOnCodeStep();
    act(() => result.current.setCode('123'));

    await act(() => result.current.submitCode());

    expect(mockedVerify).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Enter the 6-digit code from the email.');
  });

  it('explains a wrong or expired code and lets the user retry', async () => {
    mockedVerify.mockRejectedValueOnce(new AuthError('CODE_REJECTED', 'rejected'));
    const { result } = await renderOnCodeStep();
    act(() => result.current.setCode('000000'));

    await act(() => result.current.submitCode());

    expect(result.current.error).toMatch(/wrong or has expired/);
    expect(result.current.pending).toBeNull();

    act(() => result.current.setCode('123456'));
    expect(result.current.error).toBeNull();
  });

  it('resends a code, clears the old one and says earlier codes stop working', async () => {
    const { result } = await renderOnCodeStep();
    act(() => result.current.setCode('111111'));

    await act(() => result.current.resendCode());

    expect(mockedRequest).toHaveBeenCalledTimes(2);
    expect(result.current.code).toBe('');
    expect(result.current.notice).toMatch(/new code to alex@kiwi.test/);
  });

  it('shows a rate limit on resend', async () => {
    const { result } = await renderOnCodeStep();
    mockedRequest.mockRejectedValueOnce(new AuthError('RATE_LIMITED', 'slow down'));

    await act(() => result.current.resendCode());

    expect(result.current.step).toBe('code');
    expect(result.current.error).toBe('Too many attempts. Wait a minute, then try again.');
  });

  it('goes back to the email step keeping the email', async () => {
    const { result } = await renderOnCodeStep();

    act(() => result.current.changeEmail());

    expect(result.current).toMatchObject({ step: 'email', email: 'alex@kiwi.test', code: '' });
  });
});
