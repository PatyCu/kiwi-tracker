import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarMonth } from '@/modules/calendar/monthGrid';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type CalendarToolbarProps = {
  month: CalendarMonth;
  /** Puts the filters on the month's line instead of under it. */
  wide: boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  /** Whose items are shown; left out when there is only one pet. */
  petFilter?: ReactNode;
  /** Which kinds of items are shown; always at the right end. */
  kindFilter: ReactNode;
};

/** The month being shown, the arrows to move between months, and the filters. */
export function CalendarToolbar({
  month,
  wide,
  onPreviousMonth,
  onNextMonth,
  petFilter,
  kindFilter,
}: CalendarToolbarProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const title = new Date(month.year, month.month, 1).toLocaleDateString([], {
    month: 'long',
    year: 'numeric',
  });

  const monthAndArrows = (
    <>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <View style={styles.arrows}>
        <MonthArrow
          icon="chevron-back"
          label="Previous month"
          onPress={onPreviousMonth}
          styles={styles}
        />
        <MonthArrow
          icon="chevron-forward"
          label="Next month"
          onPress={onNextMonth}
          styles={styles}
        />
      </View>
    </>
  );

  // Wide: month, arrows and pets on the left, kinds on the right, all on one line.
  if (wide) {
    return (
      <View style={styles.wideToolbar}>
        <View style={styles.wideStart}>
          {monthAndArrows}
          {petFilter}
        </View>
        {kindFilter}
      </View>
    );
  }

  // Narrow: the month and arrows, then pets on the left and kinds on the right.
  return (
    <View style={styles.toolbar}>
      <View style={styles.monthRow}>{monthAndArrows}</View>
      <View style={styles.filters}>
        <View style={styles.petFilter}>{petFilter}</View>
        {kindFilter}
      </View>
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
    toolbar: { gap: 12 },
    wideToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },
    wideStart: { flexDirection: 'row', alignItems: 'center', gap: 16, flexShrink: 1 },
    monthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },
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
    filters: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    petFilter: { flex: 1 },
  });
