import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { buildTodayViewModel } from '@/modules/today/buildTodayViewModel';
import { TodayCard } from '@/modules/today/ui/TodayCard';
import { TodayQuickLogCard } from '@/modules/today/ui/TodayQuickLogCard';
import { LoadError } from '@/shared/ui/LoadState';
import { PlaceholderCard } from '@/shared/ui/PlaceholderCard';
import { Screen } from '@/shared/ui/Screen';
import { SectionHeader } from '@/shared/ui/SectionHeader';

export function TodayScreen() {
  const { colors } = useAppearance();
  const { pets, loadStatus: petsStatus, retryLoad: retryPets } = usePets();
  const { events, loadStatus: eventsStatus, retryLoad: retryEvents } = usePetEvents();
  const now = new Date();
  const viewModel = buildTodayViewModel(pets, events, now);

  if (petsStatus === 'error' || eventsStatus === 'error') {
    return (
      <Screen>
        <LoadError onRetry={() => void Promise.all([retryPets(), retryEvents()])} />
      </Screen>
    );
  }

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
          <PlaceholderCard
            title="No calendar events yet"
            description="Upcoming care will appear here when calendar events are implemented."
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
