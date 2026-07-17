import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/lib/theme';

type UpcomingCareProps = {
  colors: Palette;
};

export function UpcomingCare({ colors }: UpcomingCareProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Up next</Text>
        <Text style={styles.link}>See all</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.amber} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.cardTitle}>Annual vaccines</Text>
          <Text style={styles.meta}>Vet appointment · 18 July, 10:30</Text>
        </View>
        <Text style={styles.badge}>7 DAYS</Text>
      </View>
    </>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 28,
      marginBottom: 12,
    },
    title: { fontSize: 19, color: colors.text, fontWeight: '700' },
    link: { fontSize: 13, color: colors.kiwi, fontWeight: '700' },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      borderWidth: 1,
      borderColor: colors.line,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.amberWash,
    },
    copy: { flex: 1 },
    cardTitle: { fontSize: 15, color: colors.text, fontWeight: '700' },
    meta: { fontSize: 12, color: colors.muted, marginTop: 5 },
    badge: {
      color: colors.amber,
      fontSize: 9,
      fontWeight: '800',
      backgroundColor: colors.amberWash,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
  });
