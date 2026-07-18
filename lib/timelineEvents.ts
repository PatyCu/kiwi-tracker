import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@kiwi-tracker/timeline-events/v1';

export const SYMPTOM_KINDS = [
  'Vomiting',
  'Diarrhea',
  'Asthma',
  'Hairball',
  'Nausea',
  'Loss of appetite',
  'Other',
] as const;

export const DIET_ITEM_TYPES = ['dry-food', 'wet-food', 'snack', 'supplement', 'other'] as const;

export type SymptomKind = (typeof SYMPTOM_KINDS)[number];
export type DietItemType = (typeof DIET_ITEM_TYPES)[number];

export type TimelineEventBase = {
  id: string;
  petId: string;
  occurredAt: string;
  recordedAt: string;
  note?: string;
};

export type SymptomEvent = TimelineEventBase & {
  type: 'symptom';
  symptom: SymptomKind;
};

export type DietItemSnapshot = {
  id: string;
  productName: string;
  foodType: DietItemType;
};

export type DietItemInput = Omit<DietItemSnapshot, 'id'>;

export type DietChange =
  | {
      type: 'replace';
      previousItem: DietItemSnapshot;
      nextItem: DietItemSnapshot;
    }
  | {
      type: 'add';
      item: DietItemSnapshot;
    }
  | {
      type: 'remove';
      item: DietItemSnapshot;
    };

export type DietChangeInput =
  | {
      type: 'replace';
      previousItem: DietItemSnapshot;
      nextItem: DietItemInput;
    }
  | {
      type: 'add';
      item: DietItemInput;
    }
  | {
      type: 'remove';
      item: DietItemSnapshot;
    };

export type DietChangeEvent = TimelineEventBase & {
  type: 'diet-change';
  change: DietChange;
};

export type OtherEvent = TimelineEventBase & {
  type: 'other';
  title: string;
};

export type TimelineEvent = SymptomEvent | DietChangeEvent | OtherEvent;

export type TimelineEventStorageErrorCode = 'READ_FAILED' | 'INVALID_DATA' | 'WRITE_FAILED';

export class TimelineEventStorageError extends Error {
  readonly code: TimelineEventStorageErrorCode;
  readonly cause: unknown;

  constructor(code: TimelineEventStorageErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'TimelineEventStorageError';
    this.code = code;
    this.cause = cause;
  }
}

export async function loadTimelineEvents(): Promise<TimelineEvent[]> {
  let stored: string | null;

  try {
    stored = await AsyncStorage.getItem(STORAGE_KEY);
  } catch (error) {
    throw new TimelineEventStorageError(
      'READ_FAILED',
      'Could not read stored timeline events.',
      error,
    );
  }

  if (stored === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch (error) {
    throw new TimelineEventStorageError(
      'INVALID_DATA',
      'Stored timeline events are not valid JSON.',
      error,
    );
  }

  if (!Array.isArray(parsed) || !parsed.every(isTimelineEvent)) {
    throw new TimelineEventStorageError(
      'INVALID_DATA',
      'Stored timeline events do not match the expected data format.',
    );
  }

  return parsed;
}

export async function saveTimelineEvents(events: TimelineEvent[]): Promise<void> {
  if (!events.every(isTimelineEvent)) {
    throw new TimelineEventStorageError(
      'INVALID_DATA',
      'Timeline events are not valid and were not saved.',
    );
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    throw new TimelineEventStorageError('WRITE_FAILED', 'Could not save timeline events.', error);
  }
}

function isTimelineEvent(value: unknown): value is TimelineEvent {
  if (!isTimelineEventBase(value)) return false;
  const event = value as Partial<TimelineEvent>;

  if (event.type === 'symptom') {
    return SYMPTOM_KINDS.some((symptom) => symptom === event.symptom);
  }

  if (event.type === 'diet-change') {
    return isDietChange(event.change);
  }

  return event.type === 'other' && isNonEmptyString(event.title);
}

function isTimelineEventBase(value: unknown): value is TimelineEventBase & { type?: unknown } {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<TimelineEventBase>;
  return (
    isNonEmptyString(event.id) &&
    isNonEmptyString(event.petId) &&
    isIsoTimestamp(event.occurredAt) &&
    isIsoTimestamp(event.recordedAt) &&
    (event.note === undefined || typeof event.note === 'string')
  );
}

function isDietChange(value: unknown): value is DietChange {
  if (!value || typeof value !== 'object') return false;
  const change = value as Partial<DietChange>;

  if (change.type === 'replace') {
    return isDietItem(change.previousItem) && isDietItem(change.nextItem);
  }

  return (change.type === 'add' || change.type === 'remove') && isDietItem(change.item);
}

function isDietItem(value: unknown): value is DietItemSnapshot {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<DietItemSnapshot>;
  return (
    isNonEmptyString(item.id) &&
    isNonEmptyString(item.productName) &&
    DIET_ITEM_TYPES.some((foodType) => foodType === item.foodType)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}
