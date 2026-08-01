import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { DEFAULT_PET, Pet } from '@/modules/pets/model/Pet';
import {
  loadPetsWithPhotoMigration,
  LoadedPets,
} from '@/modules/pets/persistence/loadPetsWithPhotoMigration';
import {
  SavePetProfileInput,
  SavePetProfileResult,
  savePetProfile,
} from '@/modules/pets/profile/savePetProfile';
import { LoadStatus } from '@/shared/state/LoadStatus';

export type PetProfileInput = Omit<SavePetProfileInput, 'pets'>;

type PetsContextValue = {
  pets: Pet[];
  loadStatus: LoadStatus;
  photoMigrationWarningPetNames: string[];
  clearPhotoMigrationWarning: () => void;
  retryLoad: () => Promise<void>;
  saveProfile: (input: PetProfileInput) => Promise<SavePetProfileResult>;
};

const PetsContext = createContext<PetsContextValue | null>(null);

export function PetsProvider({ children }: { children: ReactNode }) {
  const [pets, setPets] = useState<Pet[]>([DEFAULT_PET]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [photoMigrationWarningPetNames, setPhotoMigrationWarningPetNames] = useState<string[]>([]);

  const applyLoadedPets = useCallback((loaded: LoadedPets) => {
    setPets(loaded.petState.pets);
    setPhotoMigrationWarningPetNames(loaded.photoMigrationWarningPetNames);
    setLoadStatus('ready');
  }, []);

  const loadData = useCallback(async () => {
    setLoadStatus('loading');
    setPhotoMigrationWarningPetNames([]);
    try {
      applyLoadedPets(await loadPetsWithPhotoMigration());
    } catch {
      setLoadStatus('error');
    }
  }, [applyLoadedPets]);

  useEffect(() => {
    let current = true;
    void loadPetsWithPhotoMigration()
      .then((loaded) => {
        if (current) applyLoadedPets(loaded);
      })
      .catch(() => {
        if (current) setLoadStatus('error');
      });
    return () => {
      current = false;
    };
  }, [applyLoadedPets]);

  const saveProfile = useCallback(
    async (input: PetProfileInput): Promise<SavePetProfileResult> => {
      if (loadStatus !== 'ready') throw new Error('Pet data is not ready.');
      const result = await savePetProfile({ ...input, pets });
      setPets(result.pets);
      return result;
    },
    [loadStatus, pets],
  );

  const value = useMemo<PetsContextValue>(
    () => ({
      pets,
      loadStatus,
      photoMigrationWarningPetNames,
      clearPhotoMigrationWarning: () => setPhotoMigrationWarningPetNames([]),
      retryLoad: loadData,
      saveProfile,
    }),
    [loadData, loadStatus, pets, photoMigrationWarningPetNames, saveProfile],
  );

  return <PetsContext.Provider value={value}>{children}</PetsContext.Provider>;
}

export function usePets(): PetsContextValue {
  const value = useContext(PetsContext);
  if (!value) throw new Error('usePets must be used inside PetsProvider.');
  return value;
}
