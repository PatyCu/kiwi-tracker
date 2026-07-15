import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PET } from '@/lib/pets';
const STORAGE_KEY = '@kiwi-tracker/health-events/v1';

export const HEALTH_EVENT_KINDS = [
  'Vomiting',
  'Diarrhea',
  'Asthma',
  'Hairball',
  'Nausea',
  'Loss of appetite',
  'Other',
] as const;

export type HealthEventKind = (typeof HEALTH_EVENT_KINDS)[number];

export type HealthEvent = {
  id: string;
  petId: string;
  kind: HealthEventKind;
  note: string;
  occurredAt: string;
};

export type HealthEventStorageErrorCode = 'READ_FAILED' | 'INVALID_DATA' | 'WRITE_FAILED';

export class HealthEventStorageError extends Error {
  readonly code: HealthEventStorageErrorCode;
  readonly cause: unknown;

  constructor(code: HealthEventStorageErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'HealthEventStorageError';
    this.code = code;
    this.cause = cause;
  }
}

export async function loadHealthEvents(): Promise<HealthEvent[]> {
  let stored: string | null;

  try {
    stored = await AsyncStorage.getItem(STORAGE_KEY);
  } catch (error) {
    throw new HealthEventStorageError('READ_FAILED', 'Could not read stored health events.', error);
  }

  if (stored === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch (error) {
    throw new HealthEventStorageError(
      'INVALID_DATA',
      'Stored health events are not valid JSON.',
      error,
    );
  }

  if (!Array.isArray(parsed) || !parsed.every(isStoredHealthEvent)) {
    throw new HealthEventStorageError(
      'INVALID_DATA',
      'Stored health events do not match the expected data format.',
    );
  }

  // Events created before multi-pet support belong to the original Kiwi profile.
  return parsed.map((event) => ({ ...event, petId: event.petId ?? DEFAULT_PET.id }));
}

export async function saveHealthEvents(events: HealthEvent[]): Promise<void> {
  if (!events.every(isHealthEvent)) {
    throw new HealthEventStorageError(
      'INVALID_DATA',
      'Health events are not valid and were not saved.',
    );
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    throw new HealthEventStorageError('WRITE_FAILED', 'Could not save health events.', error);
  }
}

type StoredHealthEvent = Omit<HealthEvent, 'petId'> & { petId?: string };

function isStoredHealthEvent(value: unknown): value is StoredHealthEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<StoredHealthEvent>;
  return (
    typeof event.id === 'string' &&
    event.id.trim().length > 0 &&
    HEALTH_EVENT_KINDS.some((kind) => kind === event.kind) &&
    typeof event.note === 'string' &&
    isIsoTimestamp(event.occurredAt) &&
    (event.petId === undefined ||
      (typeof event.petId === 'string' && event.petId.trim().length > 0))
  );
}

function isHealthEvent(value: unknown): value is HealthEvent {
  return (
    isStoredHealthEvent(value) && typeof value.petId === 'string' && value.petId.trim().length > 0
  );
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}
