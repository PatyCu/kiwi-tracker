import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';
import { BrandLogo } from '@/shared/ui/BrandLogo';

type HeaderAction = {
  accessibilityLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  action?: HeaderAction;
  showLogo?: boolean;
  onBack?: () => void;
};

export function ScreenHeader({ title, subtitle, action, showLogo, onBack }: ScreenHeaderProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      {onBack && (
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
      )}
      {showLogo && <BrandLogo />}
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {action && (
        <Pressable
          accessibilityLabel={action.accessibilityLabel}
          accessibilityRole="button"
          onPress={action.onPress}
          style={styles.action}
        >
          <Ionicons name={action.icon} size={25} color={colors.text} />
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
    copy: { flex: 1 },
    title: { color: colors.text, fontSize: 31, fontWeight: '800' },
    subtitle: { color: colors.muted, fontSize: 14, marginTop: 4 },
    backButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 21,
      backgroundColor: colors.surface2,
    },
    action: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 24,
      backgroundColor: colors.surface2,
    },
  });
