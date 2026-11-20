import { Ionicons } from '@expo/vector-icons';
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
  /** Adds a calendar event on a day, when its empty space is clicked. */
  onAddEvent: (day: Date) => void;
};

/**
 * The whole month as a grid of days, each listing its first few items. The
 * weeks share the height the grid is given, down to a minimum per row.
 */
export function MonthGrid({
  weeks,
  weekdayNames,
  itemsByDay,
  todayKey,
  showPetNames,
  onOpenItem,
  onAddEvent,
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
                    onAddEvent={onAddEvent}
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
  onAddEvent: (day: Date) => void;
  styles: ReturnType<typeof makeStyles>;
};

/**
 * One day: a pressable that fills the box and adds an event, with the day's
 * items laid over it as their own buttons. They are siblings, not nested, so
 * no button sits inside another; everything but the items lets clicks through
 * to the add button underneath.
 */
function DayCell({
  day,
  isToday,
  items,
  showPetNames,
  onOpenItem,
  onAddEvent,
  styles,
}: DayCellProps) {
  const { colors } = useAppearance();
  const hidden = items.length - VISIBLE_ITEMS_PER_DAY;
  return (
    <>
      <Pressable
        accessibilityLabel={`Add calendar event on ${day.toLocaleDateString([], {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}`}
        accessibilityRole="button"
        onPress={() => onAddEvent(day)}
        style={({ pressed, hovered }) => [
          styles.addArea,
          (pressed || hovered) && styles.addAreaActive,
        ]}
      >
        {({ pressed, hovered }) =>
          (pressed || hovered) && (
            <Ionicons name="add" size={16} color={colors.kiwi} style={styles.addHint} />
          )
        }
      </Pressable>
      <View style={styles.dayContent}>
        <View style={[styles.dayNumber, isToday && styles.today, styles.passThrough]}>
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
        {hidden > 0 && <Text style={[styles.more, styles.passThrough]}>+{hidden} more</Text>}
      </View>
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

  return (
    <Pressable
      accessibilityLabel={`${time} ${label}`}
      accessibilityRole="button"
      onPress={() => onOpen(item)}
      style={({ pressed, hovered }) => [
        styles.item,
        planned && { backgroundColor: `${item.color}26` },
        (pressed || hovered) && styles.itemActive,
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
      flexGrow: 1,
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
    week: {
      flex: 1,
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    day: { flex: 1, minWidth: 0, minHeight: 104 },
    addArea: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
    addAreaActive: { backgroundColor: `${colors.kiwi}0D` },
    addHint: { position: 'absolute', top: 10, right: 8 },
    // Lets clicks through to the add area everywhere but on the items.
    dayContent: { padding: 6, gap: 3, pointerEvents: 'box-none' },
    passThrough: { pointerEvents: 'none' },
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
