import { toUpcomingCareItems } from '@/modules/calendar/upcomingCare';
import { CalendarEvent } from '@/modules/calendar-events/model/CalendarEvent';
import { Pet } from '@/modules/pets/model/Pet';

const pets: Pet[] = [
  { id: 'kiwi', name: 'Kiwi', species: 'Cat' },
  { id: 'luna', name: 'Luna', species: 'Dog' },
];
/** Local time on a day of November 2026. */
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 10, day, hour, minute).toISOString();
const now = new Date(2026, 10, 14, 9, 30);

function event(id: string, petId: string, startsAt: string, endsAt: string): CalendarEvent {
  return { id, petId, title: id, startsAt, endsAt, createdAt: at(1, 10) };
}

describe('toUpcomingCareItems', () => {
  it('lists events from now through the 7th day, today included, soonest first', () => {
    const events = [
      event('last-day', 'luna', at(20, 23), at(20, 23, 30)),
      event('later-today', 'kiwi', at(14, 18), at(14, 19)),
      event('tomorrow', 'luna', at(15, 10), at(15, 11)),
      event('day-after-window', 'kiwi', at(21, 0), at(21, 1)),
    ];

    const items = toUpcomingCareItems(events, pets, 'blue', now);

    expect(items.map((item) => item.id)).toEqual(['later-today', 'tomorrow', 'last-day']);
    expect(items[1]).toMatchObject({
      kind: 'calendar-event',
      petName: 'Luna',
      title: 'tomorrow',
      color: 'blue',
      startsAt: at(15, 10),
      endsAt: at(15, 11),
    });
  });

  it('keeps an event under way and leaves out ones that have ended', () => {
    const events = [
      event('ended', 'kiwi', at(14, 8), at(14, 9)),
      event('ends-now', 'kiwi', at(14, 9), at(14, 9, 30)),
      event('under-way', 'kiwi', at(14, 9), at(14, 10)),
    ];

    expect(toUpcomingCareItems(events, pets, 'blue', now).map((item) => item.id)).toEqual([
      'under-way',
    ]);
  });

  it("lists only one pet's events when asked", () => {
    const events = [
      event('kiwi-vet', 'kiwi', at(16, 10), at(16, 11)),
      event('luna-vaccines', 'luna', at(15, 10), at(15, 11)),
    ];

    expect(toUpcomingCareItems(events, pets, 'blue', now, 'kiwi').map((item) => item.id)).toEqual([
      'kiwi-vet',
    ]);
  });

  it('names a pet that is no longer listed as unknown', () => {
    const items = toUpcomingCareItems(
      [event('vet', 'gone', at(15, 10), at(15, 11))],
      pets,
      'blue',
      now,
    );

    expect(items[0].petName).toBe('Unknown pet');
  });
});
