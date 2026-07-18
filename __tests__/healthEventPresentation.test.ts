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

  it('orders timeline entries from newest to oldest by occurrence time', () => {
    const entries = toTimelineEntries(
      [
        {
          id: 'newest-event',
          petId: 'kiwi',
          kind: 'Asthma',
          note: 'Newest observation.',
          occurredAt: '2026-07-18T11:00:00.000Z',
        },
        {
          id: 'oldest-event',
          petId: 'kiwi',
          kind: 'Vomiting',
          note: 'Backdated observation.',
          occurredAt: '2026-07-15T08:00:00.000Z',
        },
        {
          id: 'middle-event',
          petId: 'kiwi',
          kind: 'Hairball',
          note: 'Middle observation.',
          occurredAt: '2026-07-17T09:30:00.000Z',
        },
      ],
      'kiwi',
      '#f00',
    );

    expect(entries.map((entry) => entry.id)).toEqual([
      'newest-event',
      'middle-event',
      'oldest-event',
    ]);
  });
});
