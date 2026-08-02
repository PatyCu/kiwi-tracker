import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TimelineEntry } from '@/modules/pet-events/timeline/toTimelineEntries';
import { QuickLogCard } from '@/modules/pet-events/ui/QuickLogCard';
import { TimelineEvents } from '@/modules/pet-events/ui/TimelineEvents';
import { Palette } from '@/shared/theme/palette';
import { SectionHeader } from '@/shared/ui/SectionHeader';

type PetActivityCardProps = {
  entries: TimelineEntry[];
  petName: string;
  colors: Palette;
  deletingEventId: string | null;
  updatingEventId: string | null;
  onLogSymptom: () => void;
  onLogDietChange: () => void;
  onLogOther: () => void;
  onDelete: (entry: TimelineEntry) => void;
  onEditDateTime: (entry: TimelineEntry) => void;
  onOpen?: (entry: TimelineEntry) => void;
};

export function PetActivityCard({
  entries,
  petName,
  colors,
  deletingEventId,
  updatingEventId,
  onLogSymptom,
  onLogDietChange,
  onLogOther,
  onDelete,
  onEditDateTime,
  onOpen,
}: PetActivityCardProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card} testID="pet-activity-card">
      <SectionHeader compact title="Add event" />
      <View style={styles.quickLog}>
        <QuickLogCard
          variant="embedded"
          colors={colors}
          onLogSymptom={onLogSymptom}
          onLogDietChange={onLogDietChange}
          onLogOther={onLogOther}
        />
      </View>
      <View style={styles.separator} />
      <View style={styles.timelineHeader}>
        <Text style={styles.timelineTitle}>Recent timeline</Text>
        <Text accessibilityState={{ disabled: true }} style={styles.placeholderLink}>
          Export for vet · Coming soon
        </Text>
      </View>
      <TimelineEvents
        entries={entries}
        petName={petName}
        colors={colors}
        deletingEventId={deletingEventId}
        updatingEventId={updatingEventId}
        onDelete={onDelete}
        onEditDateTime={onEditDateTime}
        onOpen={onOpen}
      />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      marginTop: 28,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 24,
      backgroundColor: colors.surface,
    },
    quickLog: { marginTop: 18 },
    separator: { height: 1, marginVertical: 22, backgroundColor: colors.line },
    timelineHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18,
    },
    timelineTitle: { color: colors.text, fontSize: 19, fontWeight: '800' },
    placeholderLink: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  });
