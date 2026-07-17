import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { Palette } from '@/lib/theme';

type DashboardHeaderProps = {
  isDark: boolean;
  colors: Palette;
  onOpenAppearance: () => void;
};

export function DashboardHeader({ isDark, colors, onOpenAppearance }: DashboardHeaderProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <BrandLogo size={52} />
        <View>
          <Text style={styles.eyebrow}>KIWI TRACKER</Text>
          <Text style={styles.greeting}>Good morning, Alex</Text>
        </View>
      </View>
      <Pressable
        accessibilityLabel="Appearance settings"
        accessibilityRole="button"
        onPress={onOpenAppearance}
        style={styles.appearanceButton}
      >
        <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={19} color={colors.text} />
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    header: {
      height: 82,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    eyebrow: { fontSize: 10, letterSpacing: 2, color: colors.kiwi, fontWeight: '800' },
    greeting: { fontSize: 17, color: colors.text, fontWeight: '700', marginTop: 3 },
    appearanceButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
