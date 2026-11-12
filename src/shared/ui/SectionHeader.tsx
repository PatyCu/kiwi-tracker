import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type SectionAction = {
  /** Short visible label, such as "Schedule". */
  label: string;
  /** What screen readers announce; it should contain the visible label. */
  accessibilityLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type SectionHeaderProps = {
  title: string;
  action?: SectionAction;
  compact?: boolean;
};

export function SectionHeader({ title, action, compact }: SectionHeaderProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.header, compact && styles.compactHeader]}>
      <Text style={styles.title}>{title}</Text>
      {action && (
        <Pressable
          accessibilityLabel={action.accessibilityLabel}
          accessibilityRole="button"
          // Keeps a 44pt touch target around the smaller pill.
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          onPress={action.onPress}
          style={({ pressed }) => [styles.action, pressed && styles.pressedAction]}
        >
          <Ionicons name={action.icon} size={16} color={colors.kiwi} />
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 28,
      marginBottom: 12,
    },
    compactHeader: { marginTop: 0, marginBottom: 0 },
    title: { flexShrink: 1, color: colors.text, fontSize: 19, fontWeight: '800' },
    action: {
      minHeight: 32,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingLeft: 10,
      paddingRight: 13,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.kiwi,
      backgroundColor: `${colors.kiwi}12`,
    },
    pressedAction: { opacity: 0.7 },
    actionText: { color: colors.kiwi, fontSize: 13, fontWeight: '700' },
  });
