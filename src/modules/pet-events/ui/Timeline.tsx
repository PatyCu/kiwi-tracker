import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TimelineEntry } from '@/modules/pet-events/timeline/toTimelineEntries';
import { TimelineEvents } from '@/modules/pet-events/ui/TimelineEvents';
import { Palette } from '@/shared/theme/palette';

type TimelineProps = {
  entries: TimelineEntry[];
  petName: string;
  colors: Palette;
  deletingEventId: string | null;
  updatingEventId: string | null;
  onDelete: (entry: TimelineEntry) => void;
  onEditDateTime: (entry: TimelineEntry) => void;
  onOpen?: (entry: TimelineEntry) => void;
};

export function Timeline({
  entries,
  petName,
  colors,
  deletingEventId,
  updatingEventId,
  onDelete,
  onEditDateTime,
  onOpen,
}: TimelineProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent timeline</Text>
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
    container: {
      marginTop: 28,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 24,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 18,
    },
    title: { fontSize: 19, color: colors.text, fontWeight: '700' },
    placeholderLink: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  });
