import { Ionicons } from '@expo/vector-icons';

import { toDayKey } from '@/modules/calendar/monthGrid';
import { CalendarEvent } from '@/modules/calendar-events/model/CalendarEvent';
import { PetEvent } from '@/modules/pet-events/model/PetEvent';
import { toTimelineEntry } from '@/modules/pet-events/timeline/toTimelineEntries';
import { Pet } from '@/modules/pets/model/Pet';

/** Something on the calendar: what was logged for a pet, or a planned calendar event. */
export type CalendarItem = {
  id: string;
  kind: 'pet-event' | 'calendar-event';
  petId: string;
  petName: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  /** When it happened or starts, as an ISO timestamp. */
  startsAt: string;
  /** Only calendar events have an end. */
  endsAt?: string;
  location?: string;
};

/** Shown when an item's pet is no longer in the household's list. */
export const UNKNOWN_PET_NAME = 'Unknown pet';

export type CalendarKindChoice = 'all' | 'pet-events' | 'calendar-events';

/** How each kind choice is named wherever the calendar shows or offers it. */
export const CALENDAR_KIND_LABELS: Record<CalendarKindChoice, string> = {
  all: 'All events',
  'pet-events': 'Pet events',
  'calendar-events': 'Calendar events',
};

export type CalendarFilters = {
  kind: CalendarKindChoice;
  /** The pets whose items are shown. */
  petIds: readonly string[];
};

export type CalendarItemColors = {
  symptom: string;
  diet: string;
  other: string;
  calendarEvent: string;
};

export function toCalendarItems(
  petEvents: readonly PetEvent[],
  calendarEvents: readonly CalendarEvent[],
  pets: readonly Pet[],
  colors: CalendarItemColors,
): CalendarItem[] {
  const petNames = new Map(pets.map((pet) => [pet.id, pet.name]));
  const petName = (petId: string) => petNames.get(petId) ?? UNKNOWN_PET_NAME;

  const logged = petEvents.map((event): CalendarItem => {
    const entry = toTimelineEntry(event, colors.symptom, colors.diet, colors.other, new Date());
    return {
      id: event.id,
      kind: 'pet-event',
      petId: event.petId,
      petName: petName(event.petId),
      title: entry.title,
      icon: entry.icon,
      color: entry.color,
      startsAt: event.occurredAt,
    };
  });
  const planned = calendarEvents.map((event) =>
    toCalendarEventItem(event, petName(event.petId), colors.calendarEvent),
  );
  return [...logged, ...planned];
}

/** How a planned calendar event shows wherever it is listed. */
export function toCalendarEventItem(
  event: CalendarEvent,
  petName: string,
  color: string,
): CalendarItem {
  return {
    id: event.id,
    kind: 'calendar-event',
    petId: event.petId,
    petName,
    title: event.title,
    icon: 'calendar-outline',
    color,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    ...(event.location ? { location: event.location } : {}),
  };
}

export function filterCalendarItems(
  items: readonly CalendarItem[],
  { kind, petIds }: CalendarFilters,
): CalendarItem[] {
  return items.filter(
    (item) =>
      (kind === 'all' ||
        (kind === 'pet-events' ? item.kind === 'pet-event' : item.kind === 'calendar-event')) &&
      petIds.includes(item.petId),
  );
}

/** The items of each local day (keyed by toDayKey), earliest first. */
export function groupCalendarItemsByDay(
  items: readonly CalendarItem[],
): Map<string, CalendarItem[]> {
  const days = new Map<string, CalendarItem[]>();
  const sorted = [...items].sort(
    (left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt),
  );
  for (const item of sorted) {
    const key = toDayKey(new Date(item.startsAt));
    const day = days.get(key);
    if (day) day.push(item);
    else days.set(key, [item]);
  }
  return days;
}
