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
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 17, 14, 5));
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useHealthEventForm({ onSubmit }));

    act(() => {
      result.current.open();
      result.current.setKind('Asthma');
      result.current.setNote('Recovered quickly.');
      result.current.setOccurredDate('16-07-2026');
      result.current.setOccurredTime('09:30');
    });

    let saved = false;
    await act(async () => {
      saved = await result.current.submit();
    });

    expect(saved).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith(
      'Asthma',
      'Recovered quickly.',
      new Date(2026, 6, 16, 9, 30).toISOString(),
    );
    expect(result.current).toMatchObject({
      visible: false,
      kind: 'Vomiting',
      note: '',
      isDirty: false,
    });
    jest.useRealTimers();
  });

  it('prefills the current event date and time and rejects invalid edits', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 17, 14, 5));
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useHealthEventForm({ onSubmit }));

    act(() => result.current.open());

    expect(result.current).toMatchObject({
      occurredDate: '17-07-2026',
      occurredTime: '14:05',
      dateTimeIsValid: true,
    });

    act(() => result.current.setOccurredTime('25:00'));

    expect(result.current.dateTimeIsValid).toBe(false);
    expect(result.current.isDirty).toBe(true);
    await act(async () => {
      expect(await result.current.submit()).toBe(false);
    });
    expect(onSubmit).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('discards an unfinished health event when the form closes', () => {
    const { result } = renderHook(() =>
      useHealthEventForm({ onSubmit: jest.fn().mockResolvedValue(undefined) }),
    );

    act(() => {
      result.current.open();
      result.current.setKind('Hairball');
      result.current.setNote('After breakfast');
    });
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.close());

    expect(result.current).toMatchObject({
      visible: false,
      kind: 'Vomiting',
      note: '',
      isDirty: false,
    });
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
