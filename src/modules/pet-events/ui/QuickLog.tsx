import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/shared/theme/palette';

type QuickLogProps = {
  colors: Palette;
  onLogSymptom: () => void;
  onLogDietChange: () => void;
  onLogOther: () => void;
};

export function QuickLog({ colors, onLogSymptom, onLogDietChange, onLogOther }: QuickLogProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const actions: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    color: string;
    onPress?: () => void;
  }[] = [
    {
      icon: 'restaurant-outline',
      label: 'Diet change',
      color: colors.kiwi,
      onPress: onLogDietChange,
    },
    { icon: 'home-outline', label: 'Environment', color: colors.blue },
    { icon: 'pulse-outline', label: 'Symptom', color: colors.coral, onPress: onLogSymptom },
    { icon: 'medkit-outline', label: 'Treatment', color: colors.amber },
    {
      icon: 'ellipsis-horizontal-circle-outline',
      label: 'Other',
      color: colors.muted,
      onPress: onLogOther,
    },
  ];

  return (
    <View style={styles.actions}>
      {actions.map((action) => (
        <Pressable
          accessibilityLabel={`Add ${action.label.toLowerCase()} to timeline`}
          accessibilityRole="button"
          disabled={!action.onPress}
          key={action.label}
          onPress={action.onPress}
          style={[styles.action, !action.onPress && styles.disabledAction]}
        >
          <View style={[styles.icon, { backgroundColor: `${action.color}22` }]}>
            <Ionicons name={action.icon} size={23} color={action.color} />
            <View style={[styles.addBadge, { backgroundColor: action.color }]}>
              <Ionicons name="add" size={12} color={colors.ink} />
            </View>
          </View>
          <Text numberOfLines={1} style={styles.label}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    actions: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    action: { flex: 1, minWidth: 0, alignItems: 'center', gap: 8 },
    disabledAction: { opacity: 0.5 },
    icon: {
      width: 50,
      height: 50,
      borderRadius: 16,
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
    label: {
      width: '100%',
      color: colors.muted,
      fontSize: 9,
      fontWeight: '600',
      textAlign: 'center',
    },
  });
