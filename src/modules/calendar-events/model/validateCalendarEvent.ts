import { CalendarEvent, NewCalendarEvent } from '@/modules/calendar-events/model/CalendarEvent';

export function isCalendarEvent(value: unknown): value is CalendarEvent {
  if (!isNewCalendarEvent(value)) return false;
  const event = value as Partial<CalendarEvent>;
  return isNonEmptyString(event.id) && isIsoTimestamp(event.createdAt);
}

export function isNewCalendarEvent(value: unknown): value is NewCalendarEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<NewCalendarEvent>;
  return (
    isNonEmptyString(event.petId) &&
    isNonEmptyString(event.title) &&
    isIsoTimestamp(event.startsAt) &&
    isIsoTimestamp(event.endsAt) &&
    Date.parse(event.endsAt) > Date.parse(event.startsAt) &&
    isOptionalString(event.location) &&
    isOptionalString(event.description)
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}
