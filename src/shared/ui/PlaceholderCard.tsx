import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type PlaceholderCardProps = {
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function PlaceholderCard({
  title,
  description,
  icon = 'calendar-outline',
}: PlaceholderCardProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={22} color={colors.muted} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    icon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface2,
    },
    copy: { flex: 1 },
    title: { color: colors.text, fontSize: 15, fontWeight: '700' },
    description: { color: colors.muted, fontSize: 12, marginTop: 4 },
  });
