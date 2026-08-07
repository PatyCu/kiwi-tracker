import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';
import { BrandLogo } from '@/shared/ui/BrandLogo';

type AppIdentityProps = {
  compact?: boolean;
};

export function AppIdentity({ compact = false }: AppIdentityProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View accessibilityLabel="Kiwi Tracker" style={styles.container}>
      <BrandLogo size={compact ? 44 : 48} />
      <Text style={[styles.name, compact && styles.compactName]}>Kiwi Tracker</Text>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    name: { color: colors.text, fontSize: 24, fontWeight: '800' },
    compactName: { fontSize: 22 },
  });
