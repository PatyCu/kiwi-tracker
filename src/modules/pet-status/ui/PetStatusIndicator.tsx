import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PetStatusLevel } from '@/modules/pet-status/calculatePetStatus';
import { getPetStatusColor } from '@/modules/pet-status/getPetStatusColor';
import { Palette } from '@/shared/theme/palette';

type PetStatusIndicatorProps = {
  label: string;
  status: PetStatusLevel;
  colors: Palette;
};

export function PetStatusIndicator({ label, status, colors }: PetStatusIndicatorProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const statusColor = getPetStatusColor(status, colors);

  return (
    <View testID="today-status-indicator" style={[styles.container, { borderColor: statusColor }]}>
      <Ionicons testID="today-status-icon" name="heart" size={29} color={statusColor} />
      <Text style={styles.label}>{label.toUpperCase()}</Text>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      width: 82,
      height: 82,
      borderRadius: 41,
      borderWidth: 6,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    label: { color: colors.muted, fontSize: 7, fontWeight: '700' },
  });
