import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { migrateLegacyPetPhotos, persistPetPhoto } from '@/lib/petImages';
import { Pet } from '@/lib/pets';

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///documents/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

const mockedFileSystem = jest.mocked(FileSystem);
const originalPlatform = Platform.OS;

describe('pet image persistence', () => {
  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1_750_000_000_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates the image directory and copies a selected native photo', async () => {
    mockedFileSystem.getInfoAsync.mockResolvedValue({
      exists: false,
      uri: 'file:///documents/pet-images/',
      isDirectory: false,
    });

    await expect(persistPetPhoto({ uri: 'file:///tmp/photo.jpeg' }, 'pet-1')).resolves.toBe(
      'file:///documents/pet-images/pet-1-1750000000000.jpeg',
    );

    expect(mockedFileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
      'file:///documents/pet-images/',
      { intermediates: true },
    );
    expect(mockedFileSystem.copyAsync).toHaveBeenCalledWith({
      from: 'file:///tmp/photo.jpeg',
      to: 'file:///documents/pet-images/pet-1-1750000000000.jpeg',
    });
  });

  it('migrates a legacy native photo and reports the created file', async () => {
    mockedFileSystem.getInfoAsync.mockResolvedValue({
      exists: true,
      uri: 'file:///documents/pet-images/',
      size: 0,
      isDirectory: true,
      modificationTime: 0,
    });
    const pet: Pet = {
      id: 'kiwi',
      name: 'Kiwi',
      species: 'Cat',
      photoUri: 'file:///tmp/legacy-photo.jpg',
      createdAt: '2025-01-01T00:00:00.000Z',
    };

    await expect(migrateLegacyPetPhotos([pet])).resolves.toEqual({
      pets: [
        {
          ...pet,
          photoUri: 'file:///documents/pet-images/kiwi-1750000000000.jpg',
          photoStorageVersion: 1,
        },
      ],
      createdUris: ['file:///documents/pet-images/kiwi-1750000000000.jpg'],
      failedPetNames: [],
      didChange: true,
    });
  });
});
