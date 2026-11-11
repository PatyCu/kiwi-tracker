import {
  insertPet,
  loadPets,
  PetStorageError,
  setPetPhotoPath,
  updatePet,
} from '@/modules/pets/persistence/petStore';
import { getSupabaseClient } from '@/shared/supabase/supabaseClient';

jest.mock('@/shared/supabase/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));

type Result = { data: unknown; error: unknown };

/** A query that records each call and resolves to `result`, awaited or through single(). */
function mockQuery(result: Result) {
  const query: Record<string, jest.Mock> = {
    then: jest.fn((resolve, reject) => Promise.resolve(result).then(resolve, reject)),
  };
  for (const method of ['select', 'insert', 'update', 'eq', 'order']) {
    query[method] = jest.fn(() => query);
  }
  query.single = jest.fn(() => Promise.resolve(result));
  const from = jest.fn(() => query);
  jest
    .mocked(getSupabaseClient)
    .mockReturnValue({ from } as unknown as ReturnType<typeof getSupabaseClient>);
  return { from, query };
}

const kiwiRow = {
  id: 'kiwi-id',
  name: 'Kiwi',
  species: 'Cat',
  breed: 'European Shorthair',
  birth_date: '2021-04-12',
  photo_path: 'kiwi-id/photo',
};

describe('pet storage', () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads the household's pets by name", async () => {
    const { from, query } = mockQuery({
      data: [
        kiwiRow,
        {
          id: 'murri-id',
          name: 'Murri',
          species: 'Cat',
          breed: null,
          birth_date: null,
          photo_path: null,
        },
      ],
      error: null,
    });

    await expect(loadPets()).resolves.toEqual([
      {
        id: 'kiwi-id',
        name: 'Kiwi',
        species: 'Cat',
        breed: 'European Shorthair',
        birthDate: '2021-04-12',
        photoPath: 'kiwi-id/photo',
      },
      { id: 'murri-id', name: 'Murri', species: 'Cat' },
    ]);
    expect(from).toHaveBeenCalledWith('pets');
    expect(query.order).toHaveBeenCalledWith('name');
  });

  it('reports an unknown species instead of guessing', async () => {
    mockQuery({ data: [{ ...kiwiRow, species: 'Ferret' }], error: null });

    await expect(loadPets()).rejects.toMatchObject<Partial<PetStorageError>>({
      name: 'PetStorageError',
      code: 'INVALID_DATA',
    });
  });

  it('wraps a failed load in a typed error', async () => {
    mockQuery({ data: null, error: { message: 'offline' } });

    await expect(loadPets()).rejects.toMatchObject<Partial<PetStorageError>>({
      code: 'READ_FAILED',
    });
  });

  it('adds a pet to the given household as one row', async () => {
    const { query } = mockQuery({ data: kiwiRow, error: null });

    await expect(
      insertPet('alexs-home', {
        name: 'Kiwi',
        species: 'Cat',
        breed: 'European Shorthair',
        birthDate: '2021-04-12',
      }),
    ).resolves.toMatchObject({ id: 'kiwi-id', name: 'Kiwi' });
    expect(query.insert).toHaveBeenCalledWith({
      household_id: 'alexs-home',
      name: 'Kiwi',
      species: 'Cat',
      breed: 'European Shorthair',
      birth_date: '2021-04-12',
    });
  });

  it('saves one pet by id and clears fields left empty', async () => {
    const { query } = mockQuery({
      data: { ...kiwiRow, breed: null, photo_path: null },
      error: null,
    });

    await expect(updatePet('kiwi-id', { name: 'Kiwi', species: 'Cat' })).resolves.toEqual({
      id: 'kiwi-id',
      name: 'Kiwi',
      species: 'Cat',
      birthDate: '2021-04-12',
    });
    expect(query.update).toHaveBeenCalledWith({
      name: 'Kiwi',
      species: 'Cat',
      breed: null,
      birth_date: null,
    });
    expect(query.eq).toHaveBeenCalledWith('id', 'kiwi-id');
  });

  it('records where a pet photo is stored and touches nothing else', async () => {
    const { query } = mockQuery({ data: kiwiRow, error: null });

    await expect(setPetPhotoPath('kiwi-id', 'kiwi-id/photo')).resolves.toMatchObject({
      id: 'kiwi-id',
      photoPath: 'kiwi-id/photo',
    });
    expect(query.update).toHaveBeenCalledWith({ photo_path: 'kiwi-id/photo' });
    expect(query.eq).toHaveBeenCalledWith('id', 'kiwi-id');
  });

  it('wraps a failed write in a typed error', async () => {
    mockQuery({ data: null, error: { message: 'row-level security' } });

    await expect(insertPet('other-home', { name: 'Kiwi', species: 'Cat' })).rejects.toMatchObject<
      Partial<PetStorageError>
    >({ code: 'WRITE_FAILED' });
  });
});
