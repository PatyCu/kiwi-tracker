import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HealthEvent,
  HealthEventStorageError,
  loadHealthEvents,
  saveHealthEvents,
} from '@/lib/healthEvents';
import { DEFAULT_PET } from '@/lib/pets';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockedStorage = jest.mocked(AsyncStorage);

describe('health event storage', () => {
  beforeEach(() => {
    mockedStorage.clear();
    jest.clearAllMocks();
  });

  it('returns an empty list when nothing has been stored', async () => {
    await expect(loadHealthEvents()).resolves.toEqual([]);
  });

  it('assigns legacy events to the default pet', async () => {
    await mockedStorage.setItem(
      '@kiwi-tracker/health-events/v1',
      JSON.stringify([
        {
          id: 'legacy-event',
          kind: 'Vomiting',
          note: 'Before multi-pet support',
          occurredAt: '2025-01-03T09:30:00.000Z',
        },
      ]),
    );

    await expect(loadHealthEvents()).resolves.toEqual([
      {
        id: 'legacy-event',
        petId: DEFAULT_PET.id,
        kind: 'Vomiting',
        note: 'Before multi-pet support',
        occurredAt: '2025-01-03T09:30:00.000Z',
      },
    ]);
  });

  it('reports invalid persisted data explicitly', async () => {
    await mockedStorage.setItem('@kiwi-tracker/health-events/v1', '{not-json');

    await expect(loadHealthEvents()).rejects.toMatchObject<Partial<HealthEventStorageError>>({
      name: 'HealthEventStorageError',
      code: 'INVALID_DATA',
    });
  });

  it('treats an empty event document as corrupted data', async () => {
    mockedStorage.getItem.mockResolvedValueOnce('');

    await expect(loadHealthEvents()).rejects.toMatchObject<Partial<HealthEventStorageError>>({
      code: 'INVALID_DATA',
    });
  });

  it('rejects malformed persisted timestamps', async () => {
    await mockedStorage.setItem(
      '@kiwi-tracker/health-events/v1',
      JSON.stringify([
        {
          id: 'event-1',
          petId: DEFAULT_PET.id,
          kind: 'Asthma',
          note: 'After running',
          occurredAt: 'this morning',
        },
      ]),
    );

    await expect(loadHealthEvents()).rejects.toMatchObject<Partial<HealthEventStorageError>>({
      code: 'INVALID_DATA',
    });
  });

  it('distinguishes storage read failures from invalid data', async () => {
    mockedStorage.getItem.mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(loadHealthEvents()).rejects.toMatchObject<Partial<HealthEventStorageError>>({
      name: 'HealthEventStorageError',
      code: 'READ_FAILED',
    });
  });

  it('serializes the complete event list', async () => {
    const events: HealthEvent[] = [
      {
        id: 'event-1',
        petId: DEFAULT_PET.id,
        kind: 'Asthma',
        note: 'After running',
        occurredAt: '2025-01-03T09:30:00.000Z',
      },
    ];

    await saveHealthEvents(events);

    await expect(mockedStorage.getItem('@kiwi-tracker/health-events/v1')).resolves.toBe(
      JSON.stringify(events),
    );
  });

  it('wraps storage write failures without changing the event list', async () => {
    mockedStorage.setItem.mockRejectedValueOnce(new Error('disk full'));

    await expect(saveHealthEvents([])).rejects.toMatchObject<Partial<HealthEventStorageError>>({
      name: 'HealthEventStorageError',
      code: 'WRITE_FAILED',
    });
  });

  it('does not write an invalid event', async () => {
    await expect(
      saveHealthEvents([
        {
          id: 'event-1',
          petId: '',
          kind: 'Asthma',
          note: 'After running',
          occurredAt: '2025-01-03T09:30:00.000Z',
        },
      ]),
    ).rejects.toMatchObject<Partial<HealthEventStorageError>>({ code: 'INVALID_DATA' });

    expect(mockedStorage.setItem).not.toHaveBeenCalled();
  });
});
