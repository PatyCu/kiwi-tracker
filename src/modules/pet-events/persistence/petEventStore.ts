import AsyncStorage from '@react-native-async-storage/async-storage';

import { PetEvent } from '@/modules/pet-events/model/PetEvent';
import { isPetEvent } from '@/modules/pet-events/model/validatePetEvent';

const STORAGE_KEY = '@kiwi-tracker/timeline-events/v1';

type PetEventStorageErrorCode = 'READ_FAILED' | 'INVALID_DATA' | 'WRITE_FAILED';

export class PetEventStorageError extends Error {
  readonly code: PetEventStorageErrorCode;
  readonly cause: unknown;

  constructor(code: PetEventStorageErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'PetEventStorageError';
    this.code = code;
    this.cause = cause;
  }
}

export async function loadPetEvents(): Promise<PetEvent[]> {
  let stored: string | null;
  try {
    stored = await AsyncStorage.getItem(STORAGE_KEY);
  } catch (error) {
    throw new PetEventStorageError('READ_FAILED', 'Could not read stored pet events.', error);
  }

  if (stored === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch (error) {
    throw new PetEventStorageError('INVALID_DATA', 'Stored pet events are not valid JSON.', error);
  }

  if (!Array.isArray(parsed) || !parsed.every(isPetEvent)) {
    throw new PetEventStorageError(
      'INVALID_DATA',
      'Stored pet events do not match the expected data format.',
    );
  }
  return parsed;
}

export async function savePetEvents(events: PetEvent[]): Promise<void> {
  if (!events.every(isPetEvent)) {
    throw new PetEventStorageError('INVALID_DATA', 'Pet events are not valid and were not saved.');
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    throw new PetEventStorageError('WRITE_FAILED', 'Could not save pet events.', error);
  }
}
