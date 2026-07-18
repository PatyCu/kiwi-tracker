import { DietChangeEvent, DietItemSnapshot, TimelineEvent } from '@/lib/timelineEvents';

export function getCurrentDiet(
  events: TimelineEvent[],
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
    .sort(compareTimelineEvents)
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

function compareTimelineEvents(left: TimelineEvent, right: TimelineEvent): number {
  return (
    Date.parse(left.occurredAt) - Date.parse(right.occurredAt) ||
    Date.parse(left.recordedAt) - Date.parse(right.recordedAt) ||
    left.id.localeCompare(right.id)
  );
}
