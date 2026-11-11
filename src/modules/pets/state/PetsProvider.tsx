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
import { clearCachedPetPhotos } from '@/modules/pets/media/petPhotoCache';
import { Pet } from '@/modules/pets/model/Pet';
import {
  PET_PHOTO_LINK_LIFETIME_SECONDS,
  withPhotoLinks,
} from '@/modules/pets/persistence/petPhotoStore';
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
type ReadyPets = {
  status: 'ready';
  pets: Pet[];
  /** When to sign the photo links again, as a Date.now() time. */
  photoLinksRefreshAt: number;
};
type LoadedPets = LoadKey & (ReadyPets | { status: 'error' });

/** Photo links are signed again 10 minutes before they expire, or a minute after a failure. */
const PHOTO_LINK_REFRESH_MS = (PET_PHOTO_LINK_LIFETIME_SECONDS - 10 * 60) * 1000;
const PHOTO_LINK_RETRY_MS = 60 * 1000;

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
  const signedOut = session.status === 'signed-out';

  // Photos stay cached on this device for the account that loaded them; clear
  // them on sign-out so the next account doesn't see another household's pets.
  useEffect(() => {
    if (signedOut) void clearCachedPetPhotos().catch(() => undefined);
  }, [signedOut]);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    const key = { userId, attempt };
    loadPets()
      .then(signPhotoLinks)
      .then(
        (ready): LoadedPets => ({ ...key, ...ready }),
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
  const photoLinksRefreshAt = current?.status === 'ready' ? current.photoLinksRefreshAt : null;
  const hasPhotos = pets.some((pet) => pet.photoPath);

  // Signed photo links expire, so sign them again while the pets are shown. The
  // refresh time is absolute, so saving a pet restarts the timer without delaying it.
  useEffect(() => {
    if (photoLinksRefreshAt === null || !hasPhotos) return;
    const delay = Math.max(0, photoLinksRefreshAt - Date.now());
    let active = true;
    const timer = setTimeout(() => {
      void signPhotoLinks(pets).then((signed) => {
        if (!active) return;
        setLoaded((previous) => {
          if (previous?.status !== 'ready' || previous.userId !== userId) return previous;
          // A pet whose photo changed while signing keeps the photo it shows now.
          const signedPets = new Map(signed.pets.map((pet) => [pet.id, pet]));
          return {
            ...previous,
            photoLinksRefreshAt: signed.photoLinksRefreshAt,
            pets: previous.pets.map((pet) => {
              const signedPet = signedPets.get(pet.id);
              return signedPet && signedPet.photoPath === pet.photoPath && signedPet.photoUri
                ? { ...pet, photoUri: signedPet.photoUri }
                : pet;
            }),
          };
        });
      });
    }, delay);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [hasPhotos, pets, photoLinksRefreshAt, userId]);

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

/**
 * Signs the pets' photo links and says when to sign them again. When signing
 * fails the pets keep the links they had, none after a load, and it's retried
 * a minute later.
 */
async function signPhotoLinks(pets: Pet[]): Promise<ReadyPets> {
  try {
    const signed = await withPhotoLinks(pets);
    return {
      status: 'ready',
      pets: signed,
      photoLinksRefreshAt: Date.now() + PHOTO_LINK_REFRESH_MS,
    };
  } catch {
    return { status: 'ready', pets, photoLinksRefreshAt: Date.now() + PHOTO_LINK_RETRY_MS };
  }
}

export function usePets(): PetsContextValue {
  const value = useContext(PetsContext);
  if (!value) throw new Error('usePets must be used inside PetsProvider.');
  return value;
}
