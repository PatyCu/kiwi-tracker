import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { LoadStatus } from '@/shared/state/LoadStatus';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type LoadStateProps = {
  status: Exclude<LoadStatus, 'ready'>;
  onRetry: () => void;
};

/** What a screen shows in place of its data until the data has loaded. */
export function LoadState({ status, onRetry }: LoadStateProps) {
  return status === 'loading' ? <Loading /> : <LoadError onRetry={onRetry} />;
}

export function Loading() {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar" style={styles.container}>
      <ActivityIndicator color={colors.kiwi} size="large" />
      <Text style={styles.body}>Loading…</Text>
    </View>
  );
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Could not load your data
      </Text>
      <Text style={styles.body}>Check your connection and try again.</Text>
      <Text style={styles.body}>Your saved data has not been changed.</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}>
        <Text style={styles.buttonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: { alignItems: 'center', paddingVertical: 80, gap: 10 },
    title: { color: colors.text, fontSize: 21, fontWeight: '700', textAlign: 'center' },
    body: { color: colors.muted, fontSize: 14, textAlign: 'center' },
    button: {
      marginTop: 10,
      backgroundColor: colors.kiwi,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 14,
    },
    buttonText: { color: colors.ink, fontWeight: '800' },
  });
