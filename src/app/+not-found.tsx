import { Link } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

export default function NotFoundRoute() {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Outside the tabs there is no app header, so this screen keeps clear of the status bar itself.
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Screen>
        <ScreenHeader title="Page not found" />
        <Link href="/">
          <Text style={styles.link}>Return to Today</Text>
        </Link>
      </Screen>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    link: { color: colors.text, fontSize: 16, fontWeight: '600', textDecorationLine: 'underline' },
  });
