import { router, useLocalSearchParams } from 'expo-router';

import { usePetsAndEventsLoad } from '@/modules/pet-events/state/usePetsAndEventsLoad';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { usePetProfileForms } from '@/modules/pets/state/PetProfileFormsProvider';
import { PetOverview } from '@/modules/pets/ui/PetOverview';
import { LoadState } from '@/shared/ui/LoadState';
import { PlaceholderCard } from '@/shared/ui/PlaceholderCard';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

export function PetOverviewScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const { pets } = usePets();
  // The overview shows the pet's events too, so wait for both.
  const { loadStatus, retryLoad } = usePetsAndEventsLoad();
  const profiles = usePetProfileForms();
  const pet = pets.find((item) => item.id === petId);

  if (loadStatus !== 'ready')
    return (
      <Screen>
        <ScreenHeader title="Pet" onBack={() => router.back()} />
        <LoadState status={loadStatus} onRetry={retryLoad} />
      </Screen>
    );

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
