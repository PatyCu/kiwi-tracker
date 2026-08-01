import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { usePetEventForms } from '@/modules/pet-events/state/PetEventFormsProvider';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { toGlobalTimelineEntries } from '@/modules/pet-events/timeline/toTimelineEntries';
import { TimelineEvents } from '@/modules/pet-events/ui/TimelineEvents';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { Palette } from '@/shared/theme/palette';
import { LoadError } from '@/shared/ui/LoadState';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

export function GlobalTimelineScreen() {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { pets } = usePets();
  const { events, loadStatus, deletingEventId, updatingEventId, retryLoad } = usePetEvents();
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

  if (loadStatus === 'error')
    return (
      <Screen>
        <LoadError onRetry={() => void retryLoad()} />
      </Screen>
    );
  return (
    <Screen>
      <ScreenHeader showLogo title="Timeline" subtitle="All recorded activity across your pets." />
      <View style={styles.card}>
        <TimelineEvents
          entries={entries}
          petName="your pets"
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
