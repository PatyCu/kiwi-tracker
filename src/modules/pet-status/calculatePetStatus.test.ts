import { DietChangeEvent, SymptomEvent } from '@/modules/pet-events/model/PetEvent';
import { getPetStatus, PetStatusLevel } from '@/modules/pet-status/calculatePetStatus';

const now = new Date('2026-07-31T12:00:00.000Z');

describe('pet status', () => {
  it('returns red for a symptom from the last 3 calendar days', () => {
    expect(
      getPetStatus(
        [
          symptom('Asthma', '2026-07-29T09:00:00.000Z'),
          symptom('Diarrhea', '2026-07-30T09:00:00.000Z'),
        ],
        now,
      ),
    ).toEqual({
      status: PetStatusLevel.Red,
      headline: 'Something needs your attention.',
      description: '- Diarrhea was logged 1 day ago.\n- Asthma was logged 2 days ago.',
    });
  });

  it('lists each logical timeline event only once when an event id is duplicated', () => {
    const firstLog = symptom('Vomiting', '2026-07-31T09:00:00.000Z');
    const secondLog = symptom('Vomiting', '2026-07-31T10:00:00.000Z');

    const result = getPetStatus([firstLog, secondLog, { ...firstLog }], now);

    expect(result.description.split('\n')).toHaveLength(2);
    expect(result.description).toBe('- Vomiting was logged today.\n- Vomiting was logged today.');
  });

  it('prioritizes red over a more recent amber diet change', () => {
    const result = getPetStatus(
      [symptom('Vomiting', '2026-07-28T09:00:00.000Z'), dietChange('2026-07-31T10:00:00.000Z')],
      now,
    );

    expect(result.status).toBe(PetStatusLevel.Red);
    expect(result.description).toBe('- Vomiting was logged 3 days ago.');
  });

  it('returns amber for a symptom from 4 to 7 calendar days ago', () => {
    expect(getPetStatus([symptom('Nausea', '2026-07-27T09:00:00.000Z')], now)).toEqual({
      status: PetStatusLevel.Amber,
      headline: 'Something to keep an eye on.',
      description: '- Nausea was logged 4 days ago.',
    });
  });

  it('returns amber for a diet change from the last 7 days', () => {
    expect(getPetStatus([dietChange('2026-07-28T09:00:00.000Z')], now)).toEqual({
      status: PetStatusLevel.Amber,
      headline: 'Something to keep an eye on.',
      description: '- Diet changed 3 days ago. Keep an eye out for new symptoms.',
    });
  });

  it('describes every event that triggers amber, most recent first', () => {
    expect(
      getPetStatus(
        [symptom('Hairball', '2026-07-25T09:00:00.000Z'), dietChange('2026-07-27T10:00:00.000Z')],
        now,
      ).description,
    ).toBe(
      '- Diet changed 4 days ago. Keep an eye out for new symptoms.\n- Hairball was logged 6 days ago.',
    );
  });

  it('returns green when relevant events are old, in the future, or unsupported', () => {
    const result = getPetStatus(
      [
        symptom('Hairball', '2026-07-23T09:00:00.000Z'),
        symptom('Vomiting', '2026-08-01T09:00:00.000Z'),
        otherEvent('2026-07-31T09:00:00.000Z'),
      ],
      now,
    );

    expect(result).toEqual({
      status: PetStatusLevel.Green,
      headline: 'Everything looks calm.',
      description: 'No recent symptoms or changes to review.',
    });
  });
});

function symptom(kind: SymptomEvent['symptom'], occurredAt: string): SymptomEvent {
  return {
    id: `symptom-${kind}-${occurredAt}`,
    petId: 'kiwi',
    type: 'symptom',
    symptom: kind,
    occurredAt,
    createdAt: occurredAt,
  };
}

function dietChange(occurredAt: string): DietChangeEvent {
  return {
    id: `diet-${occurredAt}`,
    petId: 'kiwi',
    type: 'diet-change',
    change: {
      type: 'add',
      item: { id: 'food-1', productName: 'New food', foodType: 'dry-food' },
    },
    occurredAt,
    createdAt: occurredAt,
  };
}

function otherEvent(occurredAt: string) {
  return {
    id: `other-${occurredAt}`,
    petId: 'kiwi',
    type: 'other' as const,
    title: 'Played with a new toy',
    occurredAt,
    createdAt: occurredAt,
  };
}
