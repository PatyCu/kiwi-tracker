import { router, useLocalSearchParams } from 'expo-router';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { usePetProfileForms } from '@/modules/pets/state/PetProfileFormsProvider';
import { PetOverview } from '@/modules/pets/ui/PetOverview';
import { PetSelector } from '@/modules/pets/ui/PetSelector';
import { LoadError } from '@/shared/ui/LoadState';
import { PlaceholderCard } from '@/shared/ui/PlaceholderCard';
import { Screen } from '@/shared/ui/Screen';
import { SectionHeader } from '@/shared/ui/SectionHeader';

export function PetsScreen() {
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const { colors } = useAppearance();
  const { pets, loadStatus, retryLoad } = usePets();
  const { addPet, editPet } = usePetProfileForms();
  const selectedPet = pets.find((pet) => pet.id === petId) ?? pets[0];

  if (loadStatus === 'error') {
    return (
      <Screen>
        <LoadError onRetry={() => void retryLoad()} />
      </Screen>
    );
  }

  if (!selectedPet) {
    return (
      <Screen>
        <SectionHeader compact title="Your pets" actionLabel="Add pet" onAction={addPet} />
        <PlaceholderCard
          title="No pets yet"
          description="Add a pet to start tracking their care."
          icon="paw-outline"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PetSelector
        pets={pets}
        selectedPetId={selectedPet.id}
        colors={colors}
        onSelectPet={(selectedPetId) => router.setParams({ petId: selectedPetId })}
        onAddPet={addPet}
      />
      <PetOverview pet={selectedPet} onEditPet={() => editPet(selectedPet)} />
    </Screen>
  );
}
