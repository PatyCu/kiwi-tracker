import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { usePetEventForms } from '@/modules/pet-events/state/PetEventFormsProvider';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { toTimelineEntries } from '@/modules/pet-events/timeline/toTimelineEntries';
import { Timeline } from '@/modules/pet-events/ui/Timeline';
import { QuickLogCard } from '@/modules/pet-events/ui/QuickLogCard';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { PlaceholderCard } from '@/shared/ui/PlaceholderCard';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { SectionHeader } from '@/shared/ui/SectionHeader';

export function PetTimelineScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const { colors } = useAppearance();
  const { pets } = usePets();
  const { events, deletingEventId, updatingEventId } = usePetEvents();
  const forms = usePetEventForms();
  const pet = pets.find((item) => item.id === petId);
  if (!pet)
    return (
      <Screen>
        <ScreenHeader title="Pet not found" onBack={() => router.back()} />
        <PlaceholderCard
          title="This pet is unavailable"
          description="It may have been removed from this device."
        />
      </Screen>
    );
  const entries = toTimelineEntries(
    events,
    pet.id,
    colors.coral,
    colors.kiwi,
    colors.muted,
    new Date(),
  );
  return (
    <Screen>
      <ScreenHeader
        title={`${pet.name}’s timeline`}
        subtitle="Complete recorded history."
        onBack={() => router.back()}
      />
      <View style={{ gap: 12 }}>
        <SectionHeader compact title="Add event" />
        <QuickLogCard
          colors={colors}
          onLogSymptom={() => forms.openSymptom(pet.id)}
          onLogDietChange={() => forms.openDietChange(pet.id)}
          onLogOther={() => forms.openOtherEvent(pet.id)}
        />
      </View>
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
    </Screen>
  );
}
