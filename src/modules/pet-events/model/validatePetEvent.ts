import {
  DIET_ITEM_TYPES,
  DietChange,
  DietItemSnapshot,
  NewPetEvent,
  PetEvent,
  SYMPTOM_KINDS,
} from '@/modules/pet-events/model/PetEvent';

export function isPetEvent(value: unknown): value is PetEvent {
  if (!isNewPetEvent(value)) return false;
  const event = value as Partial<PetEvent>;
  return isNonEmptyString(event.id) && isIsoTimestamp(event.createdAt);
}

export function isNewPetEvent(value: unknown): value is NewPetEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<NewPetEvent>;
  const baseIsValid =
    isNonEmptyString(event.petId) &&
    isIsoTimestamp(event.occurredAt) &&
    (event.note === undefined || typeof event.note === 'string');
  if (!baseIsValid) return false;

  if (event.type === 'symptom') {
    return SYMPTOM_KINDS.some((symptom) => symptom === event.symptom);
  }

  if (event.type === 'diet-change') return isDietChange(event.change);
  return event.type === 'other' && isNonEmptyString(event.title);
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
