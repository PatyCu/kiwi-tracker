import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { QuickLog } from '@/components/dashboard/QuickLog';
import { TimelineEvents } from '@/components/dashboard/TimelineEvents';
import { TimelineEntry } from '@/lib/timelineEventPresentation';
import { Palette } from '@/lib/theme';

type TimelineProps = {
  entries: TimelineEntry[];
  petName: string;
  colors: Palette;
  deletingEventId: string | null;
  updatingEventId: string | null;
  onLogSymptom: () => void;
  onLogDietChange: () => void;
  onLogOther: () => void;
  onExport: () => void;
  onDelete: (entry: TimelineEntry) => void;
  onEditDateTime: (entry: TimelineEntry) => void;
};

export function Timeline({
  entries,
  petName,
  colors,
  deletingEventId,
  updatingEventId,
  onLogSymptom,
  onLogDietChange,
  onLogOther,
  onExport,
  onDelete,
  onEditDateTime,
}: TimelineProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <QuickLog
        colors={colors}
        onLogSymptom={onLogSymptom}
        onLogDietChange={onLogDietChange}
        onLogOther={onLogOther}
      />
      <View style={styles.divider} />
      <View style={styles.header}>
        <Text style={styles.title}>Recent timeline</Text>
        <Pressable accessibilityRole="button" onPress={onExport}>
          <Text style={styles.link}>Export for vet</Text>
        </Pressable>
      </View>
      <TimelineEvents
        entries={entries}
        petName={petName}
        colors={colors}
        deletingEventId={deletingEventId}
        updatingEventId={updatingEventId}
        onDelete={onDelete}
        onEditDateTime={onEditDateTime}
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
    link: { fontSize: 13, color: colors.kiwi, fontWeight: '700' },
    divider: { height: 1, backgroundColor: colors.line, marginVertical: 20 },
  });
