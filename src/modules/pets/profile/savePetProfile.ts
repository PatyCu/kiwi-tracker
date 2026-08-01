import {
  deletePersistedPetPhoto,
  persistPetPhoto,
  SelectedPetPhoto,
} from '@/modules/pets/media/petImageStore';
import { Pet, PetState } from '@/modules/pets/model/Pet';
import { loadPets, savePets } from '@/modules/pets/persistence/petStore';

export type SavePetProfileInput = {
  pets: Pet[];
  editingPetId?: string;
  name: string;
  species: Pet['species'];
  breed?: string;
  birthDate?: string;
  selectedPhoto?: SelectedPetPhoto;
};

export type SavePetProfileResult = PetState & {
  pet: Pet;
  previousPhotoCleanupFailed: boolean;
};

export class PetProfileSaveError extends Error {
  readonly cause: unknown;
  readonly retainedPhotoUri?: string;

  constructor(message: string, cause: unknown, retainedPhotoUri?: string) {
    super(message);
    this.name = 'PetProfileSaveError';
    this.cause = cause;
    this.retainedPhotoUri = retainedPhotoUri;
  }
}

export async function savePetProfile(input: SavePetProfileInput): Promise<SavePetProfileResult> {
  const existing = input.pets.find((pet) => pet.id === input.editingPetId);
  const petId = existing?.id ?? createPetId();
  let createdPhotoUri: string | undefined;
  let photoUri = existing?.photoUri;

  try {
    if (input.selectedPhoto) {
      photoUri = await persistPetPhoto(input.selectedPhoto, petId);
      createdPhotoUri = photoUri;
    }
  } catch (error) {
    throw new PetProfileSaveError('Could not persist the selected pet photo.', error);
  }

  const pet: Pet = {
    id: petId,
    name: input.name.trim(),
    species: input.species,
    breed: input.breed?.trim() || undefined,
    birthDate: input.birthDate,
    photoUri,
    photoStorageVersion: photoUri ? 1 : undefined,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  const nextPets = existing
    ? input.pets.map((item) => (item.id === pet.id ? pet : item))
    : [...input.pets, pet];

  let committedState: PetState = { pets: nextPets, activePetId: pet.id };
  try {
    await savePets(committedState.pets, committedState.activePetId);
  } catch (error) {
    const persistedState = await readPersistedState();
    if (persistedState && stateContainsCommittedPet(persistedState, pet)) {
      committedState = persistedState;
    } else {
      const retainedPhotoUri = createdPhotoUri
        ? await cleanUpUncommittedPhoto(createdPhotoUri, persistedState)
        : undefined;
      throw new PetProfileSaveError('Could not save the pet profile.', error, retainedPhotoUri);
    }
  }

  const committedPet = committedState.pets.find((item) => item.id === pet.id) ?? pet;
  const previousPhotoCleanupFailed = await cleanUpPreviousPhoto(existing?.photoUri, photoUri);

  return { ...committedState, pet: committedPet, previousPhotoCleanupFailed };
}

async function readPersistedState(): Promise<PetState | undefined> {
  try {
    return await loadPets();
  } catch {
    return undefined;
  }
}

async function cleanUpUncommittedPhoto(
  photoUri: string,
  persistedState: PetState | undefined,
): Promise<string | undefined> {
  if (!persistedState || persistedState.pets.some((pet) => pet.photoUri === photoUri)) {
    return photoUri;
  }
  try {
    await deletePersistedPetPhoto(photoUri);
    return undefined;
  } catch {
    return photoUri;
  }
}

function stateContainsCommittedPet(state: PetState, expectedPet: Pet): boolean {
  const persistedPet = state.pets.find((pet) => pet.id === expectedPet.id);
  return state.activePetId === expectedPet.id && petsMatch(persistedPet, expectedPet);
}

async function cleanUpPreviousPhoto(
  previousPhotoUri: string | undefined,
  currentPhotoUri: string | undefined,
): Promise<boolean> {
  if (!previousPhotoUri || previousPhotoUri === currentPhotoUri) return false;
  try {
    await deletePersistedPetPhoto(previousPhotoUri);
    return false;
  } catch {
    return true;
  }
}

function petsMatch(left: Pet | undefined, right: Pet): boolean {
  return (
    left?.id === right.id &&
    left.name === right.name &&
    left.species === right.species &&
    left.breed === right.breed &&
    left.birthDate === right.birthDate &&
    left.photoUri === right.photoUri &&
    left.photoStorageVersion === right.photoStorageVersion &&
    left.createdAt === right.createdAt
  );
}

function createPetId(): string {
  return `pet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
