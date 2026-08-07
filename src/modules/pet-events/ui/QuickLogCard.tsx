import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { QuickLog } from '@/modules/pet-events/ui/QuickLog';
import { Palette } from '@/shared/theme/palette';

type QuickLogCardProps = {
  colors: Palette;
  variant?: 'standalone' | 'embedded';
  onLogSymptom: () => void;
  onLogDietChange: () => void;
  onLogOther: () => void;
};

export function QuickLogCard({
  colors,
  variant = 'standalone',
  onLogSymptom,
  onLogDietChange,
  onLogOther,
}: QuickLogCardProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={variant === 'standalone' && styles.card}>
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
