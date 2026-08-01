import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { QuickLog } from '@/modules/pet-events/ui/QuickLog';
import { Palette } from '@/shared/theme/palette';

type QuickLogCardProps = {
  colors: Palette;
  onLogSymptom: () => void;
  onLogDietChange: () => void;
  onLogOther: () => void;
};

export function QuickLogCard({
  colors,
  onLogSymptom,
  onLogDietChange,
  onLogOther,
}: QuickLogCardProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <QuickLog
        colors={colors}
        onLogSymptom={onLogSymptom}
        onLogDietChange={onLogDietChange}
        onLogOther={onLogOther}
      />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      padding: 18,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 24,
      backgroundColor: colors.surface,
    },
  });
