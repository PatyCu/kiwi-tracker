import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type SignInUnavailableScreenProps = { message: string };

/** Shown when the app can't offer sign-in at all, such as missing Supabase env vars. */
export function SignInUnavailableScreen({ message }: SignInUnavailableScreenProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign-in is not available</Text>
      <Text style={styles.body}>{message}</Text>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      padding: 24,
      backgroundColor: colors.bg,
    },
    title: { color: colors.text, fontSize: 21, fontWeight: '700' },
    body: { color: colors.muted, fontSize: 14, textAlign: 'center', maxWidth: 420 },
  });
