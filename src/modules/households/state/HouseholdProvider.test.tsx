import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { SessionState, useSession } from '@/modules/auth/state/SessionProvider';
import { loadHousehold } from '@/modules/households/persistence/householdStore';
import { HouseholdProvider, useHousehold } from '@/modules/households/state/HouseholdProvider';

jest.mock('@/modules/auth/state/SessionProvider', () => ({ useSession: jest.fn() }));
jest.mock('@/modules/households/persistence/householdStore', () => ({
  loadHousehold: jest.fn(),
}));

const mockedLoad = jest.mocked(loadHousehold);
const alexsHome = { id: 'alexs-home', alias: "Alex's home" };
const wrapper = ({ children }: { children: ReactNode }) => (
  <HouseholdProvider>{children}</HouseholdProvider>
);

function signInAs(id: string) {
  const session: SessionState = { status: 'signed-in', user: { id, email: `${id}@kiwi.test` } };
  jest.mocked(useSession).mockReturnValue({ session, signOut: jest.fn() });
}

describe('HouseholdProvider', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    signInAs('alex');
  });

  it("loads the signed-in user's household", async () => {
    mockedLoad.mockResolvedValue(alexsHome);

    const { result } = renderHook(() => useHousehold(), { wrapper });

    expect(result.current.household).toEqual({ status: 'loading' });
    await waitFor(() =>
      expect(result.current.household).toEqual({ status: 'ready', ...alexsHome }),
    );
  });

  it('reports a signed-in account without a household as missing', async () => {
    mockedLoad.mockResolvedValue(null);

    const { result } = renderHook(() => useHousehold(), { wrapper });

    await waitFor(() => expect(result.current.household).toEqual({ status: 'missing' }));
  });

  it('keeps a failed load apart from a missing household', async () => {
    mockedLoad.mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useHousehold(), { wrapper });

    await waitFor(() => expect(result.current.household).toEqual({ status: 'error' }));
  });

  it('checks again on retry, so a newly added membership is picked up', async () => {
    mockedLoad.mockResolvedValueOnce(null).mockResolvedValueOnce(alexsHome);
    const { result } = renderHook(() => useHousehold(), { wrapper });
    await waitFor(() => expect(result.current.household).toEqual({ status: 'missing' }));

    act(() => result.current.retryLoad());

    await waitFor(() =>
      expect(result.current.household).toEqual({ status: 'ready', ...alexsHome }),
    );
  });

  it('shows loading again while a retry after a failed load runs', async () => {
    mockedLoad.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(alexsHome);
    const { result } = renderHook(() => useHousehold(), { wrapper });
    await waitFor(() => expect(result.current.household).toEqual({ status: 'error' }));

    act(() => result.current.retryLoad());

    expect(result.current.household).toEqual({ status: 'loading' });
    await waitFor(() =>
      expect(result.current.household).toEqual({ status: 'ready', ...alexsHome }),
    );
  });

  it('loads again for a different user instead of showing the previous household', async () => {
    mockedLoad
      .mockResolvedValueOnce(alexsHome)
      .mockResolvedValueOnce({ id: 'sams-home', alias: "Sam's home" });
    const { result, rerender } = renderHook(() => useHousehold(), { wrapper });
    await waitFor(() => expect(result.current.household).toMatchObject({ alias: "Alex's home" }));

    signInAs('sam');
    rerender({});

    expect(result.current.household).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current.household).toMatchObject({ alias: "Sam's home" }));
  });
});
