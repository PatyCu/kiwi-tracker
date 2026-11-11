import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { useHouseholdAlias } from '@/modules/households/state/useHouseholdAlias';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { usePetProfileForms } from '@/modules/pets/state/PetProfileFormsProvider';
import { NoPetsCard } from '@/modules/pets/ui/NoPetsCard';
import { PetOverview } from '@/modules/pets/ui/PetOverview';
import { PetSelector } from '@/modules/pets/ui/PetSelector';
import { LoadError } from '@/shared/ui/LoadState';
import { Screen } from '@/shared/ui/Screen';
import { SectionHeader } from '@/shared/ui/SectionHeader';

export function PetsScreen() {
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const { colors } = useAppearance();
  const { pets, loadStatus, retryLoad } = usePets();
  const { addPet, editPet } = usePetProfileForms();
  const householdAlias = useHouseholdAlias();
  // Until the alias loads, or when the user has no household yet.
  const title = householdAlias ? `Pets in ${householdAlias}` : 'Your pets';
  const selectedPet = pets.find((pet) => pet.id === petId) ?? pets[0];

  if (loadStatus === 'error') {
    return (
      <Screen>
        <LoadError onRetry={retryLoad} />
      </Screen>
    );
  }

  // An empty screen while loading avoids showing "No pets yet" to a household with pets.
  if (loadStatus === 'loading') return <Screen>{null}</Screen>;

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
