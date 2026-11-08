import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useSession } from '@/modules/auth/state/SessionProvider';
import { addDietItemIds } from '@/modules/pet-events/application/addDietItemIds';
import { applyPetEventEdit } from '@/modules/pet-events/application/applyPetEventEdit';
import {
  DietChangeInput,
  NewPetEvent,
  PetEvent,
  PetEventEdit,
  SymptomKind,
} from '@/modules/pet-events/model/PetEvent';
import {
  deletePetEvent,
  insertPetEvent,
  loadPetEvents,
  updatePetEvent,
} from '@/modules/pet-events/persistence/petEventStore';
import { LoadStatus } from '@/shared/state/LoadStatus';

type PetEventsContextValue = {
  events: PetEvent[];
  loadStatus: LoadStatus;
  deletingEventId: string | null;
  updatingEventId: string | null;
  retryLoad: () => void;
  logSymptom: (
    petId: string,
    symptom: SymptomKind,
    note: string,
    occurredAt: string,
  ) => Promise<void>;
  logDietChange: (
    petId: string,
    input: DietChangeInput,
    note: string,
    occurredAt: string,
  ) => Promise<void>;
  logOtherEvent: (petId: string, title: string, note: string, occurredAt: string) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  updateEventOccurredAt: (eventId: string, occurredAt: string) => Promise<void>;
  updateEvent: (eventId: string, edit: PetEventEdit) => Promise<void>;
};

/** Which load the events belong to, so a new user or a retry never shows stale events. */
type LoadKey = { userId: string; attempt: number };
type LoadedEvents = LoadKey & ({ status: 'ready'; events: PetEvent[] } | { status: 'error' });

const PetEventsContext = createContext<PetEventsContextValue | null>(null);
const NO_EVENTS: PetEvent[] = [];

/**
 * Loads the household's events when a user signs in, and again for each new
 * user or retry. Every change is saved as one record before the list changes.
 */
export function PetEventsProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session.status === 'signed-in' ? session.user.id : null;
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<LoadedEvents | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    const key = { userId, attempt };
    loadPetEvents()
      .then(
        (events): LoadedEvents => ({ ...key, status: 'ready', events }),
        (): LoadedEvents => ({ ...key, status: 'error' }),
      )
      .then((result) => {
        if (current) setLoaded(result);
      });
    return () => {
      current = false;
    };
  }, [userId, attempt]);

  const current = loaded && loaded.userId === userId && loaded.attempt === attempt ? loaded : null;
  const loadStatus: LoadStatus = current?.status ?? 'loading';
  const events = current?.status === 'ready' ? current.events : NO_EVENTS;

  /** Applies a saved change to the list, unless another user signed in meanwhile. */
  const applySaved = useCallback(
    (change: (events: PetEvent[]) => PetEvent[]) => {
      setLoaded((previous) =>
        previous?.status === 'ready' && previous.userId === userId
          ? { ...previous, events: change(previous.events) }
          : previous,
      );
    },
    [userId],
  );

  const assertReady = useCallback(() => {
    if (loadStatus !== 'ready') throw new Error('Pet event data is not ready.');
  }, [loadStatus]);

  const logEvent = useCallback(
    async (event: NewPetEvent) => {
      assertReady();
      const saved = await insertPetEvent(event);
      applySaved((previous) => [saved, ...previous]);
    },
    [applySaved, assertReady],
  );

  const logSymptom = useCallback(
    (petId: string, symptom: SymptomKind, note: string, occurredAt: string) =>
      logEvent({ petId, type: 'symptom', symptom, occurredAt, ...toNote(note) }),
    [logEvent],
  );

  const logDietChange = useCallback(
    (petId: string, input: DietChangeInput, note: string, occurredAt: string) =>
      logEvent({
        petId,
        type: 'diet-change',
        change: addDietItemIds(input, new Date()),
        occurredAt,
        ...toNote(note),
      }),
    [logEvent],
  );

  const logOtherEvent = useCallback(
    async (petId: string, title: string, note: string, occurredAt: string) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) throw new Error('Other events require a title.');
      await logEvent({ petId, type: 'other', title: trimmedTitle, occurredAt, ...toNote(note) });
    },
    [logEvent],
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      assertReady();
      if (deletingEventId) throw new Error('A pet event is already being deleted.');
      if (!events.some((event) => event.id === eventId)) throw new Error('Pet event not found.');
      setDeletingEventId(eventId);
      try {
        await deletePetEvent(eventId);
        applySaved((previous) => previous.filter((event) => event.id !== eventId));
      } finally {
        setDeletingEventId(null);
      }
    },
    [applySaved, assertReady, deletingEventId, events],
  );

  /**
   * Saves each event the change touched, the edited one first. When a later
   * save fails, the ones already saved still show, so the list matches storage.
   */
  const saveChangedEvents = useCallback(
    async (eventId: string, next: PetEvent[]) => {
      const changed = next
        .filter((event, index) => event !== events[index])
        .sort((left, right) => Number(right.id === eventId) - Number(left.id === eventId));
      setUpdatingEventId(eventId);
      const saved = new Map<string, PetEvent>();
      try {
        for (const event of changed) {
          saved.set(event.id, await updatePetEvent(event));
        }
      } finally {
        if (saved.size > 0) {
          applySaved((previous) => previous.map((event) => saved.get(event.id) ?? event));
        }
        setUpdatingEventId(null);
      }
    },
    [applySaved, events],
  );

  const updateEventOccurredAt = useCallback(
    async (eventId: string, occurredAt: string) => {
      assertReady();
      if (updatingEventId) throw new Error('A pet event is already being updated.');
      if (!events.some((event) => event.id === eventId)) throw new Error('Pet event not found.');
      await saveChangedEvents(
        eventId,
        events.map((event) => (event.id === eventId ? { ...event, occurredAt } : event)),
      );
    },
    [assertReady, events, saveChangedEvents, updatingEventId],
  );

  const updateEvent = useCallback(
    async (eventId: string, edit: PetEventEdit) => {
      assertReady();
      if (updatingEventId) throw new Error('A pet event is already being updated.');
      await saveChangedEvents(eventId, applyPetEventEdit(events, eventId, edit));
    },
    [assertReady, events, saveChangedEvents, updatingEventId],
  );

  const retryLoad = useCallback(() => setAttempt((count) => count + 1), []);

  const value = useMemo<PetEventsContextValue>(
    () => ({
      events,
      loadStatus,
      deletingEventId,
      updatingEventId,
      retryLoad,
      logSymptom,
      logDietChange,
      logOtherEvent,
      deleteEvent,
      updateEventOccurredAt,
      updateEvent,
    }),
    [
      deleteEvent,
      deletingEventId,
      events,
      loadStatus,
      logDietChange,
      logOtherEvent,
      logSymptom,
      retryLoad,
      updateEvent,
      updateEventOccurredAt,
      updatingEventId,
    ],
  );

  return <PetEventsContext.Provider value={value}>{children}</PetEventsContext.Provider>;
}

function toNote(note: string): { note?: string } {
  const trimmed = note.trim();
  return trimmed ? { note: trimmed } : {};
}

export function usePetEvents(): PetEventsContextValue {
  const value = useContext(PetEventsContext);
  if (!value) throw new Error('usePetEvents must be used inside PetEventsProvider.');
  return value;
}
