import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CALENDAR_KIND_LABELS,
  CalendarItem,
  CalendarKindChoice,
} from '@/modules/calendar/calendarItems';
import { formatClockTime } from '@/shared/dates/dateTime';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type DayAgendaProps = {
  day: Date;
  items: CalendarItem[];
  /** Named in the header, so the icon-only kind filter explains itself. */
  kind: CalendarKindChoice;
  /** Adds the pet's name to each item, for when several pets are shown. */
  showPetNames: boolean;
  onOpenItem: (item: CalendarItem) => void;
};

/** Everything of the chosen kind on one day, earliest first. */
export function DayAgenda({ day, items, kind, showPetNames, onOpenItem }: DayAgendaProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const date = day.toLocaleDateString([], { day: 'numeric', month: 'long' });

  return (
    <View style={styles.agenda}>
      <Text accessibilityRole="header" style={styles.title}>
        {date} – <Text style={styles.kind}>{CALENDAR_KIND_LABELS[kind]}</Text>
      </Text>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {kind === 'all'
              ? 'Nothing logged or scheduled on this day.'
              : `No ${CALENDAR_KIND_LABELS[kind].toLowerCase()} on this day.`}
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          {items.map((item, index) => (
            <AgendaRow
              key={`${item.kind}-${item.id}`}
              item={item}
              showPetName={showPetNames}
              divider={index > 0}
              onOpen={onOpenItem}
              styles={styles}
            />
          ))}
        </View>
      )}
    </View>
  );
}

type AgendaRowProps = {
  item: CalendarItem;
  showPetName: boolean;
  divider: boolean;
  onOpen: (item: CalendarItem) => void;
  styles: ReturnType<typeof makeStyles>;
};

function AgendaRow({ item, showPetName, divider, onOpen, styles }: AgendaRowProps) {
  const { colors } = useAppearance();
  const opens = item.kind === 'pet-event';
  const time = item.endsAt
    ? `${formatClockTime(item.startsAt)} – ${formatClockTime(item.endsAt)}`
    : formatClockTime(item.startsAt);
  const details = [showPetName ? item.petName : null, item.location].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole={opens ? 'button' : undefined}
      disabled={!opens}
      onPress={() => onOpen(item)}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { borderColor: item.color }]}>
        <Ionicons name={item.icon} size={16} color={item.color} />
      </View>
      <View style={styles.body}>
        <Text style={styles.time}>{time}</Text>
        <Text style={styles.itemTitle}>{item.title}</Text>
        {details.length > 0 && <Text style={styles.details}>{details}</Text>}
      </View>
      {opens && <Ionicons name="chevron-forward" size={16} color={colors.muted} />}
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    agenda: { gap: 10 },
    title: { color: colors.text, fontSize: 18, fontWeight: '800' },
    kind: { color: colors.kiwi },
    card: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 20,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
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
    itemTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
    details: { color: colors.muted, fontSize: 13 },
    empty: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.line,
      borderRadius: 18,
      padding: 20,
      alignItems: 'center',
    },
    emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  });
