import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@kiwi-tracker/pets/v1';
const ACTIVE_PET_KEY = '@kiwi-tracker/active-pet/v1';

export type Pet = {
  id: string;
  name: string;
  species: 'Cat' | 'Dog' | 'Other';
  breed?: string;
  birthDate?: string;
  photoUri?: string;
  photoStorageVersion?: 1;
  createdAt: string;
};

export const DEFAULT_PET: Pet = {
  id: 'kiwi',
  name: 'Kiwi',
  species: 'Cat',
  createdAt: '2025-01-01T00:00:00.000Z',
};

export class PetStorageError extends Error {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PetStorageError';
    this.cause = cause;
  }
}

export async function loadPets(): Promise<{ pets: Pet[]; activePetId: string }> {
  try {
    const [storedPets, storedActivePetId] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(ACTIVE_PET_KEY),
    ]);
    if (!storedPets) return { pets: [DEFAULT_PET], activePetId: DEFAULT_PET.id };

    const parsed: unknown = JSON.parse(storedPets);
    if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every(isPet)) {
      throw new Error('Stored pets do not match the expected data format.');
    }
    const activePetId = parsed.some((pet) => pet.id === storedActivePetId)
      ? storedActivePetId!
      : parsed[0].id;
    return { pets: parsed, activePetId };
  } catch (error) {
    throw new PetStorageError('Could not load locally saved pets.', error);
  }
}

export async function savePets(pets: Pet[], activePetId: string): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pets)),
      AsyncStorage.setItem(ACTIVE_PET_KEY, activePetId),
    ]);
  } catch (error) {
    throw new PetStorageError('Could not save pets.', error);
  }
}

export async function saveActivePetId(activePetId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_PET_KEY, activePetId);
  } catch (error) {
    throw new PetStorageError('Could not save the active pet.', error);
  }
}

function isPet(value: unknown): value is Pet {
  if (!value || typeof value !== 'object') return false;
  const pet = value as Partial<Pet>;
  return typeof pet.id === 'string' && typeof pet.name === 'string' && pet.name.trim().length > 0 &&
    ['Cat', 'Dog', 'Other'].includes(pet.species ?? '') && typeof pet.createdAt === 'string' &&
    (pet.breed === undefined || typeof pet.breed === 'string') &&
    (pet.birthDate === undefined || typeof pet.birthDate === 'string') &&
    (pet.photoUri === undefined || typeof pet.photoUri === 'string') &&
    (pet.photoStorageVersion === undefined || pet.photoStorageVersion === 1);
}
