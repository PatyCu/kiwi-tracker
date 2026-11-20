import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarMonth } from '@/modules/calendar/monthGrid';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type CalendarToolbarProps = {
  month: CalendarMonth;
  /** Groups the arrows after the month and puts `end` on the same line; narrow puts them either side. */
  wide: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  /** Shown at the right end on wide screens. */
  end?: ReactNode;
};

/** The month being shown and the arrows to move between months. */
export function CalendarToolbar({
  month,
  wide,
  onPreviousMonth,
  onNextMonth,
  end,
}: CalendarToolbarProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const title = new Date(month.year, month.month, 1).toLocaleDateString([], {
    month: 'long',
    year: 'numeric',
  });

  const header = (
    <Text accessibilityRole="header" style={styles.title}>
      {title}
    </Text>
  );
  const previous = (
    <MonthArrow
      icon="chevron-back"
      label="Previous month"
      onPress={onPreviousMonth}
      styles={styles}
    />
  );
  const next = (
    <MonthArrow icon="chevron-forward" label="Next month" onPress={onNextMonth} styles={styles} />
  );

  // Wide: the month and arrows on the left, `end` on the right.
  if (wide) {
    return (
      <View style={styles.toolbar}>
        <View style={styles.wideStart}>
          {header}
          <View style={styles.arrows}>
            {previous}
            {next}
          </View>
        </View>
        {end}
      </View>
    );
  }

  // Narrow: the arrows at either side of the month.
  return (
    <View style={styles.toolbar}>
      {previous}
      <View style={styles.narrowTitle}>{header}</View>
      {next}
    </View>
  );
}

type MonthArrowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
};

function MonthArrow({ icon, label, onPress, styles }: MonthArrowProps) {
  const { colors } = useAppearance();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={18} color={colors.text} />
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },
    wideStart: { flexDirection: 'row', alignItems: 'center', gap: 16, flexShrink: 1 },
    narrowTitle: { flexShrink: 1, alignItems: 'center' },
    title: { color: colors.text, fontSize: 26, fontWeight: '800' },
    arrows: { flexDirection: 'row', gap: 8 },
    arrow: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.7 },
  });
