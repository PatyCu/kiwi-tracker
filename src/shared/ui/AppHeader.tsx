import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';
import { AppIdentity } from '@/shared/ui/AppIdentity';

export function AppHeader() {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <AppIdentity compact />
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safeArea: {
      minHeight: 72,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
  });
