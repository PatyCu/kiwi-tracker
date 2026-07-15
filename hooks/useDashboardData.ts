import { useCallback, useEffect, useMemo, useState } from 'react';

import { loadDashboardData } from '@/lib/dashboardDataService';
import { HealthEvent, HealthEventKind, saveHealthEvents } from '@/lib/healthEvents';
import { SavePetProfileInput, SavePetProfileResult, savePetProfile } from '@/lib/petProfileService';
import { DEFAULT_PET, loadPets, Pet, savePets } from '@/lib/pets';

export type DashboardLoadStatus = 'loading' | 'ready' | 'error';
export type PetProfileInput = Omit<SavePetProfileInput, 'pets'>;

export function useDashboardData() {
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [pets, setPets] = useState<Pet[]>([DEFAULT_PET]);
  const [activePetId, setActivePetId] = useState(DEFAULT_PET.id);
  const [loadStatus, setLoadStatus] = useState<DashboardLoadStatus>('loading');
  const [photoMigrationWarningPetNames, setPhotoMigrationWarningPetNames] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    setLoadStatus('loading');
    setPhotoMigrationWarningPetNames([]);
    try {
      const data = await loadDashboardData();
      setHealthEvents(data.healthEvents);
      setPets(data.petState.pets);
      setActivePetId(data.petState.activePetId);
      setPhotoMigrationWarningPetNames(data.photoMigrationWarningPetNames);
      setLoadStatus('ready');
    } catch {
      setLoadStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activePet = useMemo(
    () => pets.find((pet) => pet.id === activePetId) ?? pets[0] ?? DEFAULT_PET,
    [activePetId, pets],
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

  const logHealthEvent = useCallback(
    async (kind: HealthEventKind, note: string): Promise<void> => {
      if (loadStatus !== 'ready') throw new Error('Dashboard data is not ready.');
      const newEvent: HealthEvent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        petId: activePet.id,
        kind,
        occurredAt: new Date().toISOString(),
        note: note.trim() || 'No additional notes.',
      };
      const next = [newEvent, ...healthEvents];
      await saveHealthEvents(next);
      setHealthEvents(next);
    },
    [activePet.id, healthEvents, loadStatus],
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
    healthEvents,
    pets,
    activePet,
    activePetId,
    loadStatus,
    photoMigrationWarningPetNames,
    clearPhotoMigrationWarning,
    retryLoad: loadData,
    selectPet,
    logHealthEvent,
    saveProfile,
  };
}
