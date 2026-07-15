import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PET, loadPets, Pet, PetStorageError, savePets } from '@/lib/pets';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockedStorage = jest.mocked(AsyncStorage);

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
  });

  it('falls back to the first stored pet when the selected pet is stale', async () => {
    await mockedStorage.multiSet([
      ['@kiwi-tracker/pets/v1', JSON.stringify([secondPet, DEFAULT_PET])],
      ['@kiwi-tracker/active-pet/v1', 'missing-pet'],
    ]);

    await expect(loadPets()).resolves.toEqual({
      pets: [secondPet, DEFAULT_PET],
      activePetId: secondPet.id,
    });
  });

  it('wraps invalid persisted profiles in a typed storage error', async () => {
    await mockedStorage.setItem(
      '@kiwi-tracker/pets/v1',
      JSON.stringify([{ ...secondPet, name: '' }]),
    );

    await expect(loadPets()).rejects.toBeInstanceOf(PetStorageError);
  });

  it('wraps storage read failures in a typed storage error', async () => {
    mockedStorage.getItem.mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(loadPets()).rejects.toBeInstanceOf(PetStorageError);
  });

  it('persists profiles and their active selection', async () => {
    await savePets([DEFAULT_PET, secondPet], secondPet.id);

    await expect(
      mockedStorage.multiGet(['@kiwi-tracker/pets/v1', '@kiwi-tracker/active-pet/v1']),
    ).resolves.toEqual([
      ['@kiwi-tracker/pets/v1', JSON.stringify([DEFAULT_PET, secondPet])],
      ['@kiwi-tracker/active-pet/v1', secondPet.id],
    ]);
  });
});
