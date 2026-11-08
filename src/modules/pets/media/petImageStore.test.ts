import { Directory, File } from 'expo-file-system';
import { Platform } from 'react-native';
import { deletePersistedPetPhoto, persistPetPhoto } from '@/modules/pets/media/petImageStore';

jest.mock('expo-file-system', () => {
  class MockDirectory {
    readonly uri: string;
    exists = false;
    create = jest.fn();

    constructor(base: { uri: string }, name: string) {
      this.uri = `${base.uri}${name}/`;
    }
  }

  class MockFile {
    readonly uri: string;
    exists = true;
    copy = jest.fn();
    delete = jest.fn();

    constructor(base: string | { uri: string }, name?: string) {
      this.uri = typeof base === 'string' ? base : `${base.uri}${name ?? ''}`;
    }
  }

  return {
    Paths: { document: { uri: 'file:///documents/' } },
    Directory: jest.fn((base, name) => new MockDirectory(base, name)),
    File: jest.fn((base, name) => new MockFile(base, name)),
  };
});

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
    await expect(persistPetPhoto({ uri: 'file:///tmp/photo.jpeg' }, 'pet-1')).resolves.toBe(
      'file:///documents/pet-images/pet-1-1750000000000.jpeg',
    );

    const directory = jest.mocked(Directory).mock.results[0].value;
    const source = jest.mocked(File).mock.results[1].value;
    const destination = jest.mocked(File).mock.results[0].value;

    expect(directory.create).toHaveBeenCalledWith({ intermediates: true, idempotent: true });
    expect(source.copy).toHaveBeenCalledWith(destination);
  });

  it('deletes a photo owned by the app from permanent storage', async () => {
    await deletePersistedPetPhoto('file:///documents/pet-images/kiwi-old.jpg');

    const file = jest.mocked(File).mock.results[0].value;
    expect(file.delete).toHaveBeenCalledTimes(1);
  });

  it('does not delete files outside the app-owned photo directory', async () => {
    await deletePersistedPetPhoto('file:///documents/unrelated-photo.jpg');

    expect(File).not.toHaveBeenCalled();
  });
});
