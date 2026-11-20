import { CalendarEvent } from '@/modules/calendar-events/model/CalendarEvent';
import { PetEvent } from '@/modules/pet-events/model/PetEvent';
import { Pet } from '@/modules/pets/model/Pet';
import { PetStatusLevel } from '@/modules/pet-status/calculatePetStatus';
import { buildTodayViewModel } from '@/modules/today/buildTodayViewModel';

const now = new Date('2026-08-01T12:00:00.000Z');
const pets: Pet[] = [
  { id: 'kiwi', name: 'Kiwi', species: 'Cat' },
  { id: 'luna', name: 'Luna', species: 'Dog' },
];
const events: PetEvent[] = [
  {
    id: 'diet-change-1',
    petId: 'kiwi',
    type: 'diet-change',
    change: {
      type: 'add',
      item: { id: 'food-1', productName: 'Sensitive food', foodType: 'dry-food' },
    },
    occurredAt: now.toISOString(),
    createdAt: now.toISOString(),
  },
  {
    id: 'symptom-1',
    petId: 'luna',
    type: 'symptom',
    symptom: 'Diarrhea',
    occurredAt: now.toISOString(),
    createdAt: now.toISOString(),
  },
];

describe('buildTodayViewModel', () => {
  it('builds one aggregate semaphore summary using the highest pet status', () => {
    const result = buildTodayViewModel(pets, events, [], now, null, 'blue');

    expect(result.statusSummary).toMatchObject({
      indicatorLabel: 'Pets',
      kicker: 'Today with Kiwi and Luna',
    });
    expect(result.statusSummary.status).toMatchObject({
      status: PetStatusLevel.Red,
      headline: 'Something needs your attention.',
      description: '- Luna: Diarrhea was logged today.',
    });
  });

  it.each([
    ['several pets', pets],
    ['one pet', pets.slice(0, 1)],
  ])('names the household instead of the pets when it has an alias, with %s', (_label, shown) => {
    const result = buildTodayViewModel(shown, events, [], now, 'The Burrow', 'blue');

    expect(result.statusSummary.kicker).toBe('Today in The Burrow');
  });

  it('includes every pet in insights and orders alerts before all-clear pets', () => {
    const allPets: Pet[] = [{ id: 'milo', name: 'Milo', species: 'Cat' }, ...pets];

    const result = buildTodayViewModel(allPets, events, [], now, null, 'blue');

    expect(result.insights.map(({ pet, status }) => [pet.id, status.status])).toEqual([
      ['luna', PetStatusLevel.Red],
      ['kiwi', PetStatusLevel.Amber],
      ['milo', PetStatusLevel.Green],
    ]);
  });

  it("lists the household's calendar events of the next 7 days, soonest first", () => {
    const calendarEvent = (id: string, petId: string, startsAt: string): CalendarEvent => ({
      id,
      petId,
      title: id,
      startsAt,
      endsAt: new Date(Date.parse(startsAt) + 60 * 60 * 1000).toISOString(),
      createdAt: now.toISOString(),
    });

    const result = buildTodayViewModel(
      pets,
      events,
      [
        calendarEvent('vaccines', 'luna', '2026-08-03T09:00:00.000Z'),
        calendarEvent('last-week', 'kiwi', '2026-07-20T09:00:00.000Z'),
        calendarEvent('vet', 'kiwi', '2026-08-02T09:00:00.000Z'),
      ],
      now,
      null,
      'blue',
    );

    expect(result.upcomingCare.map(({ id, petName }) => [id, petName])).toEqual([
      ['vet', 'Kiwi'],
      ['vaccines', 'Luna'],
    ]);
  });
});
