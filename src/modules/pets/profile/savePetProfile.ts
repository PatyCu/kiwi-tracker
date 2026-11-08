import {
  deletePersistedPetPhoto,
  persistPetPhoto,
  SelectedPetPhoto,
} from '@/modules/pets/media/petImageStore';
import { Pet, PetProfile } from '@/modules/pets/model/Pet';
import { insertPet, updatePet } from '@/modules/pets/persistence/petStore';

export type SavePetProfileInput = {
  pets: Pet[];
  /** Household a new pet is added to. */
  householdId: string;
  editingPetId?: string;
  name: string;
  species: Pet['species'];
  breed?: string;
  birthDate?: string;
  selectedPhoto?: SelectedPetPhoto;
};

export type SavePetProfileResult = {
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

/**
 * Adds a pet to the household or saves an existing one, as one record.
 *
 * Photos are still kept on this device only and aren't stored with the pet, so
 * a chosen photo shows until the app reloads. Storing them in the household's
 * photo bucket is a separate step.
 */
export async function savePetProfile(input: SavePetProfileInput): Promise<SavePetProfileResult> {
  const existing = input.pets.find((pet) => pet.id === input.editingPetId);
  if (input.editingPetId && !existing) {
    throw new PetProfileSaveError('The pet being edited no longer exists.', undefined);
  }

  let createdPhotoUri: string | undefined;
  try {
    if (input.selectedPhoto) {
      createdPhotoUri = await persistPetPhoto(input.selectedPhoto, existing?.id ?? 'new-pet');
    }
  } catch (error) {
    throw new PetProfileSaveError('Could not persist the selected pet photo.', error);
  }

  const profile: PetProfile = {
    name: input.name.trim(),
    species: input.species,
    breed: input.breed?.trim() || undefined,
    birthDate: input.birthDate,
  };

  let stored: Pet;
  try {
    stored = existing
      ? await updatePet(existing.id, profile)
      : await insertPet(input.householdId, profile);
  } catch (error) {
    const retainedPhotoUri = createdPhotoUri
      ? await cleanUpUncommittedPhoto(createdPhotoUri)
      : undefined;
    throw new PetProfileSaveError('Could not save the pet profile.', error, retainedPhotoUri);
  }

  const photoUri = createdPhotoUri ?? existing?.photoUri;
  const pet: Pet = photoUri ? { ...stored, photoUri } : stored;
  const previousPhotoCleanupFailed = await cleanUpPreviousPhoto(existing?.photoUri, photoUri);

  return { pet, previousPhotoCleanupFailed };
}

async function cleanUpUncommittedPhoto(photoUri: string): Promise<string | undefined> {
  try {
    await deletePersistedPetPhoto(photoUri);
    return undefined;
  } catch {
    return photoUri;
  }
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
