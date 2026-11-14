import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { TimelineEntry } from '@/modules/pet-events/timeline/toTimelineEntries';
import { Palette } from '@/shared/theme/palette';

type TimelineEventsProps = {
  entries: TimelineEntry[];
  petName: string;
  /** Where to log the first event, shown when there are none. */
  emptyHint?: string;
  colors: Palette;
  deletingEventId: string | null;
  updatingEventId: string | null;
  onDelete: (entry: TimelineEntry) => void;
  onEditDateTime: (entry: TimelineEntry) => void;
  onOpen?: (entry: TimelineEntry) => void;
};

export function TimelineEvents({
  entries,
  petName,
  emptyHint = 'Use an add button above to log the first observation.',
  colors,
  deletingEventId,
  updatingEventId,
  onDelete,
  onEditDateTime,
  onOpen,
}: TimelineEventsProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="journal-outline" size={25} color={colors.muted} />
        <Text style={styles.emptyTitle}>No events for {petName}</Text>
        <Text style={styles.emptyBody}>{emptyHint}</Text>
      </View>
    );
  }

  return entries.map((entry, index) => (
    <TimelineRow
      key={entry.id}
      entry={entry}
      showConnector={index < entries.length - 1}
      styles={styles}
      deleteColor={colors.muted}
      actionsDisabled={deletingEventId !== null || updatingEventId !== null}
      onDelete={onDelete}
      onEditDateTime={onEditDateTime}
      onOpen={onOpen}
    />
  ));
}

type TimelineRowProps = {
  entry: TimelineEntry;
  showConnector: boolean;
  styles: ReturnType<typeof makeStyles>;
  deleteColor: string;
  actionsDisabled: boolean;
  onDelete: (entry: TimelineEntry) => void;
  onEditDateTime: (entry: TimelineEntry) => void;
  onOpen?: (entry: TimelineEntry) => void;
};

function TimelineRow({
  entry,
  showConnector,
  styles,
  deleteColor,
  actionsDisabled,
  onDelete,
  onEditDateTime,
  onOpen,
}: TimelineRowProps) {
  const [metaActive, setMetaActive] = useState(false);
  const editIconVisible = Platform.OS !== 'web' || metaActive;

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
          <Pressable
            accessibilityRole={onOpen ? 'button' : undefined}
            onPress={onOpen ? () => onOpen(entry) : undefined}
          >
            <Text style={styles.cardTitle}>{entry.title}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete timeline event: ${entry.title}, ${entry.meta}`}
            accessibilityHint="Asks for confirmation before permanently deleting this event."
            disabled={actionsDisabled}
            hitSlop={12}
            onPress={() => onDelete(entry)}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
              actionsDisabled && styles.deleteButtonDisabled,
            ]}
          >
            <Ionicons name="trash-outline" size={14} color={deleteColor} />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit date and time for ${entry.title}, currently ${entry.meta}`}
          accessibilityHint="Opens a form to change when this event occurred."
          disabled={actionsDisabled}
          hitSlop={8}
          onBlur={() => setMetaActive(false)}
          onFocus={() => setMetaActive(true)}
          onHoverIn={() => setMetaActive(true)}
          onHoverOut={() => setMetaActive(false)}
          onPress={() => onEditDateTime(entry)}
          testID={`timeline-event-meta-${entry.id}`}
          style={({ pressed }) => [
            styles.metaButton,
            pressed && styles.metaButtonPressed,
            actionsDisabled && styles.metaButtonDisabled,
          ]}
        >
          <Text
            testID={`timeline-event-meta-text-${entry.id}`}
            style={[styles.meta, metaActive && styles.activeMeta]}
          >
            {entry.meta}
          </Text>
          <View
            testID={`timeline-event-edit-icon-${entry.id}`}
            style={[styles.editIcon, !editIconVisible && styles.hiddenEditIcon]}
          >
            <Ionicons name="pencil-outline" size={11} color={deleteColor} />
          </View>
        </Pressable>
        {entry.note && <Text style={styles.note}>{entry.note}</Text>}
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
    metaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      borderRadius: 6,
      marginTop: 3,
      marginLeft: -4,
      paddingHorizontal: 4,
      minHeight: 24,
    },
    metaButtonPressed: { backgroundColor: colors.surface2 },
    metaButtonDisabled: { opacity: 0.45 },
    meta: { fontSize: 12, color: colors.muted },
    activeMeta: { textDecorationLine: 'underline' },
    editIcon: { width: 16, marginLeft: 3, alignItems: 'center' },
    hiddenEditIcon: { opacity: 0 },
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
