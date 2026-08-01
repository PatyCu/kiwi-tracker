import { Pet, PetState } from '@/modules/pets/model/Pet';

export function isPetState(value: unknown): value is PetState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<PetState>;
  if (!Array.isArray(state.pets) || state.pets.length === 0 || !state.pets.every(isPet)) {
    return false;
  }

  const uniqueIds = new Set(state.pets.map((pet) => pet.id));
  return (
    uniqueIds.size === state.pets.length &&
    typeof state.activePetId === 'string' &&
    state.pets.some((pet) => pet.id === state.activePetId)
  );
}

export function isPet(value: unknown): value is Pet {
  if (!value || typeof value !== 'object') return false;
  const pet = value as Partial<Pet>;
  return (
    typeof pet.id === 'string' &&
    pet.id.trim().length > 0 &&
    typeof pet.name === 'string' &&
    pet.name.trim().length > 0 &&
    ['Cat', 'Dog', 'Other'].includes(pet.species ?? '') &&
    isIsoTimestamp(pet.createdAt) &&
    (pet.breed === undefined || typeof pet.breed === 'string') &&
    (pet.birthDate === undefined || isIsoDate(pet.birthDate)) &&
    (pet.photoUri === undefined || typeof pet.photoUri === 'string') &&
    (pet.photoStorageVersion === undefined || pet.photoStorageVersion === 1)
  );
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(`${value}T`);
}
