import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type PetSectionLinkProps = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export function PetSectionLink({ label, description, icon, onPress }: PetSectionLinkProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <Ionicons name={icon} size={23} color={colors.kiwi} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.description}>{description}</Text>
      <Ionicons name="chevron-forward" size={19} color={colors.muted} />
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 18,
      backgroundColor: colors.surface,
      marginBottom: 9,
    },
    label: { color: colors.text, fontSize: 15, fontWeight: '800' },
    description: { flex: 1, color: colors.muted, fontSize: 12 },
  });
