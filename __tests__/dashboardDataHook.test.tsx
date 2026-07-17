import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useDashboardData } from '@/hooks/useDashboardData';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockedStorage = jest.mocked(AsyncStorage);

describe('useDashboardData', () => {
  beforeEach(() => {
    mockedStorage.clear();
    jest.clearAllMocks();
  });

  it('loads the local dashboard and persists health events through its public action', async () => {
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    await act(async () => {
      await result.current.logHealthEvent('Asthma', 'Recovered quickly.');
    });

    expect(result.current.healthEvents).toHaveLength(1);
    expect(result.current.healthEvents[0]).toMatchObject({
      petId: 'kiwi',
      kind: 'Asthma',
      note: 'Recovered quickly.',
    });
  });
});
