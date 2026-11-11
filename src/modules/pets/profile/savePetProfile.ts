import {
  PreparedPetPhoto,
  preparePetPhotoUpload,
  SelectedPetPhoto,
} from '@/modules/pets/media/preparePetPhotoUpload';
import { Pet, PetProfile } from '@/modules/pets/model/Pet';
import { removePetPhoto, uploadPetPhoto } from '@/modules/pets/persistence/petPhotoStore';
import { insertPet, setPetPhotoPath, updatePet } from '@/modules/pets/persistence/petStore';

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
  /** The profile was saved but the new photo wasn't, so the pet keeps its previous one. */
  photoSaveFailed: boolean;
};

export class PetProfileSaveError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause: unknown) {
    super(message);
    this.name = 'PetProfileSaveError';
    this.cause = cause;
  }
}

/**
 * Adds a pet to the household or saves an existing one, then stores its new
 * photo, if one was picked, in the household's photo bucket and deletes the
 * file it replaces.
 *
 * The photo is stored after the profile because the bucket only accepts photos
 * of pets that already exist. When only the photo fails, the saved profile is
 * still returned, so the caller keeps it and never adds the pet twice.
 */
export async function savePetProfile(input: SavePetProfileInput): Promise<SavePetProfileResult> {
  const existing = input.pets.find((pet) => pet.id === input.editingPetId);
  if (input.editingPetId && !existing) {
    throw new PetProfileSaveError('The pet being edited no longer exists.', undefined);
  }

  let photo: PreparedPetPhoto | undefined;
  try {
    if (input.selectedPhoto) photo = await preparePetPhotoUpload(input.selectedPhoto);
  } catch (error) {
    throw new PetProfileSaveError('Could not read the selected pet photo.', error);
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
    throw new PetProfileSaveError('Could not save the pet profile.', error);
  }

  const keptPet = keepPhotoLink(stored, existing);
  if (!photo) return { pet: keptPet, photoSaveFailed: false };

  let photoPath: string;
  try {
    photoPath = await uploadPetPhoto(stored.id, photo.upload);
  } catch {
    return { pet: keptPet, photoSaveFailed: true };
  }

  let withPhoto: Pet;
  try {
    withPhoto = await setPetPhotoPath(stored.id, photoPath);
  } catch {
    await removeUnusedPhoto(photoPath);
    return { pet: keptPet, photoSaveFailed: true };
  }

  if (stored.photoPath) await removeUnusedPhoto(stored.photoPath);
  // Show the scaled-down photo already on this device until a signed link replaces it.
  return { pet: { ...withPhoto, photoUri: photo.previewUri }, photoSaveFailed: false };
}

/**
 * Deletes a photo file no pet points to. A file this fails to delete is left
 * unused in the bucket; nobody sees it and no data is lost, so it isn't reported.
 */
async function removeUnusedPhoto(path: string): Promise<void> {
  try {
    await removePetPhoto(path);
  } catch {
    // Left for a later cleanup.
  }
}

/** Keeps the link already shown for the pet's stored photo, if it has one. */
function keepPhotoLink(stored: Pet, existing: Pet | undefined): Pet {
  const photoUri =
    existing?.photoUri && existing.photoPath === stored.photoPath ? existing.photoUri : undefined;
  return photoUri ? { ...stored, photoUri } : stored;
}
