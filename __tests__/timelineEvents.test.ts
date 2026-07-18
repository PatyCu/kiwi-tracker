import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadTimelineEvents,
  saveTimelineEvents,
  TimelineEvent,
  TimelineEventStorageError,
} from '@/lib/timelineEvents';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockedStorage = jest.mocked(AsyncStorage);
const storageKey = '@kiwi-tracker/timeline-events/v1';

describe('timeline event storage', () => {
  beforeEach(() => {
    mockedStorage.clear();
    jest.clearAllMocks();
  });

  it('returns an empty list when nothing has been stored', async () => {
    await expect(loadTimelineEvents()).resolves.toEqual([]);
  });

  it('reports invalid persisted data explicitly', async () => {
    await mockedStorage.setItem(storageKey, '{not-json');

    await expect(loadTimelineEvents()).rejects.toMatchObject<Partial<TimelineEventStorageError>>({
      name: 'TimelineEventStorageError',
      code: 'INVALID_DATA',
    });
  });

  it('rejects the obsolete symptom shape instead of silently migrating it', async () => {
    await mockedStorage.setItem(
      storageKey,
      JSON.stringify([
        {
          id: 'old-event',
          petId: 'kiwi',
          kind: 'Asthma',
          occurredAt: '2026-07-16T09:30:00.000Z',
        },
      ]),
    );

    await expect(loadTimelineEvents()).rejects.toMatchObject<Partial<TimelineEventStorageError>>({
      code: 'INVALID_DATA',
    });
  });

  it('serializes symptom and diet-change events together', async () => {
    const events: TimelineEvent[] = [
      {
        id: 'symptom-1',
        petId: 'kiwi',
        type: 'symptom',
        symptom: 'Asthma',
        occurredAt: '2026-07-16T09:30:00.000Z',
        recordedAt: '2026-07-16T09:31:00.000Z',
      },
      {
        id: 'diet-1',
        petId: 'kiwi',
        type: 'diet-change',
        change: {
          type: 'add',
          item: {
            id: 'item-1',
            productName: 'Dental chew',
            foodType: 'snack',
          },
        },
        occurredAt: '2026-07-17T09:30:00.000Z',
        recordedAt: '2026-07-17T09:31:00.000Z',
      },
    ];

    await saveTimelineEvents(events);

    await expect(mockedStorage.getItem(storageKey)).resolves.toBe(JSON.stringify(events));
    await expect(loadTimelineEvents()).resolves.toEqual(events);
  });

  it('distinguishes read and write failures', async () => {
    mockedStorage.getItem.mockRejectedValueOnce(new Error('storage unavailable'));
    await expect(loadTimelineEvents()).rejects.toMatchObject<Partial<TimelineEventStorageError>>({
      code: 'READ_FAILED',
    });

    mockedStorage.setItem.mockRejectedValueOnce(new Error('disk full'));
    await expect(saveTimelineEvents([])).rejects.toMatchObject<Partial<TimelineEventStorageError>>({
      code: 'WRITE_FAILED',
    });
  });

  it('does not write an invalid event', async () => {
    await expect(
      saveTimelineEvents([
        {
          id: 'symptom-1',
          petId: '',
          type: 'symptom',
          symptom: 'Asthma',
          occurredAt: '2026-07-16T09:30:00.000Z',
          recordedAt: '2026-07-16T09:31:00.000Z',
        },
      ]),
    ).rejects.toMatchObject<Partial<TimelineEventStorageError>>({ code: 'INVALID_DATA' });

    expect(mockedStorage.setItem).not.toHaveBeenCalled();
  });
});
