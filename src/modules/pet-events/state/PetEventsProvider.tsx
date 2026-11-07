import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { addDietItemIds } from '@/modules/pet-events/application/addDietItemIds';
import { applyPetEventEdit } from '@/modules/pet-events/application/applyPetEventEdit';
import { createPetEventId } from '@/modules/pet-events/application/createPetEventId';
import {
  DietChangeInput,
  PetEvent,
  PetEventEdit,
  SymptomKind,
} from '@/modules/pet-events/model/PetEvent';
import { loadPetEvents, savePetEvents } from '@/modules/pet-events/persistence/petEventStore';
import { LoadStatus } from '@/shared/state/LoadStatus';

type PetEventsContextValue = {
  events: PetEvent[];
  loadStatus: LoadStatus;
  deletingEventId: string | null;
  updatingEventId: string | null;
  retryLoad: () => Promise<void>;
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

const PetEventsContext = createContext<PetEventsContextValue | null>(null);

export function PetEventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<PetEvent[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoadStatus('loading');
    try {
      setEvents(await loadPetEvents());
      setLoadStatus('ready');
    } catch {
      setLoadStatus('error');
    }
  }, []);

  useEffect(() => {
    let current = true;
    void loadPetEvents()
      .then((loaded) => {
        if (current) {
          setEvents(loaded);
          setLoadStatus('ready');
        }
      })
      .catch(() => {
        if (current) setLoadStatus('error');
      });
    return () => {
      current = false;
    };
  }, []);

  const persist = useCallback(async (next: PetEvent[]) => {
    await savePetEvents(next);
    setEvents(next);
  }, []);

  const assertReady = useCallback(() => {
    if (loadStatus !== 'ready') throw new Error('Pet event data is not ready.');
  }, [loadStatus]);

  const logSymptom = useCallback(
    async (petId: string, symptom: SymptomKind, note: string, occurredAt: string) => {
      assertReady();
      const now = new Date();
      const event: PetEvent = {
        id: createPetEventId('symptom', now),
        petId,
        type: 'symptom',
        symptom,
        occurredAt,
        recordedAt: now.toISOString(),
        ...(note.trim() ? { note: note.trim() } : {}),
      };
      await persist([event, ...events]);
    },
    [assertReady, events, persist],
  );

  const logDietChange = useCallback(
    async (petId: string, input: DietChangeInput, note: string, occurredAt: string) => {
      assertReady();
      const now = new Date();
      const event: PetEvent = {
        id: createPetEventId('diet-change', now),
        petId,
        type: 'diet-change',
        change: addDietItemIds(input, now),
        occurredAt,
        recordedAt: now.toISOString(),
        ...(note.trim() ? { note: note.trim() } : {}),
      };
      await persist([event, ...events]);
    },
    [assertReady, events, persist],
  );

  const logOtherEvent = useCallback(
    async (petId: string, title: string, note: string, occurredAt: string) => {
      assertReady();
      const trimmedTitle = title.trim();
      if (!trimmedTitle) throw new Error('Other events require a title.');
      const now = new Date();
      const event: PetEvent = {
        id: createPetEventId('other', now),
        petId,
        type: 'other',
        title: trimmedTitle,
        occurredAt,
        recordedAt: now.toISOString(),
        ...(note.trim() ? { note: note.trim() } : {}),
      };
      await persist([event, ...events]);
    },
    [assertReady, events, persist],
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      assertReady();
      if (deletingEventId) throw new Error('A pet event is already being deleted.');
      if (!events.some((event) => event.id === eventId)) throw new Error('Pet event not found.');
      setDeletingEventId(eventId);
      try {
        await persist(events.filter((event) => event.id !== eventId));
      } finally {
        setDeletingEventId(null);
      }
    },
    [assertReady, deletingEventId, events, persist],
  );

  const updateEventOccurredAt = useCallback(
    async (eventId: string, occurredAt: string) => {
      assertReady();
      if (updatingEventId) throw new Error('A pet event is already being updated.');
      if (!events.some((event) => event.id === eventId)) throw new Error('Pet event not found.');
      setUpdatingEventId(eventId);
      try {
        await persist(
          events.map((event) => (event.id === eventId ? { ...event, occurredAt } : event)),
        );
      } finally {
        setUpdatingEventId(null);
      }
    },
    [assertReady, events, persist, updatingEventId],
  );

  const updateEvent = useCallback(
    async (eventId: string, edit: PetEventEdit) => {
      assertReady();
      if (updatingEventId) throw new Error('A pet event is already being updated.');
      const next = applyPetEventEdit(events, eventId, edit);
      setUpdatingEventId(eventId);
      try {
        await persist(next);
      } finally {
        setUpdatingEventId(null);
      }
    },
    [assertReady, events, persist, updatingEventId],
  );

  const value = useMemo<PetEventsContextValue>(
    () => ({
      events,
      loadStatus,
      deletingEventId,
      updatingEventId,
      retryLoad: loadData,
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
      loadData,
      loadStatus,
      logDietChange,
      logOtherEvent,
      logSymptom,
      updateEvent,
      updateEventOccurredAt,
      updatingEventId,
    ],
  );

  return <PetEventsContext.Provider value={value}>{children}</PetEventsContext.Provider>;
}

export function usePetEvents(): PetEventsContextValue {
  const value = useContext(PetEventsContext);
  if (!value) throw new Error('usePetEvents must be used inside PetEventsProvider.');
  return value;
}
