import { toTimelineEntries } from '@/lib/timelineEventPresentation';
import { TimelineEvent } from '@/lib/timelineEvents';

const recordedAt = '2026-07-18T12:00:00.000Z';

describe('timeline event presentation', () => {
  it('maps symptom and diet events for only the active pet', () => {
    const events: TimelineEvent[] = [
      {
        id: 'kiwi-symptom',
        petId: 'kiwi',
        type: 'symptom',
        symptom: 'Asthma',
        note: 'Recovered quickly.',
        occurredAt: '2026-07-18T11:00:00.000Z',
        recordedAt,
      },
      {
        id: 'kiwi-diet',
        petId: 'kiwi',
        type: 'diet-change',
        change: {
          type: 'replace',
          previousItem: {
            id: 'old-food',
            productName: 'Previous Old food',
            foodType: 'dry-food',
          },
          nextItem: {
            id: 'new-food',
            productName: "Hill's Digestive Care",
            foodType: 'dry-food',
          },
        },
        occurredAt: '2026-07-17T09:30:00.000Z',
        recordedAt,
      },
      {
        id: 'miso-symptom',
        petId: 'miso',
        type: 'symptom',
        symptom: 'Vomiting',
        occurredAt: '2026-07-18T10:00:00.000Z',
        recordedAt,
      },
    ];

    const entries = toTimelineEntries(events, 'kiwi', '#f00', '#0f0');

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      id: 'kiwi-symptom',
      title: 'Asthma logged',
      note: 'Recovered quickly.',
      color: '#f00',
    });
    expect(entries[1]).toMatchObject({
      id: 'kiwi-diet',
      title: "Switched to Hill's Digestive Care",
      note: 'Replaced Previous Old food.',
      color: '#0f0',
    });
  });

  it('orders timeline entries from newest to oldest by occurrence time', () => {
    const events: TimelineEvent[] = [
      symptomEvent('newest-event', '2026-07-18T11:00:00.000Z'),
      symptomEvent('oldest-event', '2026-07-15T08:00:00.000Z'),
      symptomEvent('middle-event', '2026-07-17T09:30:00.000Z'),
    ];

    const entries = toTimelineEntries(events, 'kiwi', '#f00', '#0f0');

    expect(entries.map((entry) => entry.id)).toEqual([
      'newest-event',
      'middle-event',
      'oldest-event',
    ]);
  });
});

function symptomEvent(id: string, occurredAt: string): TimelineEvent {
  return {
    id,
    petId: 'kiwi',
    type: 'symptom',
    symptom: 'Asthma',
    occurredAt,
    recordedAt,
  };
}
