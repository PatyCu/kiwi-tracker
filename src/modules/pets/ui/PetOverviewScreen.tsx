import { router, useLocalSearchParams } from 'expo-router';

import { usePets } from '@/modules/pets/state/PetsProvider';
import { usePetProfileForms } from '@/modules/pets/state/PetProfileFormsProvider';
import { PetOverview } from '@/modules/pets/ui/PetOverview';
import { PlaceholderCard } from '@/shared/ui/PlaceholderCard';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

export function PetOverviewScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const { pets } = usePets();
  const profiles = usePetProfileForms();
  const pet = pets.find((item) => item.id === petId);

  if (!pet) {
    return (
      <Screen>
        <ScreenHeader title="Pet not found" onBack={() => router.back()} />
        <PlaceholderCard
          title="This pet is unavailable"
          description="It may have been removed from this device."
          icon="alert-circle-outline"
        />
      </Screen>
    );
  }
  return (
    <Screen>
      <ScreenHeader
        title={pet.name}
        subtitle={pet.breed || pet.species}
        onBack={() => router.back()}
        action={{
          accessibilityLabel: `Edit ${pet.name}`,
          icon: 'create-outline',
          onPress: () => profiles.editPet(pet),
        }}
      />
      <PetOverview pet={pet} />
    </Screen>
  );
}
