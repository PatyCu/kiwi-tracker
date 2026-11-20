import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import {
  CALENDAR_ITEM_KINDS,
  CalendarItem,
  CalendarItemKind,
  filterCalendarItems,
  groupCalendarItemsByDay,
  toCalendarItems,
} from '@/modules/calendar/calendarItems';
import {
  buildMonthGrid,
  isInMonth,
  monthOf,
  shiftMonth,
  toDayKey,
  Weekday,
  weekdayNames,
} from '@/modules/calendar/monthGrid';
import { toggleSelection } from '@/modules/calendar/filterSelection';
import {
  readPetSelection,
  togglePetSelection,
  toPetSelectionParam,
} from '@/modules/calendar/petSelection';
import { AddCalendarEventButton } from '@/modules/calendar/ui/AddCalendarEventButton';
import { CalendarFilter } from '@/modules/calendar/ui/CalendarFilter';
import { CalendarToolbar } from '@/modules/calendar/ui/CalendarToolbar';
import { CompactMonth } from '@/modules/calendar/ui/CompactMonth';
import { DayAgenda } from '@/modules/calendar/ui/DayAgenda';
import { MonthGrid } from '@/modules/calendar/ui/MonthGrid';
import { useCalendarDataLoad } from '@/modules/calendar/useCalendarDataLoad';
import { useCalendarEventDetails } from '@/modules/calendar-events/state/CalendarEventDetailsProvider';
import { useCalendarEventForms } from '@/modules/calendar-events/state/CalendarEventFormsProvider';
import { useCalendarEvents } from '@/modules/calendar-events/state/CalendarEventsProvider';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { NoPetsCard } from '@/modules/pets/ui/NoPetsCard';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { WIDE_CONTENT_BREAKPOINT } from '@/shared/ui/breakpoints';
import { LoadState } from '@/shared/ui/LoadState';
import { Screen } from '@/shared/ui/Screen';

/** Monday; a user setting may choose another day later. */
const WEEK_STARTS_ON: Weekday = 1;

/**
 * The household's pet events and calendar events by month: a full grid on wide
 * screens, and a compact month with the selected day's list (if a day is
 * selected) on narrow ones.
 * The pet selection lives in the route (?petIds=), so a pet's page can open it.
 */
export function CalendarScreen() {
  const { colors } = useAppearance();
  const wide = useWindowDimensions().width > WIDE_CONTENT_BREAKPOINT;
  const { petIds: petIdsParam } = useLocalSearchParams<{ petIds?: string }>();
  const { pets } = usePets();
  const { events } = usePetEvents();
  const { calendarEvents } = useCalendarEvents();
  const { openCalendarEventDetails } = useCalendarEventDetails();
  const { openAddCalendarEvent } = useCalendarEventForms();
  const { loadStatus, retryLoad } = useCalendarDataLoad();
  const [kinds, setKinds] = useState<readonly CalendarItemKind[]>(CALENDAR_ITEM_KINDS);
  const [month, setMonth] = useState(() => monthOf(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(() => new Date());

  const selectedPetIds = useMemo(() => readPetSelection(petIdsParam, pets), [petIdsParam, pets]);
  const itemsByDay = useMemo(() => {
    const items = toCalendarItems(events, calendarEvents, pets, {
      symptom: colors.coral,
      diet: colors.kiwi,
      other: colors.muted,
      calendarEvent: colors.blue,
    });
    return groupCalendarItemsByDay(filterCalendarItems(items, { kinds, petIds: selectedPetIds }));
  }, [calendarEvents, colors, events, kinds, pets, selectedPetIds]);
  const weeks = useMemo(() => buildMonthGrid(month, WEEK_STARTS_ON), [month]);

  if (loadStatus !== 'ready') {
    return (
      <Screen>
        <LoadState status={loadStatus} onRetry={retryLoad} />
      </Screen>
    );
  }

  if (pets.length === 0) {
    return (
      <Screen>
        <NoPetsCard description="Add a pet to see what you log and schedule for them by month." />
      </Screen>
    );
  }

  const todayKey = toDayKey(new Date());
  const showPetNames = selectedPetIds.length > 1;
  const changeMonth = (offset: number) => {
    const next = shiftMonth(month, offset);
    const today = new Date();
    setMonth(next);
    setSelectedDay(isInMonth(today, next) ? today : new Date(next.year, next.month, 1));
  };
  const openItem = (item: CalendarItem) => {
    if (item.kind === 'calendar-event') {
      openCalendarEventDetails(item.id);
      return;
    }
    router.push({
      // Inside the Calendar tab, so going back returns here.
      pathname: '/calendar/[petId]/records/[recordId]',
      params: { petId: item.petId, recordId: item.id },
    });
  };
  // One pet needs no picker; with several, the form asks which one.
  const addEvent = (day?: Date) =>
    openAddCalendarEvent(pets.length === 1 ? pets[0].id : undefined, day);
  const names = weekdayNames(WEEK_STARTS_ON);
  const filter = (
    <CalendarFilter
      pets={pets}
      selectedPetIds={selectedPetIds}
      onTogglePet={(petId) =>
        router.setParams({
          petIds: toPetSelectionParam(togglePetSelection(selectedPetIds, petId, pets), pets),
        })
      }
      kinds={kinds}
      onToggleKind={(kind) => setKinds(toggleSelection(CALENDAR_ITEM_KINDS, kinds, kind))}
      onReset={() => {
        setKinds(CALENDAR_ITEM_KINDS);
        router.setParams({ petIds: undefined });
      }}
      wide={wide}
    />
  );

  return (
    <Screen fullWidth={wide} fill={wide}>
      <View style={[styles.content, wide && styles.fill]}>
        <CalendarToolbar
          month={month}
          wide={wide}
          onPreviousMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
          end={wide && filter}
        />
        {wide ? (
          <MonthGrid
            weeks={weeks}
            weekdayNames={names}
            itemsByDay={itemsByDay}
            todayKey={todayKey}
            showPetNames={showPetNames}
            onOpenItem={openItem}
            onAddEvent={addEvent}
          />
        ) : (
          <>
            <View style={styles.actions}>
              <View style={styles.actionsStart}>{filter}</View>
              <AddCalendarEventButton
                day={selectedDay}
                onPress={() => addEvent(selectedDay ?? undefined)}
              />
            </View>
            <CompactMonth
              weeks={weeks}
              weekdayNames={names}
              itemsByDay={itemsByDay}
              todayKey={todayKey}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
            {selectedDay && (
              <DayAgenda
                day={selectedDay}
                items={itemsByDay.get(toDayKey(selectedDay)) ?? []}
                kinds={kinds}
                showPetNames={showPetNames}
                onOpenItem={openItem}
              />
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18 },
  fill: { flexGrow: 1 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: -6,
  },
  actionsStart: { flexShrink: 1 },
});
