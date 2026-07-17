import * as ImagePicker from 'expo-image-picker';

import { pickPetPhoto } from '@/lib/petPhotoPicker';

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
      assets: [
        {
          uri: 'file:///selected.jpg',
          base64: 'encoded-photo',
          mimeType: 'image/jpeg',
          width: 100,
          height: 100,
        },
      ],
    });

    await expect(pickPetPhoto()).resolves.toEqual({
      status: 'selected',
      photo: {
        uri: 'file:///selected.jpg',
        base64: 'encoded-photo',
        mimeType: 'image/jpeg',
      },
    });
  });

  it('returns a typed failure when the device integration rejects', async () => {
    mockedImagePicker.requestMediaLibraryPermissionsAsync.mockRejectedValue(
      new Error('picker unavailable'),
    );

    await expect(pickPetPhoto()).resolves.toEqual({ status: 'failed' });
  });
});
