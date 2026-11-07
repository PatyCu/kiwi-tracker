import {
  DietChange,
  DietItemInput,
  DietItemSnapshot,
  PetEvent,
  PetEventEdit,
} from '@/modules/pet-events/model/PetEvent';

/**
 * Returns the event list with one event corrected. Throws when the event is missing or the
 * edit doesn't fit it, so callers never persist a half-applied change.
 *
 * Correcting a diet item's name or food type also updates every other snapshot of that item
 * for the same pet (for example a later "Stopped" event), so the timeline stays consistent.
 */
export function applyPetEventEdit(
  events: readonly PetEvent[],
  eventId: string,
  edit: PetEventEdit,
): PetEvent[] {
  const target = events.find((event) => event.id === eventId);
  if (!target) throw new Error('Pet event not found.');
  if (target.type !== edit.type) throw new Error('The edit does not match the event type.');

  const updated = editEvent(target, edit);
  const correctedItem = updated.type === 'diet-change' ? getIntroducedItem(updated.change) : null;

  return events.map((event) => {
    if (event.id === eventId) return updated;
    if (correctedItem && event.petId === target.petId && event.type === 'diet-change') {
      return { ...event, change: renameDietItem(event.change, correctedItem) };
    }
    return event;
  });
}

function editEvent(event: PetEvent, edit: PetEventEdit): PetEvent {
  const base = { ...event, occurredAt: edit.occurredAt };
  const note = edit.note.trim();
  if (note) base.note = note;
  else delete base.note;

  if (base.type === 'symptom' && edit.type === 'symptom') {
    return { ...base, symptom: edit.symptom };
  }
  if (base.type === 'other' && edit.type === 'other') {
    const title = edit.title.trim();
    if (!title) throw new Error('Other events require a title.');
    return { ...base, title };
  }
  if (base.type === 'diet-change' && edit.type === 'diet-change') {
    return { ...base, change: editDietChange(base.change, edit.item) };
  }
  throw new Error('The edit does not match the event type.');
}

function editDietChange(change: DietChange, item: DietItemInput | undefined): DietChange {
  if (!item || change.type === 'remove') return change;
  const productName = item.productName.trim();
  if (!productName) throw new Error('Diet items require a product name.');
  const corrected = { productName, foodType: item.foodType };
  if (change.type === 'replace') {
    return { ...change, nextItem: { ...change.nextItem, ...corrected } };
  }
  return { ...change, item: { ...change.item, ...corrected } };
}

function getIntroducedItem(change: DietChange): DietItemSnapshot | null {
  if (change.type === 'replace') return change.nextItem;
  if (change.type === 'add') return change.item;
  return null;
}

function renameDietItem(change: DietChange, corrected: DietItemSnapshot): DietChange {
  const fix = (item: DietItemSnapshot) => (item.id === corrected.id ? corrected : item);
  if (change.type === 'replace') {
    return { ...change, previousItem: fix(change.previousItem), nextItem: fix(change.nextItem) };
  }
  return { ...change, item: fix(change.item) };
}
