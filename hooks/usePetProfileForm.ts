import * as ImagePicker from 'expo-image-picker';
import { useCallback, useMemo, useState } from 'react';

import {
  isValidDisplayedBirthDate,
  toDisplayedBirthDate,
  toStoredBirthDate,
} from '@/lib/dateUtils';
import type { PetProfileInput } from '@/hooks/useDashboardData';
import { SelectedPetPhoto } from '@/lib/petImages';
import type { SavePetProfileResult } from '@/lib/petProfileService';
import { Pet } from '@/lib/pets';

type UsePetProfileFormInput = {
  onSubmit: (input: PetProfileInput) => Promise<SavePetProfileResult>;
};

export type PhotoPickResult = 'selected' | 'cancelled' | 'permission-denied' | 'failed';
export type PetProfileSubmitResult =
  { status: 'saved'; result: SavePetProfileResult } | { status: 'failed' | 'invalid' };

export function usePetProfileForm({ onSubmit }: UsePetProfileFormInput) {
  const [visible, setVisible] = useState(false);
  const [editingPetId, setEditingPetId] = useState<string>();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Pet['species']>('Cat');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [photoUri, setPhotoUri] = useState<string>();
  const [selectedPhoto, setSelectedPhoto] = useState<SelectedPetPhoto>();
  const [isSaving, setIsSaving] = useState(false);

  const birthDateIsValid = useMemo(() => isValidDisplayedBirthDate(birthDate), [birthDate]);
  const editing = Boolean(editingPetId);

  const open = useCallback((pet?: Pet) => {
    setEditingPetId(pet?.id);
    setName(pet?.name ?? '');
    setSpecies(pet?.species ?? 'Cat');
    setBreed(pet?.breed ?? '');
    setBirthDate(toDisplayedBirthDate(pet?.birthDate));
    setPhotoUri(pet?.photoUri);
    setSelectedPhoto(undefined);
    setVisible(true);
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const pickPhoto = useCallback(async (): Promise<PhotoPickResult> => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return 'permission-denied';

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (result.canceled) return 'cancelled';

      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      setSelectedPhoto({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType });
      return 'selected';
    } catch {
      return 'failed';
    }
  }, []);

  const submit = useCallback(async (): Promise<PetProfileSubmitResult> => {
    const storedBirthDate = toStoredBirthDate(birthDate);
    if (!name.trim() || isSaving || storedBirthDate === null) return { status: 'invalid' };

    setIsSaving(true);
    try {
      const result = await onSubmit({
        editingPetId,
        name,
        species,
        breed,
        birthDate: storedBirthDate,
        selectedPhoto,
      });
      setVisible(false);
      return { status: 'saved', result };
    } catch {
      return { status: 'failed' };
    } finally {
      setIsSaving(false);
    }
  }, [birthDate, breed, editingPetId, isSaving, name, onSubmit, selectedPhoto, species]);

  return {
    visible,
    editing,
    name,
    species,
    breed,
    birthDate,
    photoUri,
    birthDateIsValid,
    isSaving,
    setName,
    setSpecies,
    setBreed,
    setBirthDate,
    open,
    close,
    pickPhoto,
    submit,
  };
}
