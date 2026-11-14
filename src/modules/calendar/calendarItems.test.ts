import {
  CalendarItem,
  filterCalendarItems,
  groupCalendarItemsByDay,
  toCalendarItems,
} from '@/modules/calendar/calendarItems';
import { CalendarEvent } from '@/modules/calendar-events/model/CalendarEvent';
import { PetEvent } from '@/modules/pet-events/model/PetEvent';
import { Pet } from '@/modules/pets/model/Pet';

const colors = { symptom: 'coral', diet: 'kiwi', other: 'muted', calendarEvent: 'blue' };
const pets: Pet[] = [
  { id: 'kiwi', name: 'Kiwi', species: 'Cat' },
  { id: 'luna', name: 'Luna', species: 'Dog' },
];
const at = (day: number, hour: number) => new Date(2026, 10, day, hour).toISOString();
const createdAt = '2026-11-01T10:00:00.000Z';

const symptom: PetEvent = {
  id: 'symptom',
  petId: 'kiwi',
  type: 'symptom',
  symptom: 'Vomiting',
  occurredAt: at(4, 18),
  createdAt,
};
const other: PetEvent = {
  id: 'other',
  petId: 'luna',
  type: 'other',
  title: 'Groomer',
  occurredAt: at(4, 9),
  createdAt,
};
const vaccines: CalendarEvent = {
  id: 'vaccines',
  petId: 'luna',
  title: 'Vaccines',
  startsAt: at(12, 10),
  endsAt: at(12, 11),
  location: 'Riverside Vet',
  createdAt,
};

describe('calendar items', () => {
  const items = toCalendarItems([symptom, other], [vaccines], pets, colors);

  it('shows pet events and calendar events with their pet, title and colour', () => {
    expect(items).toEqual([
      expect.objectContaining({
        id: 'symptom',
        kind: 'pet-event',
        petName: 'Kiwi',
        title: 'Vomiting logged',
        color: 'coral',
        startsAt: symptom.occurredAt,
      }),
      expect.objectContaining({ id: 'other', petName: 'Luna', title: 'Groomer', color: 'muted' }),
      {
        id: 'vaccines',
        kind: 'calendar-event',
        petId: 'luna',
        petName: 'Luna',
        title: 'Vaccines',
        icon: 'calendar-outline',
        color: 'blue',
        startsAt: vaccines.startsAt,
        endsAt: vaccines.endsAt,
        location: 'Riverside Vet',
      },
    ]);
  });

  it('filters by kind and by pet together', () => {
    const ids = (filtered: CalendarItem[]) => filtered.map((item) => item.id);

    expect(ids(filterCalendarItems(items, { kind: 'all', petIds: ['kiwi', 'luna'] }))).toEqual([
      'symptom',
      'other',
      'vaccines',
    ]);
    expect(
      ids(filterCalendarItems(items, { kind: 'pet-events', petIds: ['kiwi', 'luna'] })),
    ).toEqual(['symptom', 'other']);
    expect(
      ids(filterCalendarItems(items, { kind: 'calendar-events', petIds: ['kiwi', 'luna'] })),
    ).toEqual(['vaccines']);
    expect(ids(filterCalendarItems(items, { kind: 'all', petIds: ['luna'] }))).toEqual([
      'other',
      'vaccines',
    ]);
    expect(ids(filterCalendarItems(items, { kind: 'pet-events', petIds: ['luna'] }))).toEqual([
      'other',
    ]);
  });

  it('groups items by local day, earliest first', () => {
    const days = groupCalendarItemsByDay(items);

    expect([...days.keys()]).toEqual(['2026-11-04', '2026-11-12']);
    expect(days.get('2026-11-04')?.map((item) => item.id)).toEqual(['other', 'symptom']);
  });
});
