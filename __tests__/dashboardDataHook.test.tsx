import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useDashboardData } from '@/hooks/useDashboardData';
import { TimelineEventStorageError } from '@/lib/timelineEvents';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockedStorage = jest.mocked(AsyncStorage);
const storageKey = '@kiwi-tracker/timeline-events/v1';

describe('useDashboardData', () => {
  beforeEach(() => {
    mockedStorage.clear();
    jest.clearAllMocks();
  });

  it('persists symptoms using the symptom nomenclature', async () => {
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    await act(async () => {
      await result.current.logSymptom('Asthma', 'Recovered quickly.', '2026-07-16T09:30:00.000Z');
    });

    expect(result.current.timelineEvents).toHaveLength(1);
    expect(result.current.timelineEvents[0]).toMatchObject({
      petId: 'kiwi',
      type: 'symptom',
      symptom: 'Asthma',
      note: 'Recovered quickly.',
      occurredAt: '2026-07-16T09:30:00.000Z',
    });
  });

  it('persists a diet change and exposes the resulting current diet', async () => {
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    await act(async () => {
      await result.current.logDietChange(
        {
          type: 'add',
          item: { productName: 'Greenies Dental chew', foodType: 'snack' },
        },
        'One after dinner.',
        '2026-07-16T09:30:00.000Z',
      );
    });

    expect(result.current.timelineEvents[0]).toMatchObject({
      type: 'diet-change',
      change: {
        type: 'add',
        item: { productName: 'Greenies Dental chew', foodType: 'snack' },
      },
    });
    expect(result.current.currentDiet).toHaveLength(1);
    expect(result.current.currentDiet[0]).toMatchObject({
      productName: 'Greenies Dental chew',
      foodType: 'snack',
    });
  });

  it('persists an event deletion before removing it from the dashboard', async () => {
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    await act(async () => {
      await result.current.logSymptom('Asthma', 'First observation.', '2026-07-16T09:30:00.000Z');
    });
    await act(async () => {
      await result.current.logSymptom(
        'Vomiting',
        'Second observation.',
        '2026-07-17T09:30:00.000Z',
      );
    });

    const eventToDelete = result.current.timelineEvents[0];
    await act(async () => {
      await result.current.deleteTimelineEvent(eventToDelete.id);
    });

    expect(result.current.timelineEvents).toHaveLength(1);
    expect(result.current.timelineEvents[0].note).toBe('First observation.');
    await expect(mockedStorage.getItem(storageKey)).resolves.toBe(
      JSON.stringify(result.current.timelineEvents),
    );
  });

  it('keeps an event displayed when deleting it cannot be persisted', async () => {
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    await act(async () => {
      await result.current.logSymptom(
        'Asthma',
        'Keep this observation.',
        '2026-07-16T09:30:00.000Z',
      );
    });

    const eventToDelete = result.current.timelineEvents[0];
    mockedStorage.setItem.mockRejectedValueOnce(new Error('disk full'));

    await act(async () => {
      await expect(result.current.deleteTimelineEvent(eventToDelete.id)).rejects.toBeInstanceOf(
        TimelineEventStorageError,
      );
    });

    expect(result.current.timelineEvents).toEqual([eventToDelete]);
    expect(result.current.deletingTimelineEventId).toBeNull();
  });

  it('persists a timeline event date and time update', async () => {
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    await act(async () => {
      await result.current.logSymptom('Asthma', '', '2026-07-16T09:30:00.000Z');
    });

    const eventId = result.current.timelineEvents[0].id;
    await act(async () => {
      await result.current.updateTimelineEventOccurredAt(eventId, '2026-07-17T10:45:00.000Z');
    });

    expect(result.current.timelineEvents[0].occurredAt).toBe('2026-07-17T10:45:00.000Z');
    await expect(mockedStorage.getItem(storageKey)).resolves.toBe(
      JSON.stringify(result.current.timelineEvents),
    );
  });

  it('keeps the original timestamp when an update cannot be persisted', async () => {
    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    await act(async () => {
      await result.current.logSymptom('Asthma', '', '2026-07-16T09:30:00.000Z');
    });

    const event = result.current.timelineEvents[0];
    mockedStorage.setItem.mockRejectedValueOnce(new Error('disk full'));
    await act(async () => {
      await expect(
        result.current.updateTimelineEventOccurredAt(event.id, '2026-07-17T10:45:00.000Z'),
      ).rejects.toBeInstanceOf(TimelineEventStorageError);
    });

    expect(result.current.timelineEvents[0].occurredAt).toBe(event.occurredAt);
    expect(result.current.updatingTimelineEventId).toBeNull();
  });
});
