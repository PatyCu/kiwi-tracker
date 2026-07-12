import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Pet } from '@/lib/pets';

const PET_IMAGE_DIRECTORY = `${FileSystem.documentDirectory ?? ''}pet-images/`;

export type SelectedPetPhoto = {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
};

export class PetImageError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PetImageError';
    this.cause = cause;
  }
}

export async function persistPetPhoto(photo: SelectedPetPhoto, petId: string): Promise<string> {
  if (Platform.OS === 'web') {
    if (!photo.base64) {
      throw new PetImageError('The selected web image could not be made persistent.');
    }
    return optimizeWebPhoto(`data:${photo.mimeType ?? 'image/jpeg'};base64,${photo.base64}`);
  }

  if (!FileSystem.documentDirectory) {
    throw new PetImageError('A permanent image directory is not available on this device.');
  }

  const extension = getExtension(photo.uri);
  const destination = `${PET_IMAGE_DIRECTORY}${petId}-${Date.now()}.${extension}`;

  try {
    const directory = await FileSystem.getInfoAsync(PET_IMAGE_DIRECTORY);
    if (!directory.exists) {
      await FileSystem.makeDirectoryAsync(PET_IMAGE_DIRECTORY, { intermediates: true });
    }
    await FileSystem.copyAsync({ from: photo.uri, to: destination });
    return destination;
  } catch (error) {
    throw new PetImageError('Could not save the selected pet photo.', error);
  }
}

export async function deletePersistedPetPhoto(uri?: string): Promise<void> {
  if (!uri || Platform.OS === 'web' || !uri.startsWith(PET_IMAGE_DIRECTORY)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    throw new PetImageError('Could not remove the previous pet photo.', error);
  }
}

export async function migrateLegacyPetPhotos(pets: Pet[]): Promise<{
  pets: Pet[];
  createdUris: string[];
  failedPetNames: string[];
  didChange: boolean;
}> {
  const createdUris: string[] = [];
  const failedPetNames: string[] = [];
  let didChange = false;

  const migratedPets = await Promise.all(pets.map(async (pet) => {
    if (!pet.photoUri) return pet;
    if (Platform.OS === 'web') {
      if (pet.photoUri.startsWith('data:') && pet.photoStorageVersion !== 1) {
        try {
          const photoUri = await optimizeWebPhoto(pet.photoUri);
          didChange = true;
          return { ...pet, photoUri, photoStorageVersion: 1 as const };
        } catch {
          failedPetNames.push(pet.name);
          return pet;
        }
      }
      if (isPersistedPetPhoto(pet.photoUri)) return pet;
      failedPetNames.push(pet.name);
      return pet;
    }
    if (isPersistedPetPhoto(pet.photoUri)) return pet;
    try {
      const photoUri = await persistPetPhoto({ uri: pet.photoUri }, pet.id);
      createdUris.push(photoUri);
      didChange = true;
      return { ...pet, photoUri, photoStorageVersion: 1 as const };
    } catch {
      failedPetNames.push(pet.name);
      return pet;
    }
  }));

  return { pets: migratedPets, createdUris, failedPetNames, didChange };
}

function isPersistedPetPhoto(uri: string): boolean {
  if (Platform.OS === 'web') return uri.startsWith('data:') || uri.startsWith('http');
  return uri.startsWith(PET_IMAGE_DIRECTORY);
}

function getExtension(uri: string): string {
  const match = uri.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
  const extension = match?.[1]?.toLowerCase();
  return extension && ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(extension) ? extension : 'jpg';
}

function optimizeWebPhoto(dataUri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const maxSize = 512;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new PetImageError('Could not prepare the selected web photo.'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    image.onerror = () => reject(new PetImageError('Could not read the selected web photo.'));
    image.src = dataUri;
  });
}
