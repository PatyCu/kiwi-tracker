import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  CALENDAR_KIND_LABELS,
  CalendarItem,
  CalendarKindChoice,
} from '@/modules/calendar/calendarItems';
import { CalendarItemRow } from '@/modules/calendar/ui/CalendarItemRow';
import { scheduleAction } from '@/modules/calendar/ui/scheduleAction';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';
import { SectionActionButton } from '@/shared/ui/SectionHeader';

type DayAgendaProps = {
  day: Date;
  items: CalendarItem[];
  /** Named in the header, so the icon-only kind filter explains itself. */
  kind: CalendarKindChoice;
  /** Adds the pet's name to each item, for when several pets are shown. */
  showPetNames: boolean;
  onOpenItem: (item: CalendarItem) => void;
  /** Adds a calendar event on this day. */
  onSchedule: () => void;
};

/** Everything of the chosen kind on one day, earliest first. */
export function DayAgenda({
  day,
  items,
  kind,
  showPetNames,
  onOpenItem,
  onSchedule,
}: DayAgendaProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const date = day.toLocaleDateString([], { day: 'numeric', month: 'long' });

  return (
    <View style={styles.agenda}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {date} – <Text style={styles.kind}>{CALENDAR_KIND_LABELS[kind]}</Text>
        </Text>
        <SectionActionButton action={scheduleAction(onSchedule)} />
      </View>
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
            <CalendarItemRow
              key={`${item.kind}-${item.id}`}
              item={item}
              showPetName={showPetNames}
              divider={index > 0}
              onOpen={onOpenItem}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    agenda: { gap: 10 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    title: { flexShrink: 1, color: colors.text, fontSize: 18, fontWeight: '800' },
    kind: { color: colors.kiwi },
    card: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 20,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
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
