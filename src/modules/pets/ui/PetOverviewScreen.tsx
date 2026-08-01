import { router, useLocalSearchParams } from 'expo-router';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { usePetEventForms } from '@/modules/pet-events/state/PetEventFormsProvider';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { toTimelineEntries } from '@/modules/pet-events/timeline/toTimelineEntries';
import { Timeline } from '@/modules/pet-events/ui/Timeline';
import { QuickLogCard } from '@/modules/pet-events/ui/QuickLogCard';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { usePetProfileForms } from '@/modules/pets/state/PetProfileFormsProvider';
import { PetSectionLink } from '@/modules/pets/ui/PetSectionLink';
import { getPetStatus } from '@/modules/pet-status/calculatePetStatus';
import { PetStatusCard } from '@/modules/pet-status/ui/PetStatusCard';
import { PlaceholderCard } from '@/shared/ui/PlaceholderCard';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { SectionHeader } from '@/shared/ui/SectionHeader';

export function PetOverviewScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const { colors } = useAppearance();
  const { pets } = usePets();
  const { events, deletingEventId, updatingEventId } = usePetEvents();
  const forms = usePetEventForms();
  const profiles = usePetProfileForms();
  const pet = pets.find((item) => item.id === petId);
  const now = new Date();
  const entries = pet
    ? toTimelineEntries(events, pet.id, colors.coral, colors.kiwi, colors.muted, now).slice(0, 3)
    : [];

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
  const status = getPetStatus(
    events.filter((event) => event.petId === pet.id),
    now,
  );
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
      <PetStatusCard pet={pet} status={status} wide={false} colors={colors} />
      <SectionHeader title="Up next" />
      <PlaceholderCard
        title="No calendar events yet"
        description="Upcoming care will appear here when calendar events are implemented."
      />
      <SectionHeader title="Add event" />
      <QuickLogCard
        colors={colors}
        onLogSymptom={() => forms.openSymptom(pet.id)}
        onLogDietChange={() => forms.openDietChange(pet.id)}
        onLogOther={() => forms.openOtherEvent(pet.id)}
      />
      <Timeline
        entries={entries}
        petName={pet.name}
        colors={colors}
        deletingEventId={deletingEventId}
        updatingEventId={updatingEventId}
        onDelete={(entry) => forms.requestDeleteEvent(entry, pet.name)}
        onEditDateTime={forms.editEventDateTime}
        onOpen={(entry) =>
          router.push({
            pathname: '/pets/[petId]/records/[recordId]',
            params: { petId: pet.id, recordId: entry.id },
          })
        }
      />
      <SectionHeader title="More" />
      <PetSectionLink
        label="Timeline"
        description="See the complete history"
        icon="time-outline"
        onPress={() =>
          router.push({ pathname: '/pets/[petId]/timeline', params: { petId: pet.id } })
        }
      />
      <PetSectionLink
        label="Care"
        description="Placeholder until care is implemented"
        icon="medkit-outline"
        onPress={() => router.push({ pathname: '/pets/[petId]/care', params: { petId: pet.id } })}
      />
      <PetSectionLink
        label="Profile"
        description="View and edit pet details"
        icon="paw-outline"
        onPress={() =>
          router.push({ pathname: '/pets/[petId]/profile', params: { petId: pet.id } })
        }
      />
    </Screen>
  );
}
