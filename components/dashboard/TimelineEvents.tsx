import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TimelineEntry } from '@/lib/healthEventPresentation';
import { Palette } from '@/lib/theme';

type TimelineEventsProps = {
  entries: TimelineEntry[];
  petName: string;
  colors: Palette;
  deletingEventId: string | null;
  onDelete: (entry: TimelineEntry) => void;
};

export function TimelineEvents({
  entries,
  petName,
  colors,
  deletingEventId,
  onDelete,
}: TimelineEventsProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="journal-outline" size={25} color={colors.muted} />
        <Text style={styles.emptyTitle}>No events for {petName}</Text>
        <Text style={styles.emptyBody}>Use an add button above to log the first observation.</Text>
      </View>
    );
  }

  return entries.map((entry, index) => (
    <TimelineEvent
      key={entry.id}
      entry={entry}
      showConnector={index < entries.length - 1}
      styles={styles}
      deleteColor={colors.muted}
      deleteDisabled={deletingEventId !== null}
      onDelete={onDelete}
    />
  ));
}

type TimelineEventProps = {
  entry: TimelineEntry;
  showConnector: boolean;
  styles: ReturnType<typeof makeStyles>;
  deleteColor: string;
  deleteDisabled: boolean;
  onDelete: (entry: TimelineEntry) => void;
};

function TimelineEvent({
  entry,
  showConnector,
  styles,
  deleteColor,
  deleteDisabled,
  onDelete,
}: TimelineEventProps) {
  return (
    <View style={styles.event}>
      <View style={styles.rail}>
        <View style={[styles.dot, { borderColor: entry.color }]}>
          <Ionicons name={entry.icon} size={17} color={entry.color} />
        </View>
        {showConnector && <View style={styles.line} />}
      </View>
      <View style={styles.eventBody}>
        <View style={styles.eventTitleRow}>
          <Text style={styles.cardTitle}>{entry.title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete timeline event: ${entry.title}, ${entry.meta}`}
            accessibilityHint="Asks for confirmation before permanently deleting this event."
            accessibilityState={{ disabled: deleteDisabled }}
            disabled={deleteDisabled}
            hitSlop={12}
            onPress={() => onDelete(entry)}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
              deleteDisabled && styles.deleteButtonDisabled,
            ]}
          >
            <Ionicons name="trash-outline" size={14} color={deleteColor} />
          </Pressable>
        </View>
        <Text style={styles.meta}>{entry.meta}</Text>
        <Text style={styles.note}>{entry.note}</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    event: { flexDirection: 'row', minHeight: 94 },
    rail: { width: 45, alignItems: 'center' },
    dot: {
      width: 37,
      height: 37,
      borderRadius: 19,
      borderWidth: 1.5,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    line: { width: 1, backgroundColor: colors.line, flex: 1 },
    eventBody: { flex: 1, paddingLeft: 10, paddingBottom: 23 },
    eventTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
    },
    deleteButton: {
      width: 24,
      height: 24,
      marginLeft: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonPressed: { backgroundColor: colors.surface2 },
    deleteButtonDisabled: { opacity: 0.45 },
    cardTitle: { fontSize: 15, color: colors.text, fontWeight: '700' },
    meta: { fontSize: 12, color: colors.muted, marginTop: 5 },
    note: { fontSize: 13, color: colors.note, marginTop: 8, lineHeight: 18 },
    empty: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.line,
      borderRadius: 18,
      padding: 22,
      alignItems: 'center',
      gap: 7,
    },
    emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
    emptyBody: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  });
