import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarItem } from '@/modules/calendar/calendarItems';
import { CalendarWeek, toDayKey } from '@/modules/calendar/monthGrid';
import { formatCompactClockTime } from '@/shared/dates/dateTime';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

const VISIBLE_ITEMS_PER_DAY = 3;

type MonthGridProps = {
  weeks: CalendarWeek[];
  weekdayNames: string[];
  itemsByDay: Map<string, CalendarItem[]>;
  todayKey: string;
  /** Adds the pet's name to each item, for when several pets are shown. */
  showPetNames: boolean;
  onOpenItem: (item: CalendarItem) => void;
};

/** The whole month as a grid of days, each listing its first few items. */
export function MonthGrid({
  weeks,
  weekdayNames,
  itemsByDay,
  todayKey,
  showPetNames,
  onOpenItem,
}: MonthGridProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.grid}>
      <View style={styles.weekdays}>
        {weekdayNames.map((name) => (
          <Text key={name} style={styles.weekday}>
            {name.toUpperCase()}
          </Text>
        ))}
      </View>
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.week}>
          {week.map((day, dayIndex) => {
            const key = day ? toDayKey(day) : null;
            return (
              <View key={dayIndex} style={[styles.day, dayIndex > 0 && styles.dayDivider]}>
                {day && key && (
                  <DayCell
                    day={day}
                    isToday={key === todayKey}
                    items={itemsByDay.get(key) ?? []}
                    showPetNames={showPetNames}
                    onOpenItem={onOpenItem}
                    styles={styles}
                  />
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

type DayCellProps = {
  day: Date;
  isToday: boolean;
  items: CalendarItem[];
  showPetNames: boolean;
  onOpenItem: (item: CalendarItem) => void;
  styles: ReturnType<typeof makeStyles>;
};

function DayCell({ day, isToday, items, showPetNames, onOpenItem, styles }: DayCellProps) {
  const hidden = items.length - VISIBLE_ITEMS_PER_DAY;
  return (
    <>
      <View style={[styles.dayNumber, isToday && styles.today]}>
        <Text style={[styles.dayNumberText, isToday && styles.todayText]}>{day.getDate()}</Text>
      </View>
      {items.slice(0, VISIBLE_ITEMS_PER_DAY).map((item) => (
        <GridItem
          key={`${item.kind}-${item.id}`}
          item={item}
          showPetName={showPetNames}
          onOpen={onOpenItem}
          styles={styles}
        />
      ))}
      {hidden > 0 && <Text style={styles.more}>+{hidden} more</Text>}
    </>
  );
}

type GridItemProps = {
  item: CalendarItem;
  showPetName: boolean;
  onOpen: (item: CalendarItem) => void;
  styles: ReturnType<typeof makeStyles>;
};

function GridItem({ item, showPetName, onOpen, styles }: GridItemProps) {
  const planned = item.kind === 'calendar-event';
  const time = formatCompactClockTime(item.startsAt);
  const label = showPetName ? `${item.title} · ${item.petName}` : item.title;
  const opens = item.kind === 'pet-event';

  return (
    <Pressable
      accessibilityLabel={`${time} ${label}`}
      accessibilityRole={opens ? 'button' : 'text'}
      disabled={!opens}
      onPress={() => onOpen(item)}
      style={({ pressed, hovered }) => [
        styles.item,
        planned && { backgroundColor: `${item.color}26` },
        opens && (pressed || hovered) && styles.itemActive,
      ]}
    >
      {!planned && <View style={[styles.itemDot, { backgroundColor: item.color }]} />}
      <Text numberOfLines={1} style={styles.itemText}>
        <Text style={styles.itemTime}>{time} </Text>
        {label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    grid: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 22,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    weekdays: { flexDirection: 'row', paddingVertical: 10 },
    weekday: {
      flex: 1,
      textAlign: 'center',
      color: colors.muted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.6,
    },
    week: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.line },
    day: { flex: 1, minWidth: 0, minHeight: 116, padding: 6, gap: 3 },
    dayDivider: { borderLeftWidth: 1, borderLeftColor: colors.line },
    dayNumber: {
      alignSelf: 'center',
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    dayNumberText: { color: colors.text, fontSize: 13, fontWeight: '700' },
    today: { backgroundColor: colors.kiwi },
    todayText: { color: colors.ink },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      minHeight: 22,
      paddingHorizontal: 5,
      borderRadius: 6,
    },
    itemActive: { backgroundColor: colors.surface2 },
    itemDot: { width: 7, height: 7, borderRadius: 4 },
    itemText: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '600' },
    itemTime: { color: colors.muted, fontWeight: '500' },
    more: { color: colors.muted, fontSize: 11, fontWeight: '700', paddingHorizontal: 5 },
  });
