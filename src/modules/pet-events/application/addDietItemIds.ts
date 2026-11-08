import { DietChange, DietChangeInput } from '@/modules/pet-events/model/PetEvent';

/**
 * Gives each newly introduced diet item an id. The id lives inside the event's
 * diet change and lets later events (a switch or a stop) refer to the item.
 */
export function addDietItemIds(input: DietChangeInput, now: Date): DietChange {
  if (input.type === 'replace') {
    return {
      type: 'replace',
      previousItem: input.previousItem,
      nextItem: { ...input.nextItem, id: createDietItemId(now) },
    };
  }
  if (input.type === 'add') {
    return { type: 'add', item: { ...input.item, id: createDietItemId(now) } };
  }
  return { type: 'remove', item: input.item };
}

function createDietItemId(now: Date): string {
  return `diet-item-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
}
