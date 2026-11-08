import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/modules/auth/state/SessionProvider';
import { useHouseholdAlias } from '@/modules/households/state/useHouseholdAlias';
import { useHouseholdMembers } from '@/modules/households/state/useHouseholdMembers';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

/** The signed-in user's household and who is in it, by name. Read-only for now. */
export function HouseholdSection() {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { session } = useSession();
  const householdAlias = useHouseholdAlias();
  const { members, retryLoad } = useHouseholdMembers();
  const userId = session.status === 'signed-in' ? session.user.id : null;

  return (
    <View>
      <Text style={styles.sectionTitle}>Household</Text>
      <View style={styles.card}>
        {/* Shown once loaded; accounts without a household never reach Settings. */}
        {householdAlias && (
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{householdAlias}</Text>
          </View>
        )}
        <View style={[styles.row, householdAlias ? styles.divider : null]}>
          <Text style={styles.label}>Members</Text>
          {members.status === 'loading' && <Text style={styles.muted}>Loading…</Text>}
          {members.status === 'error' && (
            <View style={styles.errorRow}>
              <Text accessibilityRole="alert" style={styles.error}>
                Could not load the members.
              </Text>
              <Pressable accessibilityRole="button" onPress={retryLoad}>
                <Text style={styles.retry}>Retry</Text>
              </Pressable>
            </View>
          )}
          {members.status === 'ready' &&
            members.members.map((member) => (
              <Text key={member.userId} style={styles.value}>
                {member.displayName}
                {member.userId === userId && <Text style={styles.muted}> (you)</Text>}
              </Text>
            ))}
        </View>
      </View>
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
    muted: { color: colors.muted, fontSize: 15, fontWeight: '400' },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    error: { color: colors.coral, fontSize: 14 },
    retry: { color: colors.kiwi, fontSize: 14, fontWeight: '700' },
  });
