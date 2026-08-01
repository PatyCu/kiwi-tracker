import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PET, Pet } from '@/modules/pets/model/Pet';
import { loadPets, PetStorageError, savePets } from '@/modules/pets/persistence/petStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockedStorage = jest.mocked(AsyncStorage);
const stateKey = '@kiwi-tracker/pet-state/v2';
const legacyPetsKey = '@kiwi-tracker/pets/v1';
const legacyActivePetKey = '@kiwi-tracker/active-pet/v1';

const secondPet: Pet = {
  id: 'miso',
  name: 'Miso',
  species: 'Cat',
  createdAt: '2025-02-01T10:00:00.000Z',
};

describe('pet storage', () => {
  beforeEach(() => {
    mockedStorage.clear();
    jest.clearAllMocks();
  });

  it('provides the original Kiwi profile when no pet data exists', async () => {
    await expect(loadPets()).resolves.toEqual({
      pets: [DEFAULT_PET],
      activePetId: DEFAULT_PET.id,
    });
    await expect(mockedStorage.getItem(stateKey)).resolves.toBeNull();
  });

  it('migrates legacy profiles into one versioned state document', async () => {
    await mockedStorage.multiSet([
      [legacyPetsKey, JSON.stringify([DEFAULT_PET, secondPet])],
      [legacyActivePetKey, secondPet.id],
    ]);

    await expect(loadPets()).resolves.toEqual({
      pets: [DEFAULT_PET, secondPet],
      activePetId: secondPet.id,
    });
    await expect(mockedStorage.getItem(stateKey)).resolves.toBe(
      JSON.stringify({
        version: 2,
        pets: [DEFAULT_PET, secondPet],
        activePetId: secondPet.id,
      }),
    );
    await expect(mockedStorage.getItem(legacyPetsKey)).resolves.not.toBeNull();
  });

  it('falls back to the first legacy pet when the selected pet is stale', async () => {
    await mockedStorage.multiSet([
      [legacyPetsKey, JSON.stringify([secondPet, DEFAULT_PET])],
      [legacyActivePetKey, 'missing-pet'],
    ]);

    await expect(loadPets()).resolves.toEqual({
      pets: [secondPet, DEFAULT_PET],
      activePetId: secondPet.id,
    });
  });

  it('prefers the versioned state after migration', async () => {
    await mockedStorage.multiSet([
      [stateKey, JSON.stringify({ version: 2, pets: [secondPet], activePetId: secondPet.id })],
      [legacyPetsKey, JSON.stringify([DEFAULT_PET])],
      [legacyActivePetKey, DEFAULT_PET.id],
    ]);

    await expect(loadPets()).resolves.toEqual({ pets: [secondPet], activePetId: secondPet.id });
  });

  it('rejects malformed timestamps and dates in persisted profiles', async () => {
    await mockedStorage.setItem(
      stateKey,
      JSON.stringify({
        version: 2,
        pets: [{ ...secondPet, createdAt: 'yesterday', birthDate: '2025-02-31' }],
        activePetId: secondPet.id,
      }),
    );

    await expect(loadPets()).rejects.toMatchObject<Partial<PetStorageError>>({
      name: 'PetStorageError',
      code: 'INVALID_DATA',
    });
  });

  it('treats an empty state document as corrupted data', async () => {
    mockedStorage.getItem.mockResolvedValueOnce('');

    await expect(loadPets()).rejects.toMatchObject<Partial<PetStorageError>>({
      code: 'INVALID_DATA',
    });
  });

  it('wraps storage read failures in a typed storage error', async () => {
    mockedStorage.getItem.mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(loadPets()).rejects.toMatchObject<Partial<PetStorageError>>({
      code: 'READ_FAILED',
    });
  });

  it('reports a migration write failure without deleting legacy data', async () => {
    await mockedStorage.multiSet([
      [legacyPetsKey, JSON.stringify([DEFAULT_PET])],
      [legacyActivePetKey, DEFAULT_PET.id],
    ]);
    mockedStorage.setItem.mockRejectedValueOnce(new Error('disk full'));

    await expect(loadPets()).rejects.toMatchObject<Partial<PetStorageError>>({
      code: 'MIGRATION_FAILED',
    });
    await expect(mockedStorage.getItem(legacyPetsKey)).resolves.toBe(JSON.stringify([DEFAULT_PET]));
  });

  it('persists profiles and their active selection with one write', async () => {
    await savePets([DEFAULT_PET, secondPet], secondPet.id);

    expect(mockedStorage.setItem).toHaveBeenCalledTimes(1);
    await expect(mockedStorage.getItem(stateKey)).resolves.toBe(
      JSON.stringify({
        version: 2,
        pets: [DEFAULT_PET, secondPet],
        activePetId: secondPet.id,
      }),
    );
  });

  it('does not write an invalid active-pet selection', async () => {
    await expect(savePets([DEFAULT_PET], 'missing-pet')).rejects.toMatchObject<
      Partial<PetStorageError>
    >({ code: 'INVALID_DATA' });

    expect(mockedStorage.setItem).not.toHaveBeenCalled();
  });

  it('wraps a state-document write failure', async () => {
    mockedStorage.setItem.mockRejectedValueOnce(new Error('disk full'));

    await expect(savePets([DEFAULT_PET], DEFAULT_PET.id)).rejects.toMatchObject<
      Partial<PetStorageError>
    >({ code: 'WRITE_FAILED' });
  });
});
