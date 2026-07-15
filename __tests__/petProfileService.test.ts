import { deletePersistedPetPhoto, persistPetPhoto, SelectedPetPhoto } from '@/lib/petImages';
import { savePetProfile, PetProfileSaveError } from '@/lib/petProfileService';
import { DEFAULT_PET, loadPets, Pet, savePets } from '@/lib/pets';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/lib/petImages', () => ({
  deletePersistedPetPhoto: jest.fn(),
  persistPetPhoto: jest.fn(),
}));

jest.mock('@/lib/pets', () => {
  const actual = jest.requireActual('@/lib/pets');
  return { ...actual, loadPets: jest.fn(), savePets: jest.fn() };
});

const mockedDeletePhoto = jest.mocked(deletePersistedPetPhoto);
const mockedPersistPhoto = jest.mocked(persistPetPhoto);
const mockedLoadPets = jest.mocked(loadPets);
const mockedSavePets = jest.mocked(savePets);

const selectedPhoto: SelectedPetPhoto = { uri: 'file:///tmp/new-photo.jpg' };
const petWithPhoto: Pet = {
  ...DEFAULT_PET,
  photoUri: 'file:///documents/pet-images/kiwi-old.jpg',
  photoStorageVersion: 1,
};

describe('pet profile service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPersistPhoto.mockResolvedValue('file:///documents/pet-images/kiwi-new.jpg');
    mockedSavePets.mockResolvedValue();
    mockedDeletePhoto.mockResolvedValue();
  });

  it('commits the profile before deleting its previous photo', async () => {
    const result = await savePetProfile({
      pets: [petWithPhoto],
      editingPetId: petWithPhoto.id,
      name: 'Kiwi updated',
      species: 'Cat',
      selectedPhoto,
    });

    expect(mockedSavePets).toHaveBeenCalledWith(
      [
        {
          ...petWithPhoto,
          name: 'Kiwi updated',
          photoUri: 'file:///documents/pet-images/kiwi-new.jpg',
        },
      ],
      petWithPhoto.id,
    );
    expect(mockedDeletePhoto).toHaveBeenCalledWith(petWithPhoto.photoUri);
    expect(result.previousPhotoCleanupFailed).toBe(false);
  });

  it('does not write a profile when its selected photo cannot be persisted', async () => {
    mockedPersistPhoto.mockRejectedValueOnce(new Error('photo unavailable'));

    await expect(
      savePetProfile({
        pets: [DEFAULT_PET],
        name: 'Miso',
        species: 'Cat',
        selectedPhoto,
      }),
    ).rejects.toMatchObject<Partial<PetProfileSaveError>>({
      name: 'PetProfileSaveError',
    });

    expect(mockedSavePets).not.toHaveBeenCalled();
    expect(mockedDeletePhoto).not.toHaveBeenCalled();
  });

  it('removes a new photo after proving that a rejected state write did not commit', async () => {
    mockedSavePets.mockRejectedValueOnce(new Error('disk full'));
    mockedLoadPets.mockResolvedValueOnce({ pets: [DEFAULT_PET], activePetId: DEFAULT_PET.id });

    await expect(
      savePetProfile({
        pets: [DEFAULT_PET],
        name: 'Miso',
        species: 'Cat',
        selectedPhoto,
      }),
    ).rejects.toMatchObject<Partial<PetProfileSaveError>>({
      name: 'PetProfileSaveError',
      retainedPhotoUri: undefined,
    });

    expect(mockedDeletePhoto).toHaveBeenCalledWith('file:///documents/pet-images/kiwi-new.jpg');
  });

  it('retains a new photo when storage cannot confirm whether it was referenced', async () => {
    mockedSavePets.mockRejectedValueOnce(new Error('storage disconnected'));
    mockedLoadPets.mockRejectedValue(new Error('storage disconnected'));

    await expect(
      savePetProfile({
        pets: [DEFAULT_PET],
        name: 'Miso',
        species: 'Cat',
        selectedPhoto,
      }),
    ).rejects.toMatchObject<Partial<PetProfileSaveError>>({
      retainedPhotoUri: 'file:///documents/pet-images/kiwi-new.jpg',
    });

    expect(mockedDeletePhoto).not.toHaveBeenCalled();
  });

  it('reconciles a write that committed even though the storage promise rejected', async () => {
    const committedPet: Pet = {
      ...petWithPhoto,
      name: 'Kiwi updated',
      photoUri: 'file:///documents/pet-images/kiwi-new.jpg',
    };
    mockedSavePets.mockRejectedValueOnce(new Error('late storage error'));
    mockedLoadPets.mockResolvedValueOnce({ pets: [committedPet], activePetId: committedPet.id });

    await expect(
      savePetProfile({
        pets: [petWithPhoto],
        editingPetId: petWithPhoto.id,
        name: committedPet.name,
        species: committedPet.species,
        selectedPhoto,
      }),
    ).resolves.toMatchObject({ pet: committedPet, pets: [committedPet] });

    expect(mockedDeletePhoto).toHaveBeenCalledWith(petWithPhoto.photoUri);
  });

  it('reports old-photo cleanup separately after a successful profile save', async () => {
    mockedDeletePhoto.mockRejectedValueOnce(new Error('file locked'));

    await expect(
      savePetProfile({
        pets: [petWithPhoto],
        editingPetId: petWithPhoto.id,
        name: petWithPhoto.name,
        species: petWithPhoto.species,
        selectedPhoto,
      }),
    ).resolves.toMatchObject({ previousPhotoCleanupFailed: true });
  });
});
