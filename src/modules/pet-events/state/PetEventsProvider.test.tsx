import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { SessionState, useSession } from '@/modules/auth/state/SessionProvider';
import { getCurrentDiet } from '@/modules/pet-events/model/getCurrentDiet';
import { NewPetEvent, PetEvent } from '@/modules/pet-events/model/PetEvent';
import {
  deletePetEvent,
  insertPetEvent,
  loadPetEvents,
  updatePetEvent,
} from '@/modules/pet-events/persistence/petEventStore';
import { PetEventsProvider, usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';

jest.mock('@/modules/auth/state/SessionProvider', () => ({ useSession: jest.fn() }));
jest.mock('@/modules/pet-events/persistence/petEventStore', () => ({
  loadPetEvents: jest.fn(),
  insertPetEvent: jest.fn(),
  updatePetEvent: jest.fn(),
  deletePetEvent: jest.fn(),
}));

const mockedLoad = jest.mocked(loadPetEvents);
const mockedInsert = jest.mocked(insertPetEvent);
const mockedUpdate = jest.mocked(updatePetEvent);
const mockedDelete = jest.mocked(deletePetEvent);

const wrapper = ({ children }: { children: ReactNode }) => (
  <PetEventsProvider>{children}</PetEventsProvider>
);

function signInAs(id: string) {
  const session: SessionState = { status: 'signed-in', user: { id, email: `${id}@kiwi.test` } };
  jest.mocked(useSession).mockReturnValue({ session, signOut: jest.fn() });
}

let savedCount = 0;
function stored(event: NewPetEvent): PetEvent {
  savedCount += 1;
  return { ...event, id: `event-${savedCount}`, createdAt: '2026-07-16T10:00:00.000Z' } as PetEvent;
}

async function renderReady() {
  const rendered = renderHook(() => usePetEvents(), { wrapper });
  await waitFor(() => expect(rendered.result.current.loadStatus).toBe('ready'));
  return rendered;
}

describe('PetEventsProvider', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    signInAs('alex');
    mockedLoad.mockResolvedValue([]);
    mockedInsert.mockImplementation(async (event) => stored(event));
    mockedUpdate.mockImplementation(async (event) => event);
    mockedDelete.mockResolvedValue();
  });

  it('saves a new symptom as one record for the explicit pet', async () => {
    const { result } = await renderReady();

    await act(async () => {
      await result.current.logSymptom(
        'miso',
        'Asthma',
        ' Recovered quickly. ',
        '2026-07-16T09:30:00.000Z',
      );
    });

    expect(mockedInsert).toHaveBeenCalledTimes(1);
    expect(mockedInsert).toHaveBeenCalledWith({
      petId: 'miso',
      type: 'symptom',
      symptom: 'Asthma',
      note: 'Recovered quickly.',
      occurredAt: '2026-07-16T09:30:00.000Z',
    });
    expect(result.current.events).toEqual([expect.objectContaining({ id: 'event-1' })]);
  });

  it('saves diet changes that can be projected for one pet', async () => {
    const { result } = await renderReady();

    await act(async () => {
      await result.current.logDietChange(
        'kiwi',
        { type: 'add', item: { productName: 'Greenies Dental chew', foodType: 'snack' } },
        '',
        '2026-07-16T09:30:00.000Z',
      );
    });

    expect(mockedInsert.mock.calls[0][0]).not.toHaveProperty('note');
    expect(getCurrentDiet(result.current.events, 'kiwi')).toEqual([
      expect.objectContaining({ productName: 'Greenies Dental chew', foodType: 'snack' }),
    ]);
  });

  it('trims a custom event and rejects an empty title without saving', async () => {
    const { result } = await renderReady();

    await act(async () => {
      await result.current.logOtherEvent('kiwi', ' Upstairs ', '', '2026-07-16T09:30:00.000Z');
      await expect(
        result.current.logOtherEvent('kiwi', ' ', '', '2026-07-16T09:30:00.000Z'),
      ).rejects.toThrow();
    });

    expect(mockedInsert).toHaveBeenCalledTimes(1);
    expect(result.current.events[0]).toMatchObject({ type: 'other', title: 'Upstairs' });
  });

  it('keeps the list unchanged when a new event is not saved', async () => {
    const { result } = await renderReady();
    mockedInsert.mockRejectedValueOnce(new Error('offline'));

    await act(async () => {
      await expect(
        result.current.logSymptom('kiwi', 'Asthma', '', '2026-07-16T09:30:00.000Z'),
      ).rejects.toThrow('offline');
    });

    expect(result.current.events).toEqual([]);
  });

  it('deletes one record and keeps the event when the delete fails', async () => {
    const event = stored({
      petId: 'kiwi',
      type: 'symptom',
      symptom: 'Asthma',
      occurredAt: '2026-07-16T09:30:00.000Z',
    });
    mockedLoad.mockResolvedValue([event]);
    const { result } = await renderReady();

    mockedDelete.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await expect(result.current.deleteEvent(event.id)).rejects.toThrow('offline');
    });
    expect(result.current.events).toEqual([event]);
    expect(result.current.deletingEventId).toBeNull();

    await act(async () => result.current.deleteEvent(event.id));
    expect(mockedDelete).toHaveBeenLastCalledWith(event.id);
    expect(result.current.events).toEqual([]);
  });

  it('saves a new time for one event and keeps the stored one on failure', async () => {
    const event = stored({
      petId: 'kiwi',
      type: 'symptom',
      symptom: 'Asthma',
      occurredAt: '2026-07-16T09:30:00.000Z',
    });
    mockedLoad.mockResolvedValue([event]);
    const { result } = await renderReady();

    await act(async () => {
      await result.current.updateEventOccurredAt(event.id, '2026-07-17T10:45:00.000Z');
    });
    expect(mockedUpdate).toHaveBeenCalledWith({ ...event, occurredAt: '2026-07-17T10:45:00.000Z' });
    expect(result.current.events[0].occurredAt).toBe('2026-07-17T10:45:00.000Z');

    mockedUpdate.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await expect(
        result.current.updateEventOccurredAt(event.id, '2026-07-18T10:45:00.000Z'),
      ).rejects.toThrow('offline');
    });
    expect(result.current.events[0].occurredAt).toBe('2026-07-17T10:45:00.000Z');
    expect(result.current.updatingEventId).toBeNull();
  });

  it('saves only the events an edit touched, and keeps those saved when a later one fails', async () => {
    const kibble = { id: 'item-1', productName: 'Royal Kanin', foodType: 'dry-food' as const };
    const added = stored({
      petId: 'kiwi',
      type: 'diet-change',
      change: { type: 'add', item: kibble },
      occurredAt: '2026-07-01T08:00:00.000Z',
    });
    const symptom = stored({
      petId: 'kiwi',
      type: 'symptom',
      symptom: 'Asthma',
      occurredAt: '2026-07-05T08:00:00.000Z',
    });
    const stopped = stored({
      petId: 'kiwi',
      type: 'diet-change',
      change: { type: 'remove', item: kibble },
      occurredAt: '2026-07-10T08:00:00.000Z',
    });
    mockedLoad.mockResolvedValue([stopped, symptom, added]);
    const { result } = await renderReady();
    mockedUpdate
      .mockImplementationOnce(async (event) => event)
      .mockRejectedValueOnce(new Error('offline'));

    await act(async () => {
      await expect(
        result.current.updateEvent(added.id, {
          type: 'diet-change',
          item: { productName: 'Royal Canin', foodType: 'dry-food' },
          note: '',
          occurredAt: added.occurredAt,
        }),
      ).rejects.toThrow('offline');
    });

    expect(mockedUpdate.mock.calls.map(([event]) => event.id)).toEqual([added.id, stopped.id]);
    expect(result.current.events).toEqual([
      stopped,
      symptom,
      expect.objectContaining({
        id: added.id,
        change: { type: 'add', item: { ...kibble, productName: 'Royal Canin' } },
      }),
    ]);
    expect(result.current.updatingEventId).toBeNull();
  });

  it('loads again for a different user instead of showing the previous events', async () => {
    const event = stored({
      petId: 'kiwi',
      type: 'symptom',
      symptom: 'Asthma',
      occurredAt: '2026-07-16T09:30:00.000Z',
    });
    mockedLoad.mockResolvedValueOnce([event]).mockResolvedValueOnce([]);
    const { result, rerender } = await renderReady();
    expect(result.current.events).toEqual([event]);

    signInAs('sam');
    rerender({});

    expect(result.current.loadStatus).toBe('loading');
    expect(result.current.events).toEqual([]);
    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    expect(mockedLoad).toHaveBeenCalledTimes(2);
  });

  it('reports a failed load and loads again on retry', async () => {
    mockedLoad.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    const { result } = renderHook(() => usePetEvents(), { wrapper });
    await waitFor(() => expect(result.current.loadStatus).toBe('error'));

    act(() => result.current.retryLoad());

    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
  });
});
