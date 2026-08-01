import { DietChangeEvent, DietItemSnapshot, PetEvent } from '@/modules/pet-events/model/PetEvent';

export function getCurrentDiet(
  events: PetEvent[],
  petId: string,
  asOf = new Date(),
): DietItemSnapshot[] {
  const diet = new Map<string, DietItemSnapshot>();

  events
    .filter(
      (event): event is DietChangeEvent =>
        event.petId === petId &&
        event.type === 'diet-change' &&
        Date.parse(event.occurredAt) <= asOf.getTime(),
    )
    .sort(comparePetEvents)
    .forEach((event) => {
      if (event.change.type === 'replace') {
        diet.delete(event.change.previousItem.id);
        diet.set(event.change.nextItem.id, event.change.nextItem);
        return;
      }

      if (event.change.type === 'add') {
        diet.set(event.change.item.id, event.change.item);
        return;
      }

      diet.delete(event.change.item.id);
    });

  return Array.from(diet.values());
}

function comparePetEvents(left: PetEvent, right: PetEvent): number {
  return (
    Date.parse(left.occurredAt) - Date.parse(right.occurredAt) ||
    Date.parse(left.recordedAt) - Date.parse(right.recordedAt) ||
    left.id.localeCompare(right.id)
  );
}
