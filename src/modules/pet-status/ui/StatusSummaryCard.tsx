import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PetStatus } from '@/modules/pet-status/calculatePetStatus';
import { PetStatusIndicator } from '@/modules/pet-status/ui/PetStatusIndicator';
import { Palette } from '@/shared/theme/palette';

type StatusSummaryCardProps = {
  indicatorLabel: string;
  kicker: string;
  status: PetStatus;
  wide: boolean;
  colors: Palette;
};

export function StatusSummaryCard({
  indicatorLabel,
  kicker,
  status,
  wide,
  colors,
}: StatusSummaryCardProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View testID="today-summary-card" style={[styles.container, wide && styles.wideContainer]}>
      <PetStatusIndicator label={indicatorLabel} status={status.status} colors={colors} />
      <View style={styles.copy}>
        <Text style={styles.kicker}>{kicker}</Text>
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
    kicker: {
      fontSize: 11,
      color: colors.kiwi,
      fontWeight: '800',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    title: { fontSize: 27, color: colors.text, fontWeight: '700', marginTop: 8 },
    description: { marginTop: 8, gap: 6 },
    body: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  });
