import { applyPetEventEdit } from '@/modules/pet-events/application/applyPetEventEdit';
import { getCurrentDiet } from '@/modules/pet-events/model/getCurrentDiet';
import { PetEvent } from '@/modules/pet-events/model/PetEvent';

const createdAt = '2026-07-01T08:00:00.000Z';
const kibble = { id: 'item-1', productName: 'Royal Kanin', foodType: 'dry-food' as const };

const events: PetEvent[] = [
  {
    id: 'symptom-1',
    petId: 'kiwi',
    type: 'symptom',
    symptom: 'Vomiting',
    note: 'After breakfast.',
    occurredAt: '2026-07-02T08:00:00.000Z',
    createdAt,
  },
  {
    id: 'other-1',
    petId: 'kiwi',
    type: 'other',
    title: 'Moved house',
    occurredAt: '2026-07-03T08:00:00.000Z',
    createdAt,
  },
  {
    id: 'diet-add',
    petId: 'kiwi',
    type: 'diet-change',
    change: { type: 'add', item: kibble },
    occurredAt: '2026-07-04T08:00:00.000Z',
    createdAt,
  },
  {
    id: 'diet-remove',
    petId: 'kiwi',
    type: 'diet-change',
    change: { type: 'remove', item: kibble },
    occurredAt: '2026-07-10T08:00:00.000Z',
    createdAt,
  },
];

describe('applyPetEventEdit', () => {
  it('corrects a symptom, its note and when it happened', () => {
    const next = applyPetEventEdit(events, 'symptom-1', {
      type: 'symptom',
      symptom: 'Hairball',
      note: ' Before breakfast. ',
      occurredAt: '2026-07-02T07:00:00.000Z',
    });

    expect(next[0]).toEqual({
      ...events[0],
      symptom: 'Hairball',
      note: 'Before breakfast.',
      occurredAt: '2026-07-02T07:00:00.000Z',
    });
    expect(next.slice(1)).toEqual(events.slice(1));
  });

  it('removes a note that was cleared', () => {
    const next = applyPetEventEdit(events, 'symptom-1', {
      type: 'symptom',
      symptom: 'Vomiting',
      note: '  ',
      occurredAt: events[0].occurredAt,
    });

    expect(next[0]).not.toHaveProperty('note');
  });

  it('trims the title of another event and rejects an empty one', () => {
    const edit = { type: 'other' as const, note: '', occurredAt: events[1].occurredAt };

    expect(applyPetEventEdit(events, 'other-1', { ...edit, title: ' Moved flat ' })[1]).toEqual(
      expect.objectContaining({ title: 'Moved flat' }),
    );
    expect(() => applyPetEventEdit(events, 'other-1', { ...edit, title: ' ' })).toThrow();
  });

  it('corrects a diet item everywhere it appears for that pet', () => {
    const next = applyPetEventEdit(events, 'diet-add', {
      type: 'diet-change',
      item: { productName: ' Royal Canin ', foodType: 'wet-food' },
      note: '',
      occurredAt: events[2].occurredAt,
    });
    const corrected = { id: 'item-1', productName: 'Royal Canin', foodType: 'wet-food' };

    expect(next[2]).toMatchObject({ change: { type: 'add', item: corrected } });
    expect(next[3]).toMatchObject({ change: { type: 'remove', item: corrected } });
    expect(getCurrentDiet(next, 'kiwi', new Date('2026-07-05T00:00:00.000Z'))).toEqual([corrected]);
  });

  it('returns the events it did not change as the same objects', () => {
    const next = applyPetEventEdit(events, 'diet-add', {
      type: 'diet-change',
      item: { productName: 'Royal Canin', foodType: 'dry-food' },
      note: '',
      occurredAt: events[2].occurredAt,
    });

    expect(next[0]).toBe(events[0]);
    expect(next[1]).toBe(events[1]);
    expect(next[2]).not.toBe(events[2]);
    expect(next[3]).not.toBe(events[3]);
  });

  it('keeps the stopped item fixed when editing a removal', () => {
    const next = applyPetEventEdit(events, 'diet-remove', {
      type: 'diet-change',
      item: { productName: 'Something else', foodType: 'snack' },
      note: 'Vet said to stop.',
      occurredAt: events[3].occurredAt,
    });

    expect(next[3]).toMatchObject({ change: { type: 'remove', item: kibble } });
    expect(next[3].note).toBe('Vet said to stop.');
  });

  it('rejects a missing event or an edit for another event type', () => {
    const edit = { type: 'other' as const, title: 'X', note: '', occurredAt: createdAt };

    expect(() => applyPetEventEdit(events, 'missing', edit)).toThrow('Pet event not found.');
    expect(() => applyPetEventEdit(events, 'symptom-1', edit)).toThrow();
  });
});
