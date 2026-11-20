import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarItem } from '@/modules/calendar/calendarItems';
import { formatClockTime, formatUpcomingDay } from '@/shared/dates/dateTime';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type CalendarItemRowProps = {
  item: CalendarItem;
  showPetName: boolean;
  /** Names the day before the time, for lists that span several days. */
  dayRelativeTo?: Date;
  divider: boolean;
  /** Pet events open their detail; calendar events don't open yet. */
  onOpen?: (item: CalendarItem) => void;
};

/** One pet event or calendar event in a list: its time, title, and pet or place. */
export function CalendarItemRow({
  item,
  showPetName,
  dayRelativeTo,
  divider,
  onOpen,
}: CalendarItemRowProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const opens = item.kind === 'pet-event' && onOpen !== undefined;
  const clock = item.endsAt
    ? `${formatClockTime(item.startsAt)} – ${formatClockTime(item.endsAt)}`
    : formatClockTime(item.startsAt);
  const time = dayRelativeTo
    ? `${formatUpcomingDay(item.startsAt, dayRelativeTo)} · ${clock}`
    : clock;
  const details = [showPetName ? item.petName : null, item.location].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole={opens ? 'button' : undefined}
      disabled={!opens}
      onPress={() => onOpen?.(item)}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { borderColor: item.color }]}>
        <Ionicons name={item.icon} size={16} color={item.color} />
      </View>
      <View style={styles.body}>
        <Text style={styles.time}>{time}</Text>
        <Text style={styles.title}>{item.title}</Text>
        {details.length > 0 && <Text style={styles.details}>{details}</Text>}
      </View>
      {opens && <Ionicons name="chevron-forward" size={16} color={colors.muted} />}
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    divider: { borderTopWidth: 1, borderTopColor: colors.line },
    pressed: { backgroundColor: colors.surface2 },
    icon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { flex: 1, gap: 2 },
    time: { color: colors.muted, fontSize: 12, fontWeight: '600' },
    title: { color: colors.text, fontSize: 15, fontWeight: '700' },
    details: { color: colors.muted, fontSize: 13 },
  });
