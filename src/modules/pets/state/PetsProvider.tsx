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
import { useHousehold } from '@/modules/households/state/HouseholdProvider';
import { Pet } from '@/modules/pets/model/Pet';
import { loadPets } from '@/modules/pets/persistence/petStore';
import {
  SavePetProfileInput,
  SavePetProfileResult,
  savePetProfile,
} from '@/modules/pets/profile/savePetProfile';
import { LoadStatus } from '@/shared/state/LoadStatus';

export type PetProfileInput = Omit<SavePetProfileInput, 'pets' | 'householdId'>;

type PetsContextValue = {
  pets: Pet[];
  loadStatus: LoadStatus;
  retryLoad: () => void;
  saveProfile: (input: PetProfileInput) => Promise<SavePetProfileResult>;
};

/** Which load the pets belong to, so a new user or a retry never shows stale pets. */
type LoadKey = { userId: string; attempt: number };
type LoadedPets = LoadKey & ({ status: 'ready'; pets: Pet[] } | { status: 'error' });

const PetsContext = createContext<PetsContextValue | null>(null);
const NO_PETS: Pet[] = [];

/** Loads the household's pets when a user signs in, and again for each new user or retry. */
export function PetsProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { household } = useHousehold();
  const userId = session.status === 'signed-in' ? session.user.id : null;
  const householdId = household.status === 'ready' ? household.id : null;
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<LoadedPets | null>(null);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    const key = { userId, attempt };
    loadPets()
      .then(
        (pets): LoadedPets => ({ ...key, status: 'ready', pets }),
        (): LoadedPets => ({ ...key, status: 'error' }),
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
  const pets = current?.status === 'ready' ? current.pets : NO_PETS;

  const saveProfile = useCallback(
    async (input: PetProfileInput): Promise<SavePetProfileResult> => {
      if (loadStatus !== 'ready') throw new Error('Pet data is not ready.');
      if (!householdId) throw new Error('The household is not loaded yet.');
      const result = await savePetProfile({ ...input, pets, householdId });
      setLoaded((previous) => {
        if (previous?.status !== 'ready' || previous.userId !== userId) return previous;
        const exists = previous.pets.some((pet) => pet.id === result.pet.id);
        const nextPets = exists
          ? previous.pets.map((pet) => (pet.id === result.pet.id ? result.pet : pet))
          : [...previous.pets, result.pet];
        return { ...previous, pets: nextPets };
      });
      return result;
    },
    [householdId, loadStatus, pets, userId],
  );

  const retryLoad = useCallback(() => setAttempt((count) => count + 1), []);

  const value = useMemo<PetsContextValue>(
    () => ({ pets, loadStatus, retryLoad, saveProfile }),
    [loadStatus, pets, retryLoad, saveProfile],
  );

  return <PetsContext.Provider value={value}>{children}</PetsContext.Provider>;
}

export function usePets(): PetsContextValue {
  const value = useContext(PetsContext);
  if (!value) throw new Error('usePets must be used inside PetsProvider.');
  return value;
}
