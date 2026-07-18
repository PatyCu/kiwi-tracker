import { useCallback, useEffect, useMemo, useState } from 'react';

import { loadDashboardData } from '@/lib/dashboardDataService';
import { getCurrentDiet } from '@/lib/diet';
import { SavePetProfileInput, SavePetProfileResult, savePetProfile } from '@/lib/petProfileService';
import { DEFAULT_PET, loadPets, Pet, savePets } from '@/lib/pets';
import {
  DietChange,
  DietChangeInput,
  saveTimelineEvents,
  SymptomKind,
  TimelineEvent,
} from '@/lib/timelineEvents';

export type DashboardLoadStatus = 'loading' | 'ready' | 'error';
export type PetProfileInput = Omit<SavePetProfileInput, 'pets'>;

export function useDashboardData() {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [pets, setPets] = useState<Pet[]>([DEFAULT_PET]);
  const [activePetId, setActivePetId] = useState(DEFAULT_PET.id);
  const [loadStatus, setLoadStatus] = useState<DashboardLoadStatus>('loading');
  const [deletingTimelineEventId, setDeletingTimelineEventId] = useState<string | null>(null);
  const [updatingTimelineEventId, setUpdatingTimelineEventId] = useState<string | null>(null);
  const [photoMigrationWarningPetNames, setPhotoMigrationWarningPetNames] = useState<string[]>([]);

  const applyDashboardData = useCallback((data: Awaited<ReturnType<typeof loadDashboardData>>) => {
    setTimelineEvents(data.timelineEvents);
    setPets(data.petState.pets);
    setActivePetId(data.petState.activePetId);
    setPhotoMigrationWarningPetNames(data.photoMigrationWarningPetNames);
    setLoadStatus('ready');
  }, []);

  const loadData = useCallback(async () => {
    setLoadStatus('loading');
    setPhotoMigrationWarningPetNames([]);
    try {
      const data = await loadDashboardData();
      applyDashboardData(data);
    } catch {
      setLoadStatus('error');
    }
  }, [applyDashboardData]);

  useEffect(() => {
    let isCurrent = true;

    const loadInitialData = async () => {
      try {
        const data = await loadDashboardData();
        if (isCurrent) applyDashboardData(data);
      } catch {
        if (isCurrent) setLoadStatus('error');
      }
    };

    void loadInitialData();
    return () => {
      isCurrent = false;
    };
  }, [applyDashboardData]);

  const activePet = useMemo(
    () => pets.find((pet) => pet.id === activePetId) ?? pets[0] ?? DEFAULT_PET,
    [activePetId, pets],
  );
  const currentDiet = useMemo(
    () => getCurrentDiet(timelineEvents, activePet.id),
    [activePet.id, timelineEvents],
  );

  const selectPet = useCallback(
    async (petId: string): Promise<boolean> => {
      if (loadStatus !== 'ready') return false;
      const previous = activePetId;
      setActivePetId(petId);
      try {
        await savePets(pets, petId);
        return true;
      } catch {
        try {
          const persistedState = await loadPets();
          if (persistedState.activePetId === petId) {
            setPets(persistedState.pets);
            setActivePetId(petId);
            return true;
          }
        } catch {
          // Keep showing the last confirmed in-memory selection until data can be loaded again.
        }
        setActivePetId(previous);
        return false;
      }
    },
    [activePetId, loadStatus, pets],
  );

  const logSymptom = useCallback(
    async (symptom: SymptomKind, note: string, occurredAt: string): Promise<void> => {
      if (loadStatus !== 'ready') throw new Error('Dashboard data is not ready.');
      const newEvent: TimelineEvent = {
        id: createId('symptom'),
        petId: activePet.id,
        type: 'symptom',
        symptom,
        occurredAt,
        recordedAt: new Date().toISOString(),
        ...(note.trim() ? { note: note.trim() } : {}),
      };
      const next = [newEvent, ...timelineEvents];
      await saveTimelineEvents(next);
      setTimelineEvents(next);
    },
    [activePet.id, loadStatus, timelineEvents],
  );

  const logDietChange = useCallback(
    async (input: DietChangeInput, note: string, occurredAt: string): Promise<void> => {
      if (loadStatus !== 'ready') throw new Error('Dashboard data is not ready.');
      const newEvent: TimelineEvent = {
        id: createId('diet-change'),
        petId: activePet.id,
        type: 'diet-change',
        change: addDietItemIds(input),
        occurredAt,
        recordedAt: new Date().toISOString(),
        ...(note.trim() ? { note: note.trim() } : {}),
      };
      const next = [newEvent, ...timelineEvents];
      await saveTimelineEvents(next);
      setTimelineEvents(next);
    },
    [activePet.id, loadStatus, timelineEvents],
  );

  const deleteTimelineEvent = useCallback(
    async (eventId: string): Promise<void> => {
      if (loadStatus !== 'ready') throw new Error('Dashboard data is not ready.');
      if (deletingTimelineEventId !== null)
        throw new Error('A timeline event is already being deleted.');
      if (!timelineEvents.some((event) => event.id === eventId)) {
        throw new Error('Timeline event was not found.');
      }

      const next = timelineEvents.filter((event) => event.id !== eventId);
      setDeletingTimelineEventId(eventId);
      try {
        await saveTimelineEvents(next);
        setTimelineEvents(next);
      } finally {
        setDeletingTimelineEventId(null);
      }
    },
    [deletingTimelineEventId, loadStatus, timelineEvents],
  );

  const updateTimelineEventOccurredAt = useCallback(
    async (eventId: string, occurredAt: string): Promise<void> => {
      if (loadStatus !== 'ready') throw new Error('Dashboard data is not ready.');
      if (updatingTimelineEventId !== null)
        throw new Error('A timeline event is already being updated.');
      if (!timelineEvents.some((event) => event.id === eventId)) {
        throw new Error('Timeline event was not found.');
      }

      const next = timelineEvents.map((event) =>
        event.id === eventId ? { ...event, occurredAt } : event,
      );
      setUpdatingTimelineEventId(eventId);
      try {
        await saveTimelineEvents(next);
        setTimelineEvents(next);
      } finally {
        setUpdatingTimelineEventId(null);
      }
    },
    [loadStatus, timelineEvents, updatingTimelineEventId],
  );

  const saveProfile = useCallback(
    async (input: PetProfileInput): Promise<SavePetProfileResult> => {
      if (loadStatus !== 'ready') throw new Error('Dashboard data is not ready.');
      const result = await savePetProfile({ ...input, pets });
      setPets(result.pets);
      setActivePetId(result.activePetId);
      return result;
    },
    [loadStatus, pets],
  );

  const clearPhotoMigrationWarning = useCallback(() => setPhotoMigrationWarningPetNames([]), []);

  return {
    timelineEvents,
    pets,
    activePet,
    activePetId,
    currentDiet,
    loadStatus,
    photoMigrationWarningPetNames,
    clearPhotoMigrationWarning,
    retryLoad: loadData,
    selectPet,
    logSymptom,
    logDietChange,
    deleteTimelineEvent,
    deletingTimelineEventId,
    updateTimelineEventOccurredAt,
    updatingTimelineEventId,
    saveProfile,
  };
}

function addDietItemIds(input: DietChangeInput): DietChange {
  if (input.type === 'replace') {
    return {
      type: 'replace',
      previousItem: input.previousItem,
      nextItem: { ...input.nextItem, id: createId('diet-item') },
    };
  }

  if (input.type === 'add') {
    return { type: 'add', item: { ...input.item, id: createId('diet-item') } };
  }

  return { type: 'remove', item: input.item };
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
