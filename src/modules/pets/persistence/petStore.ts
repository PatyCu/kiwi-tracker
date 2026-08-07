import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_PET, Pet, PetState } from '@/modules/pets/model/Pet';
import { isPet, isPetState } from '@/modules/pets/model/validatePet';

const STATE_STORAGE_KEY = '@kiwi-tracker/pet-state/v2';
const LEGACY_PETS_STORAGE_KEY = '@kiwi-tracker/pets/v1';
const LEGACY_ACTIVE_PET_STORAGE_KEY = '@kiwi-tracker/active-pet/v1';
const PET_STATE_VERSION = 2;

type StoredPetState = PetState & {
  version: typeof PET_STATE_VERSION;
};

type PetStorageErrorCode = 'READ_FAILED' | 'INVALID_DATA' | 'MIGRATION_FAILED' | 'WRITE_FAILED';

export class PetStorageError extends Error {
  readonly code: PetStorageErrorCode;
  readonly cause: unknown;

  constructor(code: PetStorageErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'PetStorageError';
    this.code = code;
    this.cause = cause;
  }
}

export async function loadPets(): Promise<PetState> {
  let storedState: string | null;

  try {
    storedState = await AsyncStorage.getItem(STATE_STORAGE_KEY);
  } catch (error) {
    throw new PetStorageError('READ_FAILED', 'Could not read locally saved pets.', error);
  }

  if (storedState !== null) return parseStoredState(storedState);
  return loadAndMigrateLegacyState();
}

export async function savePets(pets: Pet[], activePetId: string): Promise<void> {
  const state = { pets, activePetId };
  if (!isPetState(state)) {
    throw new PetStorageError('INVALID_DATA', 'Pet state is not valid and was not saved.');
  }

  try {
    await writeState(state);
  } catch (error) {
    throw new PetStorageError('WRITE_FAILED', 'Could not save pets.', error);
  }
}

async function loadAndMigrateLegacyState(): Promise<PetState> {
  let storedPets: string | null;
  let storedActivePetId: string | null;

  try {
    [storedPets, storedActivePetId] = await Promise.all([
      AsyncStorage.getItem(LEGACY_PETS_STORAGE_KEY),
      AsyncStorage.getItem(LEGACY_ACTIVE_PET_STORAGE_KEY),
    ]);
  } catch (error) {
    throw new PetStorageError('READ_FAILED', 'Could not read legacy pet data.', error);
  }

  if (storedPets === null) return { pets: [DEFAULT_PET], activePetId: DEFAULT_PET.id };

  let parsedPets: unknown;
  try {
    parsedPets = JSON.parse(storedPets);
  } catch (error) {
    throw new PetStorageError('INVALID_DATA', 'Legacy pet data is not valid JSON.', error);
  }

  if (!Array.isArray(parsedPets) || parsedPets.length === 0 || !parsedPets.every(isPet)) {
    throw new PetStorageError('INVALID_DATA', 'Legacy pet data has an invalid format.');
  }

  const activePetId = parsedPets.some((pet) => pet.id === storedActivePetId)
    ? storedActivePetId!
    : parsedPets[0].id;
  const state = { pets: parsedPets, activePetId };

  try {
    await writeState(state);
  } catch (error) {
    throw new PetStorageError(
      'MIGRATION_FAILED',
      'Legacy pet data could not be migrated safely.',
      error,
    );
  }

  return state;
}

function parseStoredState(stored: string): PetState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch (error) {
    throw new PetStorageError('INVALID_DATA', 'Stored pet state is not valid JSON.', error);
  }

  if (!isStoredPetState(parsed)) {
    throw new PetStorageError('INVALID_DATA', 'Stored pet state has an invalid format.');
  }

  return { pets: parsed.pets, activePetId: parsed.activePetId };
}

function writeState(state: PetState): Promise<void> {
  const storedState: StoredPetState = { version: PET_STATE_VERSION, ...state };
  return AsyncStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(storedState));
}

function isStoredPetState(value: unknown): value is StoredPetState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<StoredPetState>;
  return state.version === PET_STATE_VERSION && isPetState(state);
}
