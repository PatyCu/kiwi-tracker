import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { usePetEventForms } from '@/modules/pet-events/state/PetEventFormsProvider';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { toTimelineEntries } from '@/modules/pet-events/timeline/toTimelineEntries';
import { PetActivityCard } from '@/modules/pet-events/ui/PetActivityCard';
import { getPetStatus } from '@/modules/pet-status/calculatePetStatus';
import { PetStatusCard } from '@/modules/pet-status/ui/PetStatusCard';
import { Pet } from '@/modules/pets/model/Pet';
import { PetSectionLink } from '@/modules/pets/ui/PetSectionLink';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { PlaceholderCard } from '@/shared/ui/PlaceholderCard';
import { SectionHeader } from '@/shared/ui/SectionHeader';

type PetOverviewProps = {
  pet: Pet;
  onEditPet?: () => void;
};

export function PetOverview({ pet, onEditPet }: PetOverviewProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => StyleSheet.create({ summary: { gap: 12 } }), []);
  const { events, deletingEventId, updatingEventId } = usePetEvents();
  const forms = usePetEventForms();
  const now = new Date();
  const petEvents = events.filter((event) => event.petId === pet.id);
  const status = getPetStatus(petEvents, now);
  const entries = toTimelineEntries(
    petEvents,
    pet.id,
    colors.coral,
    colors.kiwi,
    colors.muted,
    now,
  );

  return (
    <>
      <View style={styles.summary}>
        {onEditPet && (
          <SectionHeader compact title="Overview" actionLabel="Edit pet" onAction={onEditPet} />
        )}
        <PetStatusCard pet={pet} status={status} wide={false} colors={colors} />
      </View>
      <SectionHeader title="Up next" />
      <PlaceholderCard
        title="No calendar events yet"
        description="Upcoming care will appear here when calendar events are implemented."
      />
      <PetActivityCard
        entries={entries}
        petName={pet.name}
        colors={colors}
        deletingEventId={deletingEventId}
        updatingEventId={updatingEventId}
        onLogSymptom={() => forms.openSymptom(pet.id)}
        onLogDietChange={() => forms.openDietChange(pet.id)}
        onLogOther={() => forms.openOtherEvent(pet.id)}
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
    </>
  );
}
