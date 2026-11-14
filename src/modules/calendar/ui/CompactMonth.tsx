import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarItem } from '@/modules/calendar/calendarItems';
import { CalendarWeek, toDayKey } from '@/modules/calendar/monthGrid';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

const MAX_DOTS = 4;

type CompactMonthProps = {
  weeks: CalendarWeek[];
  weekdayNames: string[];
  itemsByDay: Map<string, CalendarItem[]>;
  todayKey: string;
  selectedDayKey: string;
  onSelectDay: (day: Date) => void;
};

/** The month as a small grid where each day shows a dot per kind of item it has. */
export function CompactMonth({
  weeks,
  weekdayNames,
  itemsByDay,
  todayKey,
  selectedDayKey,
  onSelectDay,
}: CompactMonthProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.month}>
      <View style={styles.week}>
        {weekdayNames.map((name) => (
          <Text key={name} style={styles.weekday}>
            {name}
          </Text>
        ))}
      </View>
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.week}>
          {week.map((day, dayIndex) => {
            if (!day) return <View key={dayIndex} style={styles.day} />;
            const key = toDayKey(day);
            const selected = key === selectedDayKey;
            const isToday = key === todayKey;
            const items = itemsByDay.get(key) ?? [];
            const dotColors = [...new Set(items.map((item) => item.color))].slice(0, MAX_DOTS);
            return (
              <Pressable
                key={dayIndex}
                accessibilityLabel={`${day.toLocaleDateString([], {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}${items.length > 0 ? `, ${items.length} ${items.length === 1 ? 'item' : 'items'}` : ''}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelectDay(day)}
                style={styles.day}
              >
                <View
                  style={[styles.dayNumber, isToday && styles.today, selected && styles.selected]}
                >
                  <Text
                    style={[
                      styles.dayNumberText,
                      isToday && styles.todayText,
                      selected && styles.selectedText,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </View>
                <View style={styles.dots}>
                  {dotColors.map((color) => (
                    <View key={color} style={[styles.dot, { backgroundColor: color }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    month: {
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 22,
      backgroundColor: colors.surface,
    },
    week: { flexDirection: 'row' },
    weekday: {
      flex: 1,
      textAlign: 'center',
      color: colors.muted,
      fontSize: 11,
      fontWeight: '700',
      paddingBottom: 6,
    },
    day: { flex: 1, alignItems: 'center', paddingVertical: 4, minHeight: 50 },
    dayNumber: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    dayNumberText: { color: colors.text, fontSize: 15, fontWeight: '600' },
    today: { borderColor: colors.kiwi },
    todayText: { color: colors.kiwi, fontWeight: '800' },
    selected: { backgroundColor: colors.kiwi, borderColor: colors.kiwi },
    selectedText: { color: colors.ink, fontWeight: '800' },
    dots: { flexDirection: 'row', gap: 3, height: 6, marginTop: 3 },
    dot: { width: 5, height: 5, borderRadius: 3 },
  });
