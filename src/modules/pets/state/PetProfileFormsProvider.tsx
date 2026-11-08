import { createContext, ReactNode, useContext, useMemo } from 'react';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Pet } from '@/modules/pets/model/Pet';
import { usePetProfileForm } from '@/modules/pets/profile/usePetProfileForm';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { PetProfileModal } from '@/modules/pets/ui/PetProfileModal';
import { showMessage } from '@/shared/platform/dialogs';

type PetProfileFormsContextValue = {
  addPet: () => void;
  editPet: (pet: Pet) => void;
};

const PetProfileFormsContext = createContext<PetProfileFormsContextValue | null>(null);

export function PetProfileFormsProvider({ children }: { children: ReactNode }) {
  const { colors } = useAppearance();
  const { saveProfile } = usePets();
  const form = usePetProfileForm({ onSubmit: saveProfile });

  const pickPhoto = async () => {
    const result = await form.pickPhoto();
    if (result === 'permission-denied') {
      showMessage(
        'Photo access needed',
        'Allow photo library access to choose a picture for your pet.',
      );
    } else if (result === 'failed') {
      showMessage('Photo not selected', 'The photo library could not be opened. Please try again.');
    }
  };

  const save = async () => {
    const result = await form.submit();
    if (result.status === 'failed') {
      showMessage(
        form.editing ? 'Pet not updated' : 'Pet not added',
        'The profile could not be confirmed as saved. Reopen the app before trying again.',
      );
    } else if (result.status === 'saved' && result.result.previousPhotoCleanupFailed) {
      showMessage('Pet saved', 'The previous photo could not be removed from device storage.');
    }
  };

  const value = useMemo(
    () => ({ addPet: () => form.open(), editPet: (pet: Pet) => form.open(pet) }),
    [form],
  );

  return (
    <PetProfileFormsContext.Provider value={value}>
      {children}
      <PetProfileModal
        visible={form.visible}
        editing={form.editing}
        name={form.name}
        species={form.species}
        breed={form.breed}
        birthDate={form.birthDate}
        photoUri={form.photoUri}
        birthDateIsValid={form.birthDateIsValid}
        isSaving={form.isSaving}
        colors={colors}
        onNameChange={form.setName}
        onSpeciesChange={form.setSpecies}
        onBreedChange={form.setBreed}
        onBirthDateChange={form.setBirthDate}
        onPickPhoto={() => void pickPhoto()}
        onSave={() => void save()}
        onClose={form.close}
      />
    </PetProfileFormsContext.Provider>
  );
}

export function usePetProfileForms(): PetProfileFormsContextValue {
  const value = useContext(PetProfileFormsContext);
  if (!value) throw new Error('usePetProfileForms must be used inside PetProfileFormsProvider.');
  return value;
}
