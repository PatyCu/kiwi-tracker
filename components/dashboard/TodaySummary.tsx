import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Pet } from '@/lib/pets';
import { PetStatus, PetStatusLevel } from '@/lib/petStatus';
import { Palette } from '@/lib/theme';

type TodaySummaryProps = {
  pet: Pet;
  status: PetStatus;
  wide: boolean;
  colors: Palette;
};

export function TodaySummary({ pet, status, wide, colors }: TodaySummaryProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const statusColor = getStatusColor(status.status, colors);

  return (
    <View testID="today-summary-card" style={[styles.container, wide && styles.wideContainer]}>
      <View
        testID="today-status-indicator"
        style={[styles.statusIndicator, { borderColor: statusColor }]}
      >
        <Ionicons testID="today-status-icon" name="heart" size={29} color={statusColor} />
        <Text style={styles.statusIndicatorLabel}>{pet.species.toUpperCase()}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.kicker}>TODAY WITH {pet.name.toUpperCase()}</Text>
        <Text style={styles.title}>{status.headline}</Text>
        <View testID="today-status-description" style={styles.description}>
          {status.description.split('\n').map((line, index) => (
            <Text key={`${index}-${line}`} style={styles.body}>
              {line}
            </Text>
          ))}
        </View>
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
      gap: 22,
      alignItems: 'center',
    },
    wideContainer: { padding: 30 },
    copy: { flex: 1 },
    kicker: { fontSize: 11, color: colors.kiwi, fontWeight: '800', letterSpacing: 1.5 },
    title: { fontSize: 27, color: colors.text, fontWeight: '700', marginTop: 8 },
    description: { marginTop: 8, gap: 6 },
    body: { fontSize: 14, color: colors.muted, lineHeight: 20 },
    statusIndicator: {
      width: 82,
      height: 82,
      borderRadius: 41,
      borderWidth: 6,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    statusIndicatorLabel: { color: colors.muted, fontSize: 7, fontWeight: '700' },
  });

function getStatusColor(status: PetStatusLevel, colors: Palette): string {
  switch (status) {
    case PetStatusLevel.Red:
      return colors.coral;
    case PetStatusLevel.Amber:
      return colors.statusAmber;
    case PetStatusLevel.Green:
      return colors.kiwi;
  }
}
