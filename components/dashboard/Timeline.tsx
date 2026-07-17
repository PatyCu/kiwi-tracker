import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { QuickLog } from '@/components/dashboard/QuickLog';
import { TimelineEvents } from '@/components/dashboard/TimelineEvents';
import { TimelineEntry } from '@/lib/healthEventPresentation';
import { Palette } from '@/lib/theme';

type TimelineProps = {
  entries: TimelineEntry[];
  petName: string;
  colors: Palette;
  onLog: () => void;
  onExport: () => void;
};

export function Timeline({ entries, petName, colors, onLog, onExport }: TimelineProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <QuickLog colors={colors} onLog={onLog} />
      <View style={styles.divider} />
      <View style={styles.header}>
        <Text style={styles.title}>Recent timeline</Text>
        <Pressable accessibilityRole="button" onPress={onExport}>
          <Text style={styles.link}>Export for vet</Text>
        </Pressable>
      </View>
      <TimelineEvents entries={entries} petName={petName} colors={colors} />
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
