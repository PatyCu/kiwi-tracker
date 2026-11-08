import { useCallback, useMemo, useState } from 'react';

import {
  isValidDisplayedBirthDate,
  toDisplayedBirthDate,
  toStoredBirthDate,
} from '@/shared/dates/dateTime';
import { SelectedPetPhoto } from '@/modules/pets/media/petImageStore';
import { pickPetPhoto as pickPetPhotoFromLibrary } from '@/modules/pets/media/pickPetPhoto';
import { Pet } from '@/modules/pets/model/Pet';
import type {
  SavePetProfileInput,
  SavePetProfileResult,
} from '@/modules/pets/profile/savePetProfile';

type PetProfileInput = Omit<SavePetProfileInput, 'pets' | 'householdId'>;

type UsePetProfileFormInput = {
  onSubmit: (input: PetProfileInput) => Promise<SavePetProfileResult>;
};

type PhotoPickResult = 'selected' | 'cancelled' | 'permission-denied' | 'failed';
type PetProfileSubmitResult =
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
    const result = await pickPetPhotoFromLibrary();
    if (result.status === 'selected') {
      setPhotoUri(result.photo.uri);
      setSelectedPhoto(result.photo);
    }
    return result.status;
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
