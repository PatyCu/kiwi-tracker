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
    const result = buildTodayViewModel(pets, events, now, null);

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
    const result = buildTodayViewModel(shown, events, now, 'The Burrow');

    expect(result.statusSummary.kicker).toBe('Today in The Burrow');
  });

  it('includes every pet in insights and orders alerts before all-clear pets', () => {
    const allPets: Pet[] = [{ id: 'milo', name: 'Milo', species: 'Cat' }, ...pets];

    const result = buildTodayViewModel(allPets, events, now, null);

    expect(result.insights.map(({ pet, status }) => [pet.id, status.status])).toEqual([
      ['luna', PetStatusLevel.Red],
      ['kiwi', PetStatusLevel.Amber],
      ['milo', PetStatusLevel.Green],
    ]);
  });
});
