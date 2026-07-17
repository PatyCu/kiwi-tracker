import { act, renderHook } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import { useHealthEventForm } from '@/hooks/useHealthEventForm';
import { usePetProfileForm } from '@/hooks/usePetProfileForm';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const mockedImagePicker = jest.mocked(ImagePicker);

describe('form hooks', () => {
  it('submits and resets the health event form', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useHealthEventForm({ onSubmit }));

    act(() => {
      result.current.open();
      result.current.setKind('Asthma');
      result.current.setNote('Recovered quickly.');
    });

    let saved = false;
    await act(async () => {
      saved = await result.current.submit();
    });

    expect(saved).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith('Asthma', 'Recovered quickly.');
    expect(result.current).toMatchObject({ visible: false, kind: 'Vomiting', note: '' });
  });

  it('validates and submits pet profile form values', async () => {
    const savedPet = {
      id: 'miso',
      name: 'Miso',
      species: 'Dog' as const,
      createdAt: '2025-01-01T00:00:00.000Z',
    };
    const onSubmit = jest.fn().mockResolvedValue({
      pets: [savedPet],
      activePetId: savedPet.id,
      pet: savedPet,
      previousPhotoCleanupFailed: false,
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
