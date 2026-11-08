import { NewPetEvent, PetEvent } from '@/modules/pet-events/model/PetEvent';
import { isNewPetEvent, isPetEvent } from '@/modules/pet-events/model/validatePetEvent';
import type { Json, Tables, TablesInsert } from '@/shared/supabase/database.types';
import { getSupabaseClient } from '@/shared/supabase/supabaseClient';

type PetEventRow = Tables<'pet_events'>;
type PetEventColumns = Omit<TablesInsert<'pet_events'>, 'id' | 'created_at'>;

const EVENT_COLUMNS =
  'id, pet_id, type, occurred_at, note, symptom, title, diet_change, created_at';

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

/**
 * Returns the events of every pet in the signed-in user's household, newest
 * first. Access rules only return that household's events.
 */
export async function loadPetEvents(): Promise<PetEvent[]> {
  const { data, error } = await getSupabaseClient()
    .from('pet_events')
    .select(EVENT_COLUMNS)
    .order('occurred_at', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new PetEventStorageError('READ_FAILED', 'Could not load pet events.', error);
  return data.map(toPetEvent);
}

/** Logs one event and returns it with the id and createdAt storage gave it. */
export async function insertPetEvent(event: NewPetEvent): Promise<PetEvent> {
  if (!isNewPetEvent(event)) {
    throw new PetEventStorageError('INVALID_DATA', 'The pet event is not valid and was not saved.');
  }
  const { data, error } = await getSupabaseClient()
    .from('pet_events')
    .insert(toColumns(event))
    .select(EVENT_COLUMNS)
    .single();
  if (error) throw new PetEventStorageError('WRITE_FAILED', 'Could not save the pet event.', error);
  return toPetEvent(data);
}

/**
 * Saves one corrected event and returns the stored version. Fails when the
 * event was deleted in the meantime.
 */
export async function updatePetEvent(event: PetEvent): Promise<PetEvent> {
  if (!isPetEvent(event)) {
    throw new PetEventStorageError('INVALID_DATA', 'The pet event is not valid and was not saved.');
  }
  const { data, error } = await getSupabaseClient()
    .from('pet_events')
    .update(toColumns(event))
    .eq('id', event.id)
    .select(EVENT_COLUMNS)
    .single();
  if (error) throw new PetEventStorageError('WRITE_FAILED', 'Could not save the pet event.', error);
  return toPetEvent(data);
}

/** Deletes one event. Deleting an event that is already gone succeeds. */
export async function deletePetEvent(eventId: string): Promise<void> {
  const { error } = await getSupabaseClient().from('pet_events').delete().eq('id', eventId);
  if (error) {
    throw new PetEventStorageError('WRITE_FAILED', 'Could not delete the pet event.', error);
  }
}

function toColumns(event: NewPetEvent): PetEventColumns {
  return {
    pet_id: event.petId,
    type: event.type,
    occurred_at: event.occurredAt,
    note: event.note ?? null,
    symptom: event.type === 'symptom' ? event.symptom : null,
    title: event.type === 'other' ? event.title : null,
    diet_change: event.type === 'diet-change' ? (event.change as Json) : null,
  };
}

function toPetEvent(row: PetEventRow): PetEvent {
  const event = {
    id: row.id,
    petId: row.pet_id,
    type: row.type,
    // Postgres returns microseconds and a +00:00 offset; the app works with ISO strings in UTC.
    occurredAt: toIsoString(row.occurred_at),
    createdAt: toIsoString(row.created_at),
    ...(row.note ? { note: row.note } : {}),
    ...(row.type === 'symptom' ? { symptom: row.symptom } : {}),
    ...(row.type === 'other' ? { title: row.title } : {}),
    ...(row.type === 'diet-change' ? { change: row.diet_change } : {}),
  };
  if (!isPetEvent(event)) {
    throw new PetEventStorageError('INVALID_DATA', `Pet event ${row.id} has an invalid format.`);
  }
  return event;
}

function toIsoString(timestamp: string): string {
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : timestamp;
}
