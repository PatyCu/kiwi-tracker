import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TimelineEntry } from '@/lib/healthEventPresentation';
import { Palette } from '@/lib/theme';

type TimelineEventsProps = {
  entries: TimelineEntry[];
  petName: string;
  colors: Palette;
};

export function TimelineEvents({ entries, petName, colors }: TimelineEventsProps) {
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
    />
  ));
}

type TimelineEventProps = {
  entry: TimelineEntry;
  showConnector: boolean;
  styles: ReturnType<typeof makeStyles>;
};

function TimelineEvent({ entry, showConnector, styles }: TimelineEventProps) {
  return (
    <View style={styles.event}>
      <View style={styles.rail}>
        <View style={[styles.dot, { borderColor: entry.color }]}>
          <Ionicons name={entry.icon} size={17} color={entry.color} />
        </View>
        {showConnector && <View style={styles.line} />}
      </View>
      <View style={styles.eventBody}>
        <Text style={styles.cardTitle}>{entry.title}</Text>
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
