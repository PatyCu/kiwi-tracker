import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/modules/auth/state/SessionProvider';
import { useHousehold } from '@/modules/households/state/HouseholdProvider';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

/**
 * Shown instead of the app when the signed-in account isn't in a household.
 * Every account should have one, so this points at a setup mistake rather than
 * showing an empty app.
 */
export function NoHouseholdScreen() {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { session, signOut } = useSession();
  const { retryLoad } = useHousehold();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const email = session.status === 'signed-in' ? session.user.email : null;

  const handleSignOut = async () => {
    setSignOutError(null);
    try {
      await signOut();
    } catch {
      setSignOutError('Could not sign out. Try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        This account isn&apos;t in a household yet
      </Text>
      <Text style={styles.body}>
        {email ? `${email} needs` : 'Your account needs'} to be added to a household before you can
        use Kiwi Tracker. Ask whoever set up your account, then check again.
      </Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={retryLoad} style={styles.primary}>
          <Text style={styles.primaryLabel}>Check again</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => void handleSignOut()}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>
      {signOutError && (
        <Text accessibilityRole="alert" style={styles.error}>
          {signOutError}
        </Text>
      )}
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
    title: { color: colors.text, fontSize: 21, fontWeight: '700', textAlign: 'center' },
    body: { color: colors.muted, fontSize: 14, textAlign: 'center', maxWidth: 420 },
    actions: { alignItems: 'center', gap: 16, marginTop: 12 },
    primary: {
      backgroundColor: colors.kiwi,
      borderRadius: 14,
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    primaryLabel: { color: colors.ink, fontSize: 15, fontWeight: '800' },
    signOut: { color: colors.coral, fontSize: 15, fontWeight: '700' },
    error: { color: colors.coral, fontSize: 14 },
  });
