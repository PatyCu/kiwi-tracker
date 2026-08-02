import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function SectionHeader({ title, actionLabel, onAction, compact }: SectionHeaderProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.header, compact && styles.compactHeader]}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction && (
        <Pressable accessibilityLabel={actionLabel} accessibilityRole="button" onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
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
      marginTop: 28,
      marginBottom: 12,
    },
    compactHeader: { marginTop: 0, marginBottom: 0 },
    title: { color: colors.text, fontSize: 19, fontWeight: '800' },
    action: { color: colors.kiwi, fontSize: 13, fontWeight: '700' },
  });
