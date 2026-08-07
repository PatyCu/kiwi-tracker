import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type TodayMetricsProps = { attention: number; updates: number };

export function TodayMetrics({ attention, updates }: TodayMetricsProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const compact = useWindowDimensions().width < 620;
  const metrics = [
    {
      label: 'Needs attention',
      detail: 'Recent activity',
      count: attention,
      icon: 'alert-circle-outline' as const,
      color: colors.coral,
    },
    {
      label: 'Upcoming',
      detail: 'Not available yet',
      count: 0,
      icon: 'time-outline' as const,
      color: colors.amber,
    },
    {
      label: 'Overdue',
      detail: 'Not available yet',
      count: 0,
      icon: 'calendar-outline' as const,
      color: colors.muted,
    },
    {
      label: 'Updates',
      detail: 'Last 24 hours',
      count: updates,
      icon: 'pulse-outline' as const,
      color: colors.blue,
    },
  ];
  return (
    <View style={styles.container}>
      {metrics.map((metric) => (
        <View key={metric.label} style={[styles.metric, compact && styles.compactMetric]}>
          <View style={[styles.icon, { backgroundColor: `${metric.color}20` }]}>
            <Ionicons name={metric.icon} size={22} color={metric.color} />
          </View>
          <Text style={styles.count}>{metric.count}</Text>
          <Text style={styles.label}>{metric.label}</Text>
          <Text style={styles.detail}>{metric.detail}</Text>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 22,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    metric: {
      width: '25%',
      minHeight: 150,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 14,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.line,
    },
    compactMetric: { width: '50%' },
    icon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    count: { color: colors.text, fontSize: 24, fontWeight: '800' },
    label: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 2,
    },
    detail: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 4 },
  });
