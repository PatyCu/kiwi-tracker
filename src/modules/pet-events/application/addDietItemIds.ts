import { DietChange, DietChangeInput } from '@/modules/pet-events/model/PetEvent';
import { createPetEventId } from '@/modules/pet-events/application/createPetEventId';

export function addDietItemIds(input: DietChangeInput, now: Date): DietChange {
  if (input.type === 'replace') {
    return {
      type: 'replace',
      previousItem: input.previousItem,
      nextItem: { ...input.nextItem, id: createPetEventId('diet-item', now) },
    };
  }
  if (input.type === 'add') {
    return { type: 'add', item: { ...input.item, id: createPetEventId('diet-item', now) } };
  }
  return { type: 'remove', item: input.item };
}
