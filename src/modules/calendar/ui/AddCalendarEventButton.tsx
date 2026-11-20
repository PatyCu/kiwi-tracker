import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type AddCalendarEventButtonProps = {
  /** The day the event is added on, named in the label; none lets the form choose. */
  day: Date | null;
  onPress: () => void;
};

/** A round "+" that adds a calendar event. */
export function AddCalendarEventButton({ day, onPress }: AddCalendarEventButtonProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const label = day
    ? `Add calendar event on ${day.toLocaleDateString([], {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })}`
    : 'Add calendar event';

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.add, pressed && styles.pressed]}
    >
      <Ionicons name="add" size={20} color={colors.ink} />
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    add: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.kiwi,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.7 },
  });
