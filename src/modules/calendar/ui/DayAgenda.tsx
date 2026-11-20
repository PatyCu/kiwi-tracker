import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  CALENDAR_ITEM_KIND_LABELS,
  CALENDAR_ITEM_KINDS,
  CalendarItem,
  CalendarItemKind,
} from '@/modules/calendar/calendarItems';
import { CalendarItemRow } from '@/modules/calendar/ui/CalendarItemRow';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type DayAgendaProps = {
  day: Date;
  items: CalendarItem[];
  /** Named in the header, so the list says which kinds it shows. */
  kinds: readonly CalendarItemKind[];
  /** Adds the pet's name to each item, for when several pets are shown. */
  showPetNames: boolean;
  onOpenItem: (item: CalendarItem) => void;
};

/** Everything of the chosen kinds on one day, earliest first. */
export function DayAgenda({ day, items, kinds, showPetNames, onOpenItem }: DayAgendaProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const date = day.toLocaleDateString([], { day: 'numeric', month: 'long' });
  const allKinds = kinds.length === CALENDAR_ITEM_KINDS.length;
  const kindsLabel = allKinds
    ? 'All events'
    : kinds.map((kind) => CALENDAR_ITEM_KIND_LABELS[kind]).join(', ');

  return (
    <View style={styles.agenda}>
      <Text accessibilityRole="header" style={styles.title}>
        {date} – <Text style={styles.kind}>{kindsLabel}</Text>
      </Text>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {allKinds
              ? 'Nothing logged or scheduled on this day.'
              : `No ${kindsLabel.toLowerCase()} on this day.`}
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
    title: { color: colors.text, fontSize: 18, fontWeight: '800' },
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
