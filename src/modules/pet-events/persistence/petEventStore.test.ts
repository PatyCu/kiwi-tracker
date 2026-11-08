import type { DietChange } from '@/modules/pet-events/model/PetEvent';
import {
  deletePetEvent,
  insertPetEvent,
  loadPetEvents,
  PetEventStorageError,
  updatePetEvent,
} from '@/modules/pet-events/persistence/petEventStore';
import { getSupabaseClient } from '@/shared/supabase/supabaseClient';

jest.mock('@/shared/supabase/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));

type Result = { data: unknown; error: unknown };

/** A query that records each call and resolves to `result`, awaited or through single(). */
function mockQuery(result: Result) {
  const query: Record<string, jest.Mock> = {
    then: jest.fn((resolve, reject) => Promise.resolve(result).then(resolve, reject)),
  };
  for (const method of ['select', 'insert', 'update', 'delete', 'eq', 'order']) {
    query[method] = jest.fn(() => query);
  }
  query.single = jest.fn(() => Promise.resolve(result));
  const from = jest.fn(() => query);
  jest
    .mocked(getSupabaseClient)
    .mockReturnValue({ from } as unknown as ReturnType<typeof getSupabaseClient>);
  return { from, query };
}

const emptyColumns = { note: null, symptom: null, title: null, diet_change: null };
const symptomRow = {
  ...emptyColumns,
  id: 'event-1',
  pet_id: 'kiwi',
  type: 'symptom',
  symptom: 'Asthma',
  note: 'Recovered quickly.',
  // How Postgres returns timestamptz values.
  occurred_at: '2026-07-16T09:30:00+00:00',
  created_at: '2026-07-16T09:31:00.123456+00:00',
};
const dietChange = {
  type: 'add',
  item: { id: 'item-1', productName: 'Dental chew', foodType: 'snack' },
};

describe('pet event storage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('loads symptom, diet-change and other events with ISO timestamps, newest first', async () => {
    const { from, query } = mockQuery({
      data: [
        symptomRow,
        {
          ...emptyColumns,
          id: 'event-2',
          pet_id: 'kiwi',
          type: 'diet-change',
          diet_change: dietChange,
          occurred_at: '2026-07-15T09:30:00+00:00',
          created_at: '2026-07-15T09:31:00+00:00',
        },
        {
          ...emptyColumns,
          id: 'event-3',
          pet_id: 'kiwi',
          type: 'other',
          title: 'Started sleeping upstairs',
          occurred_at: '2026-07-14T09:30:00+00:00',
          created_at: '2026-07-14T09:31:00+00:00',
        },
      ],
      error: null,
    });

    await expect(loadPetEvents()).resolves.toEqual([
      {
        id: 'event-1',
        petId: 'kiwi',
        type: 'symptom',
        symptom: 'Asthma',
        note: 'Recovered quickly.',
        occurredAt: '2026-07-16T09:30:00.000Z',
        createdAt: '2026-07-16T09:31:00.123Z',
      },
      {
        id: 'event-2',
        petId: 'kiwi',
        type: 'diet-change',
        change: dietChange,
        occurredAt: '2026-07-15T09:30:00.000Z',
        createdAt: '2026-07-15T09:31:00.000Z',
      },
      {
        id: 'event-3',
        petId: 'kiwi',
        type: 'other',
        title: 'Started sleeping upstairs',
        occurredAt: '2026-07-14T09:30:00.000Z',
        createdAt: '2026-07-14T09:31:00.000Z',
      },
    ]);
    expect(from).toHaveBeenCalledWith('pet_events');
    expect(query.order).toHaveBeenCalledWith('occurred_at', { ascending: false });
  });

  it('reports a malformed row instead of showing it', async () => {
    mockQuery({ data: [{ ...symptomRow, diet_change: null, type: 'diet-change' }], error: null });

    await expect(loadPetEvents()).rejects.toMatchObject<Partial<PetEventStorageError>>({
      name: 'PetEventStorageError',
      code: 'INVALID_DATA',
    });
  });

  it('distinguishes read and write failures', async () => {
    mockQuery({ data: null, error: { message: 'offline' } });

    await expect(loadPetEvents()).rejects.toMatchObject({ code: 'READ_FAILED' });
    await expect(deletePetEvent('event-1')).rejects.toMatchObject({ code: 'WRITE_FAILED' });
  });

  it('logs one event and lets storage set its id and createdAt', async () => {
    const { query } = mockQuery({ data: symptomRow, error: null });

    await expect(
      insertPetEvent({
        petId: 'kiwi',
        type: 'symptom',
        symptom: 'Asthma',
        note: 'Recovered quickly.',
        occurredAt: '2026-07-16T09:30:00.000Z',
      }),
    ).resolves.toMatchObject({ id: 'event-1', createdAt: '2026-07-16T09:31:00.123Z' });
    expect(query.insert).toHaveBeenCalledWith({
      ...emptyColumns,
      pet_id: 'kiwi',
      type: 'symptom',
      symptom: 'Asthma',
      note: 'Recovered quickly.',
      occurred_at: '2026-07-16T09:30:00.000Z',
    });
  });

  it('does not write an invalid event', async () => {
    const { from } = mockQuery({ data: null, error: null });

    await expect(
      insertPetEvent({
        petId: '',
        type: 'symptom',
        symptom: 'Asthma',
        occurredAt: '2026-07-16T09:30:00.000Z',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_DATA' });
    expect(from).not.toHaveBeenCalled();
  });

  it('updates one event by id, writing only the fields a person can correct', async () => {
    const { query } = mockQuery({ data: { ...symptomRow, note: null }, error: null });

    await expect(
      updatePetEvent({
        id: 'event-1',
        petId: 'kiwi',
        type: 'symptom',
        symptom: 'Asthma',
        occurredAt: '2026-07-16T09:30:00.000Z',
        createdAt: '2026-07-16T09:31:00.123Z',
      }),
    ).resolves.not.toHaveProperty('note');
    expect(query.eq).toHaveBeenCalledWith('id', 'event-1');
    const [columns] = query.update.mock.calls[0];
    expect(Object.keys(columns).sort()).toEqual(['note', 'occurred_at', 'symptom']);
    expect(columns).toEqual({
      occurred_at: '2026-07-16T09:30:00.000Z',
      note: null,
      symptom: 'Asthma',
    });
  });

  it.each([
    {
      event: { type: 'other' as const, title: 'Started sleeping upstairs' },
      columns: { title: 'Started sleeping upstairs' },
    },
    {
      event: { type: 'diet-change' as const, change: dietChange as DietChange },
      columns: { diet_change: dietChange },
    },
  ])(
    'never writes the id, pet, type or createdAt of a $event.type event',
    async ({ event, columns }) => {
      const { query } = mockQuery({ data: null, error: { message: 'stop after the write' } });

      await expect(
        updatePetEvent({
          id: 'event-2',
          petId: 'kiwi',
          note: 'Corrected.',
          occurredAt: '2026-07-15T09:30:00.000Z',
          createdAt: '2026-07-15T09:31:00.000Z',
          ...event,
        }),
      ).rejects.toMatchObject({ code: 'WRITE_FAILED' });
      expect(query.update).toHaveBeenCalledWith({
        occurred_at: '2026-07-15T09:30:00.000Z',
        note: 'Corrected.',
        ...columns,
      });
      const [written] = query.update.mock.calls[0];
      for (const fixed of ['id', 'pet_id', 'type', 'created_at']) {
        expect(written).not.toHaveProperty(fixed);
      }
    },
  );

  it('deletes one event by id', async () => {
    const { query } = mockQuery({ data: null, error: null });

    await deletePetEvent('event-1');
    expect(query.delete).toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith('id', 'event-1');
  });
});
