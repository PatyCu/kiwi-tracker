import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

const PET_IMAGE_DIRECTORY_NAME = 'pet-images';

export type SelectedPetPhoto = {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
};

class PetImageError extends Error {
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

  const extension = getExtension(photo.uri);

  try {
    const directory = getPetImageDirectory();
    if (!directory.exists) {
      directory.create({ intermediates: true, idempotent: true });
    }
    const destination = new File(directory, `${petId}-${Date.now()}.${extension}`);
    await new File(photo.uri).copy(destination);
    return destination.uri;
  } catch (error) {
    throw new PetImageError('Could not save the selected pet photo.', error);
  }
}

export async function deletePersistedPetPhoto(uri?: string): Promise<void> {
  if (!uri || Platform.OS === 'web') return;
  try {
    if (!uri.startsWith(getPetImageDirectory().uri)) return;
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    throw new PetImageError('Could not remove the previous pet photo.', error);
  }
}

function getPetImageDirectory(): Directory {
  return new Directory(Paths.document, PET_IMAGE_DIRECTORY_NAME);
}

function getExtension(uri: string): string {
  const match = uri.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
  const extension = match?.[1]?.toLowerCase();
  return extension && ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(extension)
    ? extension
    : 'jpg';
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
