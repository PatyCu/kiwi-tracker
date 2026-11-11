import {
  preparePetPhotoUpload,
  SelectedPetPhoto,
} from '@/modules/pets/media/preparePetPhotoUpload';
import { Pet } from '@/modules/pets/model/Pet';
import { removePetPhoto, uploadPetPhoto } from '@/modules/pets/persistence/petPhotoStore';
import { insertPet, setPetPhotoPath, updatePet } from '@/modules/pets/persistence/petStore';
import { savePetProfile, PetProfileSaveError } from '@/modules/pets/profile/savePetProfile';

jest.mock('@/modules/pets/media/preparePetPhotoUpload', () => ({
  preparePetPhotoUpload: jest.fn(),
}));
jest.mock('@/modules/pets/persistence/petPhotoStore', () => ({
  removePetPhoto: jest.fn(),
  uploadPetPhoto: jest.fn(),
}));
jest.mock('@/modules/pets/persistence/petStore', () => ({
  insertPet: jest.fn(),
  setPetPhotoPath: jest.fn(),
  updatePet: jest.fn(),
}));

const mockedPrepare = jest.mocked(preparePetPhotoUpload);
const mockedUpload = jest.mocked(uploadPetPhoto);
const mockedRemove = jest.mocked(removePetPhoto);
const mockedInsertPet = jest.mocked(insertPet);
const mockedSetPhotoPath = jest.mocked(setPetPhotoPath);
const mockedUpdatePet = jest.mocked(updatePet);

const householdId = 'alexs-home';
const selectedPhoto: SelectedPetPhoto = { uri: 'file:///tmp/new.jpg', width: 900, height: 900 };
const upload = { bytes: new ArrayBuffer(3), contentType: 'image/jpeg' };
const previewUri = 'file:///cache/scaled.jpg';
const kiwi: Pet = {
  id: 'kiwi',
  name: 'Kiwi',
  species: 'Cat',
  photoPath: 'kiwi/old.jpg',
  photoUri: 'https://storage.test/kiwi/old.jpg?token=a',
};
const { photoUri: _photoUri, ...storedKiwi } = kiwi;

describe('pet profile service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPrepare.mockResolvedValue({ upload, previewUri });
    mockedUpload.mockImplementation(async (petId) => `${petId}/new.jpg`);
    mockedRemove.mockResolvedValue();
    mockedInsertPet.mockImplementation(async (_householdId, profile) => ({
      id: 'new-pet',
      ...profile,
    }));
    mockedUpdatePet.mockImplementation(async (id, profile) => ({ id, ...profile }));
    mockedSetPhotoPath.mockImplementation(async (id, photoPath) => ({
      id,
      name: id === 'kiwi' ? 'Kiwi' : 'Miso',
      species: 'Cat',
      photoPath,
    }));
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
    expect(mockedUpload).not.toHaveBeenCalled();
    expect(result).toEqual({
      pet: { id: 'new-pet', name: 'Murri', species: 'Cat' },
      photoSaveFailed: false,
    });
  });

  it("uploads a new pet's photo after adding it and records where it is stored", async () => {
    const result = await savePetProfile({
      pets: [],
      householdId,
      name: 'Miso',
      species: 'Cat',
      selectedPhoto,
    });

    expect(mockedPrepare).toHaveBeenCalledWith(selectedPhoto);
    expect(mockedUpload).toHaveBeenCalledWith('new-pet', upload);
    expect(mockedSetPhotoPath).toHaveBeenCalledWith('new-pet', 'new-pet/new.jpg');
    expect(mockedRemove).not.toHaveBeenCalled();
    expect(result).toEqual({
      pet: {
        id: 'new-pet',
        name: 'Miso',
        species: 'Cat',
        photoPath: 'new-pet/new.jpg',
        photoUri: previewUri,
      },
      photoSaveFailed: false,
    });
  });

  it('points the pet at its new photo before deleting the file it replaces', async () => {
    mockedUpdatePet.mockResolvedValueOnce(storedKiwi);

    const result = await savePetProfile({
      pets: [kiwi],
      householdId,
      editingPetId: kiwi.id,
      name: 'Kiwi',
      species: 'Cat',
      selectedPhoto,
    });

    expect(mockedSetPhotoPath).toHaveBeenCalledWith('kiwi', 'kiwi/new.jpg');
    expect(mockedRemove).toHaveBeenCalledWith('kiwi/old.jpg');
    expect(mockedSetPhotoPath.mock.invocationCallOrder[0]).toBeLessThan(
      mockedRemove.mock.invocationCallOrder[0],
    );
    expect(result).toEqual({
      pet: { ...storedKiwi, photoPath: 'kiwi/new.jpg', photoUri: previewUri },
      photoSaveFailed: false,
    });
  });

  it('keeps the shown photo link when the profile is saved without a new photo', async () => {
    mockedUpdatePet.mockResolvedValueOnce(storedKiwi);

    const result = await savePetProfile({
      pets: [kiwi],
      householdId,
      editingPetId: kiwi.id,
      name: 'Kiwi',
      species: 'Cat',
    });

    expect(result.pet.photoUri).toBe(kiwi.photoUri);
    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it('saves nothing when the selected photo cannot be prepared', async () => {
    mockedPrepare.mockRejectedValueOnce(new Error('unsupported'));

    await expect(
      savePetProfile({ pets: [], householdId, name: 'Miso', species: 'Cat', selectedPhoto }),
    ).rejects.toBeInstanceOf(PetProfileSaveError);

    expect(mockedInsertPet).not.toHaveBeenCalled();
  });

  it('does not upload the photo when the profile is not saved', async () => {
    mockedInsertPet.mockRejectedValueOnce(new Error('offline'));

    await expect(
      savePetProfile({ pets: [], householdId, name: 'Miso', species: 'Cat', selectedPhoto }),
    ).rejects.toBeInstanceOf(PetProfileSaveError);

    expect(mockedUpload).not.toHaveBeenCalled();
  });

  it('returns the saved pet when only its photo fails, so it is never added twice', async () => {
    mockedUpload.mockRejectedValueOnce(new Error('offline'));

    await expect(
      savePetProfile({ pets: [], householdId, name: 'Miso', species: 'Cat', selectedPhoto }),
    ).resolves.toEqual({
      pet: { id: 'new-pet', name: 'Miso', species: 'Cat' },
      photoSaveFailed: true,
    });
  });

  it('keeps the previous photo and deletes the new file when the pet cannot point to it', async () => {
    mockedUpdatePet.mockResolvedValueOnce(storedKiwi);
    mockedSetPhotoPath.mockRejectedValueOnce(new Error('offline'));

    const result = await savePetProfile({
      pets: [kiwi],
      householdId,
      editingPetId: kiwi.id,
      name: 'Kiwi',
      species: 'Cat',
      selectedPhoto,
    });

    expect(mockedRemove).toHaveBeenCalledWith('kiwi/new.jpg');
    expect(mockedRemove).not.toHaveBeenCalledWith('kiwi/old.jpg');
    expect(result).toEqual({ pet: kiwi, photoSaveFailed: true });
  });

  it('still saves the new photo when the replaced file cannot be deleted', async () => {
    mockedUpdatePet.mockResolvedValueOnce(storedKiwi);
    mockedRemove.mockRejectedValueOnce(new Error('offline'));

    await expect(
      savePetProfile({
        pets: [kiwi],
        householdId,
        editingPetId: kiwi.id,
        name: 'Kiwi',
        species: 'Cat',
        selectedPhoto,
      }),
    ).resolves.toMatchObject({ pet: { photoPath: 'kiwi/new.jpg' }, photoSaveFailed: false });
  });

  it('refuses to edit a pet that is no longer in the list', async () => {
    await expect(
      savePetProfile({ pets: [], householdId, editingPetId: 'gone', name: 'X', species: 'Cat' }),
    ).rejects.toBeInstanceOf(PetProfileSaveError);

    expect(mockedInsertPet).not.toHaveBeenCalled();
    expect(mockedUpdatePet).not.toHaveBeenCalled();
  });
});
