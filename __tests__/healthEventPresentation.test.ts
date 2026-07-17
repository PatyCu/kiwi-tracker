import { toTimelineEntries } from '@/lib/healthEventPresentation';

describe('health event presentation', () => {
  it('maps only the active pet events to timeline entries', () => {
    const entries = toTimelineEntries(
      [
        {
          id: 'kiwi-event',
          petId: 'kiwi',
          kind: 'Asthma',
          note: 'Recovered quickly.',
          occurredAt: new Date().toISOString(),
        },
        {
          id: 'miso-event',
          petId: 'miso',
          kind: 'Vomiting',
          note: 'After dinner.',
          occurredAt: new Date().toISOString(),
        },
      ],
      'kiwi',
      '#f00',
    );

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      id: 'kiwi-event',
      title: 'Asthma logged',
      note: 'Recovered quickly.',
      color: '#f00',
    });
  });
});
