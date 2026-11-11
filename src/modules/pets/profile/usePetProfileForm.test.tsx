import { act, renderHook } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import { usePetProfileForm } from '@/modules/pets/profile/usePetProfileForm';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const mockedImagePicker = jest.mocked(ImagePicker);

describe('usePetProfileForm', () => {
  it('validates and submits pet profile form values', async () => {
    const savedPet = {
      id: 'miso',
      name: 'Miso',
      species: 'Dog' as const,
    };
    const onSubmit = jest.fn().mockResolvedValue({
      pet: savedPet,
      photoSaveFailed: false,
    });
    const { result } = renderHook(() => usePetProfileForm({ onSubmit }));

    act(() => {
      result.current.open();
      result.current.setName(' Miso ');
      result.current.setSpecies('Dog');
      result.current.setBirthDate('05-03-2020');
    });

    await act(async () => {
      expect(await result.current.submit()).toMatchObject({ status: 'saved' });
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: ' Miso ',
        species: 'Dog',
        birthDate: '2020-03-05',
      }),
    );
    expect(result.current.visible).toBe(false);
  });

  it('reports denied photo permission without opening the library', async () => {
    mockedImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: false,
    } as Awaited<ReturnType<typeof ImagePicker.requestMediaLibraryPermissionsAsync>>);
    const { result } = renderHook(() =>
      usePetProfileForm({ onSubmit: jest.fn().mockRejectedValue(new Error('not used')) }),
    );

    await act(async () => {
      expect(await result.current.pickPhoto()).toBe('permission-denied');
    });

    expect(mockedImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });
});
