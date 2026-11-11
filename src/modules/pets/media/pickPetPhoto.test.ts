import * as ImagePicker from 'expo-image-picker';

import { pickPetPhoto } from '@/modules/pets/media/pickPetPhoto';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const mockedImagePicker = jest.mocked(ImagePicker);

describe('pet photo picker', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not open the library when permission is denied', async () => {
    mockedImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: false,
    } as Awaited<ReturnType<typeof ImagePicker.requestMediaLibraryPermissionsAsync>>);

    await expect(pickPetPhoto()).resolves.toEqual({ status: 'permission-denied' });
    expect(mockedImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it('maps a selected image to the storage input', async () => {
    mockedImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
    } as Awaited<ReturnType<typeof ImagePicker.requestMediaLibraryPermissionsAsync>>);
    mockedImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///selected.jpg', mimeType: 'image/jpeg', width: 1200, height: 900 }],
    });

    await expect(pickPetPhoto()).resolves.toEqual({
      status: 'selected',
      photo: { uri: 'file:///selected.jpg', width: 1200, height: 900 },
    });
  });

  it('returns a typed failure when the device integration rejects', async () => {
    mockedImagePicker.requestMediaLibraryPermissionsAsync.mockRejectedValue(
      new Error('picker unavailable'),
    );

    await expect(pickPetPhoto()).resolves.toEqual({ status: 'failed' });
  });
});
