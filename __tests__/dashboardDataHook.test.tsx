import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useDashboardData } from '@/hooks/useDashboardData';
import { HealthEventStorageError } from '@/lib/healthEvents';

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
      await result.current.logHealthEvent(
        'Asthma',
        'Recovered quickly.',
        '2026-07-16T09:30:00.000Z',
      );
    });

    expect(result.current.healthEvents).toHaveLength(1);
    expect(result.current.healthEvents[0]).toMatchObject({
      petId: 'kiwi',
      kind: 'Asthma',
      note: 'Recovered quickly.',
      occurredAt: '2026-07-16T09:30:00.000Z',
    });
  });

  it('persists an event deletion before removing it from the dashboard', async () => {
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    await act(async () => {
      await result.current.logHealthEvent(
        'Asthma',
        'First observation.',
        '2026-07-16T09:30:00.000Z',
      );
    });
    await act(async () => {
      await result.current.logHealthEvent(
        'Vomiting',
        'Second observation.',
        '2026-07-17T09:30:00.000Z',
      );
    });

    const eventToDelete = result.current.healthEvents[0];
    await act(async () => {
      await result.current.deleteHealthEvent(eventToDelete.id);
    });

    expect(result.current.healthEvents).toHaveLength(1);
    expect(result.current.healthEvents[0].note).toBe('First observation.');
    await expect(mockedStorage.getItem('@kiwi-tracker/health-events/v1')).resolves.toBe(
      JSON.stringify(result.current.healthEvents),
    );
  });

  it('keeps an event displayed when deleting it cannot be persisted', async () => {
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    await act(async () => {
      await result.current.logHealthEvent(
        'Asthma',
        'Keep this observation.',
        '2026-07-16T09:30:00.000Z',
      );
    });

    const eventToDelete = result.current.healthEvents[0];
    mockedStorage.setItem.mockRejectedValueOnce(new Error('disk full'));

    await act(async () => {
      await expect(result.current.deleteHealthEvent(eventToDelete.id)).rejects.toBeInstanceOf(
        HealthEventStorageError,
      );
    });

    expect(result.current.healthEvents).toEqual([eventToDelete]);
    expect(result.current.deletingHealthEventId).toBeNull();
  });
});
