import {
  CalendarItem,
  toCalendarEventItem,
  UNKNOWN_PET_NAME,
} from '@/modules/calendar/calendarItems';
import { CalendarEvent } from '@/modules/calendar-events/model/CalendarEvent';
import { Pet } from '@/modules/pets/model/Pet';

/** How many local calendar days, today included, upcoming care covers. */
export const UPCOMING_CARE_DAYS = 7;

/**
 * The calendar events still to come or under way (not yet ended) that start
 * before the end of the last of the next 7 local days, today included, soonest
 * first. Events that have ended belong to Overdue instead.
 */
export function toUpcomingCareItems(
  calendarEvents: readonly CalendarEvent[],
  pets: readonly Pet[],
  calendarEventColor: string,
  now: Date,
  /** Only this pet's events, for a pet's page. */
  petId?: string,
): CalendarItem[] {
  const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + UPCOMING_CARE_DAYS);
  const petNames = new Map(pets.map((pet) => [pet.id, pet.name]));

  return calendarEvents
    .filter(
      (event) =>
        (petId === undefined || event.petId === petId) &&
        Date.parse(event.endsAt) > now.getTime() &&
        Date.parse(event.startsAt) < windowEnd.getTime(),
    )
    .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))
    .map((event) =>
      toCalendarEventItem(event, petNames.get(event.petId) ?? UNKNOWN_PET_NAME, calendarEventColor),
    );
}
