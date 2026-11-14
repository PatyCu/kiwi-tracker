import { ReactNode, useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';
import { DESKTOP_NAV_BREAKPOINT, WIDE_CONTENT_BREAKPOINT } from '@/shared/ui/breakpoints';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  /** Uses the whole width on wide screens instead of a centered column. */
  fullWidth?: boolean;
};

export function Screen({ children, scroll = true, fullWidth = false }: ScreenProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const width = useWindowDimensions().width;
  const wide = width > WIDE_CONTENT_BREAKPOINT;
  const desktopNavigation = width >= DESKTOP_NAV_BREAKPOINT;
  const content = (
    <View style={[styles.content, wide && !fullWidth && styles.wideContent]}>{children}</View>
  );

  return (
    <SafeAreaView edges={desktopNavigation ? ['top', 'right'] : []} style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            desktopNavigation && styles.desktopScrollContent,
          ]}
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
    desktopScrollContent: { paddingBottom: 40 },
    content: { width: '100%', paddingHorizontal: 20, paddingTop: 18 },
    wideContent: { maxWidth: 920, alignSelf: 'center' },
  });
