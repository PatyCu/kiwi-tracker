import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type LoadStateProps = { onRetry: () => void };

export function LoadError({ onRetry }: LoadStateProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Could not load your data</Text>
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
    title: { color: colors.text, fontSize: 21, fontWeight: '700' },
    body: { color: colors.muted, fontSize: 14 },
    button: {
      marginTop: 10,
      backgroundColor: colors.kiwi,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 14,
    },
    buttonText: { color: colors.ink, fontWeight: '800' },
  });
