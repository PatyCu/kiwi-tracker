import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CALENDAR_KIND_LABELS, CalendarKindChoice } from '@/modules/calendar/calendarItems';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

const OPTIONS: { value: CalendarKindChoice; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'all', icon: 'apps-outline' },
  { value: 'pet-events', icon: 'pulse-outline' },
  { value: 'calendar-events', icon: 'calendar-outline' },
];

type CalendarKindFilterProps = {
  kind: CalendarKindChoice;
  onKindChange: (kind: CalendarKindChoice) => void;
};

/** Chooses which kinds of items the calendar shows, as compact icon segments. */
export function CalendarKindFilter({ kind, onKindChange }: CalendarKindFilterProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View accessibilityLabel="Show" accessibilityRole="radiogroup" style={styles.segments}>
      {OPTIONS.map((option) => {
        const selected = option.value === kind;
        return (
          <Pressable
            key={option.value}
            accessibilityLabel={CALENDAR_KIND_LABELS[option.value]}
            accessibilityRole="radio"
            aria-checked={selected}
            hitSlop={{ top: 6, bottom: 6 }}
            onPress={() => onKindChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.selectedSegment,
              pressed && !selected && styles.pressed,
            ]}
          >
            <Ionicons name={option.icon} size={16} color={selected ? colors.ink : colors.muted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    segments: {
      flexDirection: 'row',
      padding: 3,
      gap: 2,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    segment: {
      width: 36,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedSegment: { backgroundColor: colors.kiwi },
    pressed: { backgroundColor: colors.surface2 },
  });
