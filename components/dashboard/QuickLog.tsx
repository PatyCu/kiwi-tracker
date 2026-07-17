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
    <View style={styles.actions}>
      {actions.map((action) => (
        <Pressable
          accessibilityLabel={`Add ${action.label.toLowerCase()} to timeline`}
          accessibilityRole="button"
          key={action.label}
          onPress={onLog}
          style={styles.action}
        >
          <View style={[styles.icon, { backgroundColor: `${action.color}22` }]}>
            <Ionicons name={action.icon} size={23} color={action.color} />
            <View style={[styles.addBadge, { backgroundColor: action.color }]}>
              <Ionicons name="add" size={12} color={colors.ink} />
            </View>
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    actions: { flexDirection: 'row', justifyContent: 'space-between' },
    action: { alignItems: 'center', gap: 8, width: '23%' },
    icon: {
      width: 56,
      height: 56,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  });
