import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { useHouseholdAlias } from '@/modules/households/state/useHouseholdAlias';
import { usePetsAndEventsLoad } from '@/modules/pet-events/state/usePetsAndEventsLoad';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { usePetProfileForms } from '@/modules/pets/state/PetProfileFormsProvider';
import { NoPetsCard } from '@/modules/pets/ui/NoPetsCard';
import { PetOverview } from '@/modules/pets/ui/PetOverview';
import { PetSelector } from '@/modules/pets/ui/PetSelector';
import { LoadState } from '@/shared/ui/LoadState';
import { Screen } from '@/shared/ui/Screen';
import { SectionHeader } from '@/shared/ui/SectionHeader';

export function PetsScreen() {
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const { colors } = useAppearance();
  const { pets } = usePets();
  // The overview shows the pet's events too, so wait for both.
  const { loadStatus, retryLoad } = usePetsAndEventsLoad();
  const { addPet, editPet } = usePetProfileForms();
  const householdAlias = useHouseholdAlias();
  const title = householdAlias ? `Pets in ${householdAlias}` : 'Your pets';
  const selectedPet = pets.find((pet) => pet.id === petId) ?? pets[0];

  if (loadStatus !== 'ready') {
    return (
      <Screen>
        <LoadState status={loadStatus} onRetry={retryLoad} />
      </Screen>
    );
  }

  if (!selectedPet) {
    return (
      <Screen>
        <View style={styles.contentStack}>
          <SectionHeader compact title={title} />
          <NoPetsCard description="Add a pet to keep their profile, photo and health history together." />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <PetSelector
        title={title}
        pets={pets}
        selectedPetId={selectedPet.id}
        colors={colors}
        onSelectPet={(selectedPetId) => router.setParams({ petId: selectedPetId })}
        onEditPet={editPet}
        onAddPet={addPet}
      />
      <PetOverview pet={selectedPet} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentStack: { gap: 24 },
});
