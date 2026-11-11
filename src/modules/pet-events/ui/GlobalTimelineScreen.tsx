import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { usePetEventForms } from '@/modules/pet-events/state/PetEventFormsProvider';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { usePetsAndEventsLoad } from '@/modules/pet-events/state/usePetsAndEventsLoad';
import { toGlobalTimelineEntries } from '@/modules/pet-events/timeline/toTimelineEntries';
import { TimelineEvents } from '@/modules/pet-events/ui/TimelineEvents';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { NoPetsCard } from '@/modules/pets/ui/NoPetsCard';
import { Palette } from '@/shared/theme/palette';
import { LoadState } from '@/shared/ui/LoadState';
import { Screen } from '@/shared/ui/Screen';

export function GlobalTimelineScreen() {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { pets } = usePets();
  const { events, deletingEventId, updatingEventId } = usePetEvents();
  const { loadStatus, retryLoad } = usePetsAndEventsLoad();
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
