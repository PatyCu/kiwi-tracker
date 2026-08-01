import { ReactNode, useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
};

export function Screen({ children, scroll = true }: ScreenProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const wide = useWindowDimensions().width > 780;
  const content = <View style={[styles.content, wide && styles.wideContent]}>{children}</View>;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    scrollContent: { flexGrow: 1, paddingBottom: 110 },
    content: { width: '100%', paddingHorizontal: 20, paddingTop: 18 },
    wideContent: { maxWidth: 920, alignSelf: 'center' },
  });
