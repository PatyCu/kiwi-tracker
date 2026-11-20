import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { useCalendarDataLoad } from '@/modules/calendar/useCalendarDataLoad';
import { UpcomingCareList } from '@/modules/calendar/ui/UpcomingCareList';
import { useCalendarEvents } from '@/modules/calendar-events/state/CalendarEventsProvider';
import { useHouseholdAlias } from '@/modules/households/state/useHouseholdAlias';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { NoPetsCard } from '@/modules/pets/ui/NoPetsCard';
import { buildTodayViewModel } from '@/modules/today/buildTodayViewModel';
import { TodayCard } from '@/modules/today/ui/TodayCard';
import { TodayQuickLogCard } from '@/modules/today/ui/TodayQuickLogCard';
import { LoadState } from '@/shared/ui/LoadState';
import { PlaceholderCard } from '@/shared/ui/PlaceholderCard';
import { Screen } from '@/shared/ui/Screen';
import { SectionHeader } from '@/shared/ui/SectionHeader';

export function TodayScreen() {
  const { colors } = useAppearance();
  const { pets } = usePets();
  const { events } = usePetEvents();
  const { calendarEvents } = useCalendarEvents();
  const { loadStatus, retryLoad } = useCalendarDataLoad();
  const householdAlias = useHouseholdAlias();

  if (loadStatus !== 'ready') {
    return (
      <Screen>
        <LoadState status={loadStatus} onRetry={retryLoad} />
      </Screen>
    );
  }

  if (pets.length === 0) {
    return (
      <Screen>
        <View style={styles.contentStack}>
          <SectionHeader compact title={householdAlias ? `Today in ${householdAlias}` : 'Today'} />
          <NoPetsCard description="Add a pet to see how they're doing today and log what happens." />
        </View>
      </Screen>
    );
  }

  const now = new Date();
  const viewModel = buildTodayViewModel(
    pets,
    events,
    calendarEvents,
    now,
    householdAlias,
    colors.blue,
  );

  return (
    <Screen>
      <View style={styles.contentStack}>
        <TodayCard
          summary={viewModel.statusSummary}
          insights={viewModel.insights}
          colors={colors}
          onOpenPet={(pet) =>
            router.push({
              pathname: '/pets',
              params: { petId: pet.id },
            })
          }
        />
        <View style={styles.section}>
          <SectionHeader compact title="Upcoming (next 7 days)" />
          <UpcomingCareList
            items={viewModel.upcomingCare}
            now={now}
            showPetNames={pets.length > 1}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader compact title="Overdue" />
          <PlaceholderCard
            title="No overdue items"
            description="Overdue care will appear here when calendar events are implemented."
          />
        </View>

        <View style={styles.section}>
          <SectionHeader compact title="Add event" />
          <TodayQuickLogCard pets={pets} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentStack: { gap: 24 },
  section: { gap: 12 },
});
