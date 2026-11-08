import {
  deletePersistedPetPhoto,
  persistPetPhoto,
  SelectedPetPhoto,
} from '@/modules/pets/media/petImageStore';
import { Pet } from '@/modules/pets/model/Pet';
import { insertPet, updatePet } from '@/modules/pets/persistence/petStore';
import { savePetProfile, PetProfileSaveError } from '@/modules/pets/profile/savePetProfile';

jest.mock('@/modules/pets/media/petImageStore', () => ({
  deletePersistedPetPhoto: jest.fn(),
  persistPetPhoto: jest.fn(),
}));

jest.mock('@/modules/pets/persistence/petStore', () => ({
  insertPet: jest.fn(),
  updatePet: jest.fn(),
}));

const mockedDeletePhoto = jest.mocked(deletePersistedPetPhoto);
const mockedPersistPhoto = jest.mocked(persistPetPhoto);
const mockedInsertPet = jest.mocked(insertPet);
const mockedUpdatePet = jest.mocked(updatePet);

const householdId = 'alexs-home';
const newPhotoUri = 'file:///documents/pet-images/kiwi-new.jpg';
const selectedPhoto: SelectedPetPhoto = { uri: 'file:///tmp/new-photo.jpg' };
const kiwi: Pet = {
  id: 'kiwi',
  name: 'Kiwi',
  species: 'Cat',
  photoUri: 'file:///documents/pet-images/kiwi-old.jpg',
};
const { photoUri: _photoUri, ...storedKiwi } = kiwi;

describe('pet profile service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPersistPhoto.mockResolvedValue(newPhotoUri);
    mockedDeletePhoto.mockResolvedValue();
    mockedInsertPet.mockImplementation(async (_householdId, profile) => ({
      id: 'new-pet',
      ...profile,
    }));
    mockedUpdatePet.mockImplementation(async (id, profile) => ({ id, ...profile }));
  });

  it('adds a new pet to the household as one record', async () => {
    const result = await savePetProfile({
      pets: [kiwi],
      householdId,
      name: ' Murri ',
      species: 'Cat',
      breed: '  ',
    });

    expect(mockedInsertPet).toHaveBeenCalledWith(householdId, {
      name: 'Murri',
      species: 'Cat',
      breed: undefined,
      birthDate: undefined,
    });
    expect(mockedUpdatePet).not.toHaveBeenCalled();
    expect(result).toEqual({
      pet: { id: 'new-pet', name: 'Murri', species: 'Cat' },
      previousPhotoCleanupFailed: false,
    });
  });

  it('saves an existing pet before deleting its previous photo', async () => {
    mockedUpdatePet.mockResolvedValueOnce({ ...storedKiwi, name: 'Kiwi updated' });

    const result = await savePetProfile({
      pets: [kiwi],
      householdId,
      editingPetId: kiwi.id,
      name: 'Kiwi updated',
      species: 'Cat',
      selectedPhoto,
    });

    expect(mockedUpdatePet).toHaveBeenCalledWith(
      'kiwi',
      expect.objectContaining({ name: 'Kiwi updated' }),
    );
    expect(mockedInsertPet).not.toHaveBeenCalled();
    expect(mockedDeletePhoto).toHaveBeenCalledWith(kiwi.photoUri);
    expect(result.pet).toEqual({ ...storedKiwi, name: 'Kiwi updated', photoUri: newPhotoUri });
  });

  it('keeps the photo shown on this device when the profile is saved without a new one', async () => {
    const result = await savePetProfile({
      pets: [kiwi],
      householdId,
      editingPetId: kiwi.id,
      name: 'Kiwi',
      species: 'Cat',
    });

    expect(result.pet.photoUri).toBe(kiwi.photoUri);
    expect(mockedDeletePhoto).not.toHaveBeenCalled();
  });

  it('does not save a profile when its selected photo cannot be kept', async () => {
    mockedPersistPhoto.mockRejectedValueOnce(new Error('photo unavailable'));

    await expect(
      savePetProfile({ pets: [], householdId, name: 'Miso', species: 'Cat', selectedPhoto }),
    ).rejects.toBeInstanceOf(PetProfileSaveError);

    expect(mockedInsertPet).not.toHaveBeenCalled();
  });

  it('removes the new photo when the profile is not saved', async () => {
    mockedInsertPet.mockRejectedValueOnce(new Error('offline'));

    await expect(
      savePetProfile({ pets: [], householdId, name: 'Miso', species: 'Cat', selectedPhoto }),
    ).rejects.toMatchObject<Partial<PetProfileSaveError>>({
      name: 'PetProfileSaveError',
      retainedPhotoUri: undefined,
    });

    expect(mockedDeletePhoto).toHaveBeenCalledWith(newPhotoUri);
  });

  it('reports the new photo it could not remove after a failed save', async () => {
    mockedInsertPet.mockRejectedValueOnce(new Error('offline'));
    mockedDeletePhoto.mockRejectedValueOnce(new Error('file locked'));

    await expect(
      savePetProfile({ pets: [], householdId, name: 'Miso', species: 'Cat', selectedPhoto }),
    ).rejects.toMatchObject<Partial<PetProfileSaveError>>({ retainedPhotoUri: newPhotoUri });
  });

  it('refuses to edit a pet that is no longer in the list', async () => {
    await expect(
      savePetProfile({ pets: [], householdId, editingPetId: 'gone', name: 'X', species: 'Cat' }),
    ).rejects.toBeInstanceOf(PetProfileSaveError);

    expect(mockedInsertPet).not.toHaveBeenCalled();
    expect(mockedUpdatePet).not.toHaveBeenCalled();
  });

  it('reports old-photo cleanup separately after a successful save', async () => {
    mockedDeletePhoto.mockRejectedValueOnce(new Error('file locked'));

    await expect(
      savePetProfile({
        pets: [kiwi],
        householdId,
        editingPetId: kiwi.id,
        name: kiwi.name,
        species: kiwi.species,
        selectedPhoto,
      }),
    ).resolves.toMatchObject({ previousPhotoCleanupFailed: true });
  });
});
