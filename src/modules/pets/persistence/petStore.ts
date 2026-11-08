import { Pet, PET_SPECIES, PetProfile } from '@/modules/pets/model/Pet';
import type { Tables } from '@/shared/supabase/database.types';
import { getSupabaseClient } from '@/shared/supabase/supabaseClient';

type PetRow = Pick<Tables<'pets'>, 'id' | 'name' | 'species' | 'breed' | 'birth_date'>;

const PET_COLUMNS = 'id, name, species, breed, birth_date';

type PetStorageErrorCode = 'READ_FAILED' | 'INVALID_DATA' | 'WRITE_FAILED';

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

/**
 * Returns the pets of the signed-in user's household, by name. Access
 * rules only return that household's pets. Photos aren't stored yet, so loaded
 * pets have no photoUri.
 */
export async function loadPets(): Promise<Pet[]> {
  const { data, error } = await getSupabaseClient()
    .from('pets')
    .select(PET_COLUMNS)
    .order('name')
    .order('id');
  if (error) throw new PetStorageError('READ_FAILED', 'Could not load pets.', error);
  return data.map(toPet);
}

/** Adds a pet to the given household and returns it with its new id. */
export async function insertPet(householdId: string, profile: PetProfile): Promise<Pet> {
  const { data, error } = await getSupabaseClient()
    .from('pets')
    .insert({ household_id: householdId, ...toPetColumns(profile) })
    .select(PET_COLUMNS)
    .single();
  if (error) throw new PetStorageError('WRITE_FAILED', 'Could not add the pet.', error);
  return toPet(data);
}

/**
 * Saves a pet's profile and returns the stored pet. Fails when the pet no
 * longer exists or belongs to another household.
 */
export async function updatePet(petId: string, profile: PetProfile): Promise<Pet> {
  const { data, error } = await getSupabaseClient()
    .from('pets')
    .update(toPetColumns(profile))
    .eq('id', petId)
    .select(PET_COLUMNS)
    .single();
  if (error) throw new PetStorageError('WRITE_FAILED', 'Could not save the pet.', error);
  return toPet(data);
}

function toPetColumns(profile: PetProfile) {
  return {
    name: profile.name,
    species: profile.species,
    breed: profile.breed ?? null,
    birth_date: profile.birthDate ?? null,
  };
}

function toPet(row: PetRow): Pet {
  const species = PET_SPECIES.find((value) => value === row.species);
  if (!species) {
    throw new PetStorageError('INVALID_DATA', `Pet ${row.id} has an unknown species.`);
  }
  return {
    id: row.id,
    name: row.name,
    species,
    ...(row.breed ? { breed: row.breed } : {}),
    ...(row.birth_date ? { birthDate: row.birth_date } : {}),
  };
}
