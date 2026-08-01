import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { getCurrentDiet } from '@/modules/pet-events/model/getCurrentDiet';
import { PetEventStorageError } from '@/modules/pet-events/persistence/petEventStore';
import { PetEventsProvider, usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockedStorage = jest.mocked(AsyncStorage);
const storageKey = '@kiwi-tracker/timeline-events/v1';
const wrapper = ({ children }: { children: ReactNode }) => (
  <PetEventsProvider>{children}</PetEventsProvider>
);

describe('PetEventsProvider', () => {
  beforeEach(() => {
    mockedStorage.clear();
    jest.clearAllMocks();
  });

  it('persists events for the explicit pet id', async () => {
    const { result } = renderHook(() => usePetEvents(), { wrapper });
    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));

    await act(async () => {
      await result.current.logSymptom(
        'miso',
        'Asthma',
        'Recovered quickly.',
        '2026-07-16T09:30:00.000Z',
      );
    });

    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0]).toMatchObject({
      petId: 'miso',
      type: 'symptom',
      symptom: 'Asthma',
      note: 'Recovered quickly.',
    });
  });

  it('persists diet changes that can be projected for one pet', async () => {
    const { result } = renderHook(() => usePetEvents(), { wrapper });
    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));

    await act(async () => {
      await result.current.logDietChange(
        'kiwi',
        { type: 'add', item: { productName: 'Greenies Dental chew', foodType: 'snack' } },
        'One after dinner.',
        '2026-07-16T09:30:00.000Z',
      );
    });

    expect(getCurrentDiet(result.current.events, 'kiwi')).toEqual([
      expect.objectContaining({ productName: 'Greenies Dental chew', foodType: 'snack' }),
    ]);
  });

  it('persists and trims a custom event', async () => {
    const { result } = renderHook(() => usePetEvents(), { wrapper });
    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    await act(async () => {
      await result.current.logOtherEvent(
        'kiwi',
        ' Started sleeping upstairs ',
        ' Near the radiator. ',
        '2026-07-16T09:30:00.000Z',
      );
    });
    expect(result.current.events[0]).toMatchObject({
      petId: 'kiwi',
      type: 'other',
      title: 'Started sleeping upstairs',
      note: 'Near the radiator.',
    });
  });

  it('persists deletion before removing an event from state', async () => {
    const { result } = renderHook(() => usePetEvents(), { wrapper });
    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    await act(async () => {
      await result.current.logSymptom('kiwi', 'Asthma', 'Keep.', '2026-07-16T09:30:00.000Z');
    });
    const event = result.current.events[0];
    await act(async () => result.current.deleteEvent(event.id));
    expect(result.current.events).toEqual([]);
    await expect(mockedStorage.getItem(storageKey)).resolves.toBe('[]');
  });

  it('retains state when deletion persistence fails', async () => {
    const { result } = renderHook(() => usePetEvents(), { wrapper });
    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    await act(async () => {
      await result.current.logSymptom('kiwi', 'Asthma', 'Keep.', '2026-07-16T09:30:00.000Z');
    });
    const event = result.current.events[0];
    mockedStorage.setItem.mockRejectedValueOnce(new Error('disk full'));
    await act(async () => {
      await expect(result.current.deleteEvent(event.id)).rejects.toBeInstanceOf(
        PetEventStorageError,
      );
    });
    expect(result.current.events).toEqual([event]);
    expect(result.current.deletingEventId).toBeNull();
  });

  it('persists timestamp updates and retains the original on failure', async () => {
    const { result } = renderHook(() => usePetEvents(), { wrapper });
    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    await act(async () => {
      await result.current.logSymptom('kiwi', 'Asthma', '', '2026-07-16T09:30:00.000Z');
    });
    const event = result.current.events[0];
    await act(async () => {
      await result.current.updateEventOccurredAt(event.id, '2026-07-17T10:45:00.000Z');
    });
    expect(result.current.events[0].occurredAt).toBe('2026-07-17T10:45:00.000Z');

    mockedStorage.setItem.mockRejectedValueOnce(new Error('disk full'));
    await act(async () => {
      await expect(
        result.current.updateEventOccurredAt(event.id, '2026-07-18T10:45:00.000Z'),
      ).rejects.toBeInstanceOf(PetEventStorageError);
    });
    expect(result.current.events[0].occurredAt).toBe('2026-07-17T10:45:00.000Z');
  });
});
