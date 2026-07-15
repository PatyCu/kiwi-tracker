import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/lib/theme';

type QuickLogProps = {
  colors: Palette;
  onLog: () => void;
};

export function QuickLog({ colors, onLog }: QuickLogProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const actions = [
    { icon: 'medical-outline', label: 'Symptom', color: colors.coral },
    { icon: 'restaurant-outline', label: 'Meal', color: colors.kiwi },
    { icon: 'walk-outline', label: 'Activity', color: colors.blue },
    { icon: 'water-outline', label: 'Medicine', color: colors.amber },
  ] as const;

  return (
    <>
      <Text style={styles.title}>Quick log</Text>
      <View style={styles.actions}>
        {actions.map((action) => (
          <Pressable key={action.label} onPress={onLog} style={styles.action}>
            <View style={[styles.icon, { backgroundColor: `${action.color}22` }]}>
              <Ionicons name={action.icon} size={23} color={action.color} />
            </View>
            <Text style={styles.label}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    title: { marginTop: 28, fontSize: 19, color: colors.text, fontWeight: '700' },
    actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
    action: { alignItems: 'center', gap: 8, width: '23%' },
    icon: {
      width: 56,
      height: 56,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  });
