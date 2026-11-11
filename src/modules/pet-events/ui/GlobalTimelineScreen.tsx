import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { usePetEventForms } from '@/modules/pet-events/state/PetEventFormsProvider';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { toGlobalTimelineEntries } from '@/modules/pet-events/timeline/toTimelineEntries';
import { TimelineEvents } from '@/modules/pet-events/ui/TimelineEvents';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { NoPetsCard } from '@/modules/pets/ui/NoPetsCard';
import { Palette } from '@/shared/theme/palette';
import { LoadError } from '@/shared/ui/LoadState';
import { Screen } from '@/shared/ui/Screen';

export function GlobalTimelineScreen() {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { pets, loadStatus: petsStatus, retryLoad: retryPets } = usePets();
  const {
    events,
    loadStatus: eventsStatus,
    deletingEventId,
    updatingEventId,
    retryLoad: retryEvents,
  } = usePetEvents();
  const forms = usePetEventForms();
  const now = new Date();
  const entries = toGlobalTimelineEntries(
    events,
    pets,
    colors.coral,
    colors.kiwi,
    colors.muted,
    now,
  );

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
        <NoPetsCard description="Add a pet to start a timeline of their symptoms, diet changes and other events." />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.card}>
        <TimelineEvents
          entries={entries}
          petName="your pets"
          emptyHint="Log the first observation from Today or from a pet's page."
          colors={colors}
          deletingEventId={deletingEventId}
          updatingEventId={updatingEventId}
          onDelete={(entry) => forms.requestDeleteEvent(entry, entry.petName ?? 'this pet')}
          onEditDateTime={forms.editEventDateTime}
          onOpen={(entry) =>
            router.push({
              pathname: '/pets/[petId]/records/[recordId]',
              params: { petId: entry.petId, recordId: entry.id },
            })
          }
        />
      </View>
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      padding: 18,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 22,
      backgroundColor: colors.surface,
    },
  });
