import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { toUpcomingCareItems } from '@/modules/calendar/upcomingCare';
import { UpcomingCareList } from '@/modules/calendar/ui/UpcomingCareList';
import { useCalendarEvents } from '@/modules/calendar-events/state/CalendarEventsProvider';
import { useCalendarEventForms } from '@/modules/calendar-events/state/CalendarEventFormsProvider';
import { usePetEventForms } from '@/modules/pet-events/state/PetEventFormsProvider';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { toTimelineEntries } from '@/modules/pet-events/timeline/toTimelineEntries';
import { PetActivityCard } from '@/modules/pet-events/ui/PetActivityCard';
import { getPetStatus } from '@/modules/pet-status/calculatePetStatus';
import { PetStatusCard } from '@/modules/pet-status/ui/PetStatusCard';
import { Pet } from '@/modules/pets/model/Pet';
import { PetSectionLink } from '@/modules/pets/ui/PetSectionLink';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { SectionHeader } from '@/shared/ui/SectionHeader';

type PetOverviewProps = {
  pet: Pet;
};

export function PetOverview({ pet }: PetOverviewProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => StyleSheet.create({ summary: { gap: 12 } }), []);
  const { events, deletingEventId, updatingEventId } = usePetEvents();
  const forms = usePetEventForms();
  const calendarEventForms = useCalendarEventForms();
  const { calendarEvents } = useCalendarEvents();
  const now = new Date();
  const petEvents = events.filter((event) => event.petId === pet.id);
  const status = getPetStatus(petEvents, now);
  const upcomingCare = toUpcomingCareItems(calendarEvents, [pet], colors.blue, now, pet.id);
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
        <SectionHeader compact title="Overview" />
        <PetStatusCard pet={pet} status={status} wide={false} colors={colors} />
      </View>
      <SectionHeader
        title="Up next"
        action={{
          label: 'Schedule',
          accessibilityLabel: 'Schedule calendar event',
          icon: 'add',
          onPress: () => calendarEventForms.openAddCalendarEvent(pet.id),
        }}
      />
      <UpcomingCareList items={upcomingCare} now={now} showPetNames={false} emptyFor={pet.name} />
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
        label="Calendar"
        description="See everything logged and scheduled"
        icon="calendar-outline"
        onPress={() => router.navigate({ pathname: '/calendar', params: { petIds: pet.id } })}
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
