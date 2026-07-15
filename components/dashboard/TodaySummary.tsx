import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Pet } from '@/lib/pets';
import { Palette } from '@/lib/theme';

type TodaySummaryProps = {
  pet: Pet;
  hasEvents: boolean;
  wide: boolean;
  colors: Palette;
};

export function TodaySummary({ pet, hasEvents, wide, colors }: TodaySummaryProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={[styles.container, wide && styles.wideContainer]}>
      <View style={styles.copy}>
        <Text style={styles.kicker}>TODAY WITH {pet.name.toUpperCase()}</Text>
        <Text style={styles.title}>Everything looks calm.</Text>
        <Text style={styles.body}>
          {hasEvents
            ? 'Your latest observations are ready to review.'
            : 'No health events logged yet.'}
        </Text>
      </View>
      <View style={styles.score}>
        <Ionicons name={pet.species === 'Dog' ? 'paw' : 'heart'} size={29} color={colors.kiwi} />
        <Text style={styles.scoreLabel}>{pet.species.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 24,
      padding: 22,
      flexDirection: 'row',
      gap: 16,
      alignItems: 'center',
    },
    wideContainer: { padding: 30 },
    copy: { flex: 1 },
    kicker: { fontSize: 11, color: colors.kiwi, fontWeight: '800', letterSpacing: 1.5 },
    title: { fontSize: 27, color: colors.text, fontWeight: '700', marginTop: 8 },
    body: { fontSize: 14, color: colors.muted, marginTop: 8, lineHeight: 20 },
    score: {
      width: 82,
      height: 82,
      borderRadius: 41,
      borderWidth: 6,
      borderColor: colors.kiwi,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    scoreLabel: { color: colors.muted, fontSize: 7, fontWeight: '700' },
  });
