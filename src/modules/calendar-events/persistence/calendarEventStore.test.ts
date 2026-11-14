import {
  CalendarEventStorageError,
  insertCalendarEvent,
  loadCalendarEvents,
} from '@/modules/calendar-events/persistence/calendarEventStore';
import { getSupabaseClient } from '@/shared/supabase/supabaseClient';

jest.mock('@/shared/supabase/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));

type Result = { data: unknown; error: unknown };

function mockInsert(result: Result) {
  const query: Record<string, jest.Mock> = {};
  query.insert = jest.fn(() => query);
  query.select = jest.fn(() => query);
  query.single = jest.fn(() => Promise.resolve(result));
  const from = jest.fn(() => query);
  jest
    .mocked(getSupabaseClient)
    .mockReturnValue({ from } as unknown as ReturnType<typeof getSupabaseClient>);
  return { from, query };
}

function mockLoad(result: Result) {
  const query: Record<string, jest.Mock> = {};
  query.select = jest.fn(() => query);
  let orders = 0;
  query.order = jest.fn(() => {
    orders += 1;
    return orders === 2 ? Promise.resolve(result) : query;
  });
  const from = jest.fn(() => query);
  jest
    .mocked(getSupabaseClient)
    .mockReturnValue({ from } as unknown as ReturnType<typeof getSupabaseClient>);
  return { from, query };
}

const newEvent = {
  petId: 'kiwi',
  title: 'Annual vaccines',
  startsAt: '2026-11-15T09:00:00.000Z',
  endsAt: '2026-11-15T10:00:00.000Z',
};
const savedRow = {
  id: 'calendar-1',
  pet_id: 'kiwi',
  title: 'Annual vaccines',
  // How Postgres returns timestamptz values.
  starts_at: '2026-11-15T09:00:00+00:00',
  ends_at: '2026-11-15T10:00:00+00:00',
  location: null,
  description: null,
  created_at: '2026-11-12T18:31:00.123456+00:00',
};

describe('calendar event storage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('saves an event and returns it with ISO timestamps and without empty fields', async () => {
    const { from, query } = mockInsert({ data: savedRow, error: null });

    await expect(insertCalendarEvent(newEvent)).resolves.toEqual({
      ...newEvent,
      id: 'calendar-1',
      createdAt: '2026-11-12T18:31:00.123Z',
    });
    expect(from).toHaveBeenCalledWith('calendar_events');
    expect(query.insert).toHaveBeenCalledWith({
      pet_id: 'kiwi',
      title: 'Annual vaccines',
      starts_at: newEvent.startsAt,
      ends_at: newEvent.endsAt,
      location: null,
      description: null,
    });
  });

  it('saves the location and description when given', async () => {
    const { query } = mockInsert({
      data: { ...savedRow, location: 'Riverside Vet', description: 'Bring the card.' },
      error: null,
    });

    await expect(
      insertCalendarEvent({
        ...newEvent,
        location: 'Riverside Vet',
        description: 'Bring the card.',
      }),
    ).resolves.toMatchObject({ location: 'Riverside Vet', description: 'Bring the card.' });
    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({ location: 'Riverside Vet', description: 'Bring the card.' }),
    );
  });

  it.each([
    ['a blank title', { ...newEvent, title: '  ' }],
    ['an end before the start', { ...newEvent, endsAt: '2026-11-15T08:00:00.000Z' }],
    ['an end equal to the start', { ...newEvent, endsAt: newEvent.startsAt }],
  ])('rejects %s without calling storage', async (_case, event) => {
    const { from } = mockInsert({ data: savedRow, error: null });

    await expect(insertCalendarEvent(event)).rejects.toMatchObject({ code: 'INVALID_DATA' });
    expect(from).not.toHaveBeenCalled();
  });

  it('reports a failed write', async () => {
    mockInsert({ data: null, error: { message: 'offline' } });

    const failure = insertCalendarEvent(newEvent);
    await expect(failure).rejects.toBeInstanceOf(CalendarEventStorageError);
    await expect(failure).rejects.toMatchObject({ code: 'WRITE_FAILED' });
  });

  it("loads the household's events in date order with ISO timestamps", async () => {
    const { from, query } = mockLoad({
      data: [savedRow, { ...savedRow, id: 'calendar-2', location: 'Riverside Vet' }],
      error: null,
    });

    await expect(loadCalendarEvents()).resolves.toEqual([
      { ...newEvent, id: 'calendar-1', createdAt: '2026-11-12T18:31:00.123Z' },
      {
        ...newEvent,
        id: 'calendar-2',
        location: 'Riverside Vet',
        createdAt: '2026-11-12T18:31:00.123Z',
      },
    ]);
    expect(from).toHaveBeenCalledWith('calendar_events');
    expect(query.order).toHaveBeenNthCalledWith(1, 'starts_at', { ascending: true });
  });

  it('reports a failed read', async () => {
    mockLoad({ data: null, error: { message: 'offline' } });

    await expect(loadCalendarEvents()).rejects.toMatchObject({ code: 'READ_FAILED' });
  });

  it('rejects a stored event with an invalid format', async () => {
    mockLoad({ data: [{ ...savedRow, title: '' }], error: null });

    await expect(loadCalendarEvents()).rejects.toMatchObject({ code: 'INVALID_DATA' });
  });
});
