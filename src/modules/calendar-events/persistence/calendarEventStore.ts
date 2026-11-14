import { CalendarEvent, NewCalendarEvent } from '@/modules/calendar-events/model/CalendarEvent';
import {
  isCalendarEvent,
  isNewCalendarEvent,
} from '@/modules/calendar-events/model/validateCalendarEvent';
import type { Tables, TablesInsert } from '@/shared/supabase/database.types';
import { getSupabaseClient } from '@/shared/supabase/supabaseClient';

type CalendarEventRow = Tables<'calendar_events'>;
type CalendarEventColumns = Omit<TablesInsert<'calendar_events'>, 'id' | 'created_at'>;

const EVENT_COLUMNS = 'id, pet_id, title, starts_at, ends_at, location, description, created_at';

type CalendarEventStorageErrorCode = 'READ_FAILED' | 'INVALID_DATA' | 'WRITE_FAILED';

export class CalendarEventStorageError extends Error {
  readonly code: CalendarEventStorageErrorCode;
  readonly cause: unknown;

  constructor(code: CalendarEventStorageErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'CalendarEventStorageError';
    this.code = code;
    this.cause = cause;
  }
}

/**
 * Returns the calendar events of every pet in the signed-in user's household,
 * in date order. Access rules only return that household's events.
 */
export async function loadCalendarEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await getSupabaseClient()
    .from('calendar_events')
    .select(EVENT_COLUMNS)
    .order('starts_at', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) {
    throw new CalendarEventStorageError('READ_FAILED', 'Could not load calendar events.', error);
  }
  return data.map(toCalendarEvent);
}

/** Saves one calendar event and returns it with the id and createdAt storage gave it. */
export async function insertCalendarEvent(event: NewCalendarEvent): Promise<CalendarEvent> {
  if (!isNewCalendarEvent(event)) {
    throw new CalendarEventStorageError(
      'INVALID_DATA',
      'The calendar event is not valid and was not saved.',
    );
  }
  const { data, error } = await getSupabaseClient()
    .from('calendar_events')
    .insert(toColumns(event))
    .select(EVENT_COLUMNS)
    .single();
  if (error) {
    throw new CalendarEventStorageError(
      'WRITE_FAILED',
      'Could not save the calendar event.',
      error,
    );
  }
  return toCalendarEvent(data);
}

function toColumns(event: NewCalendarEvent): CalendarEventColumns {
  return {
    pet_id: event.petId,
    title: event.title,
    starts_at: event.startsAt,
    ends_at: event.endsAt,
    location: event.location ?? null,
    description: event.description ?? null,
  };
}

function toCalendarEvent(row: CalendarEventRow): CalendarEvent {
  const event = {
    id: row.id,
    petId: row.pet_id,
    title: row.title,
    // Postgres returns microseconds and a +00:00 offset; the app works with ISO strings in UTC.
    startsAt: toIsoString(row.starts_at),
    endsAt: toIsoString(row.ends_at),
    createdAt: toIsoString(row.created_at),
    ...(row.location ? { location: row.location } : {}),
    ...(row.description ? { description: row.description } : {}),
  };
  if (!isCalendarEvent(event)) {
    throw new CalendarEventStorageError(
      'INVALID_DATA',
      `Calendar event ${row.id} has an invalid format.`,
    );
  }
  return event;
}

function toIsoString(timestamp: string): string {
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : timestamp;
}
