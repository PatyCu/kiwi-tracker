import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { useHouseholdAlias } from '@/modules/households/state/useHouseholdAlias';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { usePetProfileForms } from '@/modules/pets/state/PetProfileFormsProvider';
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
  const { addPet } = usePetProfileForms();
  const householdAlias = useHouseholdAlias();

  if (petsStatus === 'error' || eventsStatus === 'error') {
    return (
      <Screen>
        <LoadError
          onRetry={() => {
            retryPets();
            retryEvents();
          }}
        />
      </Screen>
    );
  }

  // Until both have loaded, an empty screen avoids showing "No pets yet" to a household with pets.
  if (petsStatus === 'loading' || eventsStatus === 'loading') return <Screen>{null}</Screen>;

  if (pets.length === 0) {
    return (
      <Screen>
        <SectionHeader
          compact
          title={householdAlias ? `Today in ${householdAlias}` : 'Today'}
          actionLabel="Add pet"
          onAction={addPet}
        />
        <PlaceholderCard
          title="No pets yet"
          description="Add a pet to start tracking their care."
          icon="paw-outline"
        />
      </Screen>
    );
  }

  const viewModel = buildTodayViewModel(pets, events, new Date(), householdAlias);

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
