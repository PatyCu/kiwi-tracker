import { Image, ImageSource } from 'expo-image';

import { Pet } from '@/modules/pets/model/Pet';

/**
 * How to show a pet's photo. Photos are cached under their storage path, not
 * their signed link, so a renewed link reuses the copy already on the device
 * and a new photo, which gets a new path, is downloaded once. Web relies on
 * the browser's cache instead, which goes by link.
 */
export function petPhotoSource(pet: Pick<Pet, 'photoUri' | 'photoPath'>): ImageSource | null {
  if (!pet.photoUri) return null;
  return pet.photoPath ? { uri: pet.photoUri, cacheKey: pet.photoPath } : { uri: pet.photoUri };
}

/** Removes cached photos, so the next account on this device can't see them. */
export async function clearCachedPetPhotos(): Promise<void> {
  await Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()]);
}
