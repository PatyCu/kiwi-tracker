import { PetEvent } from '@/modules/pet-events/model/PetEvent';
import { getCurrentDiet } from '@/modules/pet-events/model/getCurrentDiet';

const recordedAt = '2026-07-18T12:00:00.000Z';

describe('current diet projection', () => {
  it('replays additions, replacements, and removals in occurrence order', () => {
    const firstFood = { id: 'food-1', productName: 'First food', foodType: 'dry-food' as const };
    const secondFood = { id: 'food-2', productName: 'Second food', foodType: 'wet-food' as const };
    const snack = { id: 'snack-1', productName: 'Dental chew', foodType: 'snack' as const };
    const events: PetEvent[] = [
      dietEvent('remove-snack', '2026-07-18T08:00:00.000Z', {
        type: 'remove',
        item: snack,
      }),
      dietEvent('add-food', '2026-07-15T08:00:00.000Z', { type: 'add', item: firstFood }),
      dietEvent('add-snack', '2026-07-16T08:00:00.000Z', { type: 'add', item: snack }),
      dietEvent('replace-food', '2026-07-17T08:00:00.000Z', {
        type: 'replace',
        previousItem: firstFood,
        nextItem: secondFood,
      }),
    ];

    expect(getCurrentDiet(events, 'kiwi')).toEqual([secondFood]);
  });

  it('keeps each pet diet independent', () => {
    const kiwiItem = { id: 'kiwi-food', productName: 'Kiwi food', foodType: 'dry-food' as const };
    const misoItem = { id: 'miso-food', productName: 'Miso food', foodType: 'wet-food' as const };
    const events: PetEvent[] = [
      dietEvent('kiwi-event', '2026-07-15T08:00:00.000Z', { type: 'add', item: kiwiItem }),
      {
        ...dietEvent('miso-event', '2026-07-15T09:00:00.000Z', { type: 'add', item: misoItem }),
        petId: 'miso',
      },
    ];

    expect(getCurrentDiet(events, 'kiwi')).toEqual([kiwiItem]);
  });

  it('does not apply a scheduled change before its effective time', () => {
    const item = {
      id: 'future-food',
      productName: 'Future food',
      foodType: 'dry-food' as const,
    };
    const events: PetEvent[] = [
      dietEvent('future-event', '2026-07-20T08:00:00.000Z', { type: 'add', item }),
    ];

    expect(getCurrentDiet(events, 'kiwi', new Date('2026-07-19T08:00:00.000Z'))).toEqual([]);
    expect(getCurrentDiet(events, 'kiwi', new Date('2026-07-20T08:00:00.000Z'))).toEqual([item]);
  });
});

function dietEvent(
  id: string,
  occurredAt: string,
  change: Extract<PetEvent, { type: 'diet-change' }>['change'],
): PetEvent {
  return {
    id,
    petId: 'kiwi',
    type: 'diet-change',
    change,
    occurredAt,
    recordedAt,
  };
}
