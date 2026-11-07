import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/modules/auth/state/SessionProvider';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

export function AccountSection() {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { session, signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session.status !== 'signed-in') return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    setError(null);
    try {
      // On success the session gate replaces this screen with sign-in.
      await signOut();
    } catch {
      setError('Could not sign out. Try again.');
      setSigningOut(false);
    }
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.value}>{session.user.email}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: signingOut }}
          disabled={signingOut}
          onPress={() => void handleSignOut()}
          style={[styles.row, styles.divider]}
        >
          <Text style={[styles.signOut, signingOut && styles.disabled]}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Text>
        </Pressable>
      </View>
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 12 },
    card: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 20,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    row: { padding: 18, gap: 4 },
    divider: { borderTopWidth: 1, borderTopColor: colors.line },
    label: { color: colors.muted, fontSize: 13 },
    value: { color: colors.text, fontSize: 15, fontWeight: '600' },
    signOut: { color: colors.coral, fontSize: 15, fontWeight: '700' },
    disabled: { opacity: 0.5 },
    error: { color: colors.coral, fontSize: 14, marginTop: 10 },
  });
