import { Pet } from '@/modules/pets/model/Pet';
import { getSupabaseClient } from '@/shared/supabase/supabaseClient';

const PET_PHOTO_BUCKET = 'pet-photos';

/**
 * How long a signed photo link works. Anyone holding a link can open the photo
 * until it expires, even after leaving the household, so links stay short and
 * the app signs new ones before these run out.
 */
export const PET_PHOTO_LINK_LIFETIME_SECONDS = 60 * 60;

/** A photo ready to store: its bytes and their image type. */
export type PetPhotoUpload = { bytes: ArrayBuffer; contentType: string };

type PetPhotoStorageErrorCode = 'UPLOAD_FAILED' | 'REMOVE_FAILED' | 'LINK_FAILED';

export class PetPhotoStorageError extends Error {
  readonly code: PetPhotoStorageErrorCode;
  readonly cause: unknown;

  constructor(code: PetPhotoStorageErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'PetPhotoStorageError';
    this.code = code;
    this.cause = cause;
  }
}

/**
 * Stores a new photo for a pet and returns its path in the bucket. Each photo
 * gets its own file name, so devices can cache a photo by its path and know a
 * new path means a new photo. Access rules only accept pets in the signed-in
 * user's household.
 */
export async function uploadPetPhoto(petId: string, upload: PetPhotoUpload): Promise<string> {
  const path = `${petId}/${Date.now()}.jpg`;
  const { error } = await getSupabaseClient()
    .storage.from(PET_PHOTO_BUCKET)
    .upload(path, upload.bytes, { contentType: upload.contentType });
  if (error) throw new PetPhotoStorageError('UPLOAD_FAILED', 'Could not upload the photo.', error);
  return path;
}

/** Deletes a stored photo file. */
export async function removePetPhoto(path: string): Promise<void> {
  const { error } = await getSupabaseClient().storage.from(PET_PHOTO_BUCKET).remove([path]);
  if (error) throw new PetPhotoStorageError('REMOVE_FAILED', 'Could not remove the photo.', error);
}

/**
 * Returns the pets with a fresh signed link in photoUri for each stored photo.
 * A photo that can't be signed, such as a missing file, is left without a
 * link; a failed request throws.
 */
export async function withPhotoLinks(pets: Pet[]): Promise<Pet[]> {
  const paths = pets.flatMap((pet) => (pet.photoPath ? [pet.photoPath] : []));
  if (paths.length === 0) return pets;

  const { data, error } = await getSupabaseClient()
    .storage.from(PET_PHOTO_BUCKET)
    .createSignedUrls(paths, PET_PHOTO_LINK_LIFETIME_SECONDS);
  if (error) throw new PetPhotoStorageError('LINK_FAILED', 'Could not link the photos.', error);

  const links = new Map(
    data.flatMap((item) => (item.path && item.signedUrl ? [[item.path, item.signedUrl]] : [])),
  );
  return pets.map((pet) => {
    const { photoUri: _previousLink, ...rest } = pet;
    const link = pet.photoPath ? links.get(pet.photoPath) : undefined;
    return link ? { ...rest, photoUri: link } : rest;
  });
}
