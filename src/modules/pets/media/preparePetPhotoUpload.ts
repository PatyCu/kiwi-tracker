import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { PetPhotoUpload } from '@/modules/pets/persistence/petPhotoStore';

/**
 * Longest side of a stored photo, in pixels. The app shows photos at most
 * about 92 points wide, which is under 300 pixels on a 3x screen.
 */
const PHOTO_MAX_SIZE = 512;
const PHOTO_JPEG_QUALITY = 0.72;

export type SelectedPetPhoto = { uri: string; width: number; height: number };

export type PreparedPetPhoto = {
  upload: PetPhotoUpload;
  /** The scaled-down photo on this device, to show until a signed link replaces it. */
  previewUri: string;
};

export class PetPhotoError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PetPhotoError';
    this.cause = cause;
  }
}

/**
 * Scales a photo picked from the library down to a 512px JPEG, the same on
 * iOS and web, and returns the bytes to store.
 */
export async function preparePetPhotoUpload(photo: SelectedPetPhoto): Promise<PreparedPetPhoto> {
  let base64: string | undefined;
  let previewUri: string;
  try {
    const context = ImageManipulator.manipulate(photo.uri);
    if (Math.max(photo.width, photo.height) > PHOTO_MAX_SIZE) {
      context.resize(
        photo.width >= photo.height ? { width: PHOTO_MAX_SIZE } : { height: PHOTO_MAX_SIZE },
      );
    }
    const image = await context.renderAsync();
    const result = await image.saveAsync({
      format: SaveFormat.JPEG,
      compress: PHOTO_JPEG_QUALITY,
      base64: true,
    });
    base64 = result.base64;
    previewUri = result.uri;
  } catch (error) {
    throw new PetPhotoError('Could not prepare the selected photo.', error);
  }
  if (!base64) throw new PetPhotoError('The prepared photo has no data.');

  return { upload: { bytes: base64ToBytes(base64), contentType: 'image/jpeg' }, previewUri };
}

function base64ToBytes(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}
