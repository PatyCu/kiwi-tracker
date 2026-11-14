import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import {
  CalendarItem,
  CalendarKindChoice,
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
import {
  readPetSelection,
  togglePetSelection,
  toPetSelectionParam,
} from '@/modules/calendar/petSelection';
import { CalendarKindFilter } from '@/modules/calendar/ui/CalendarKindFilter';
import { CalendarPetFilter } from '@/modules/calendar/ui/CalendarPetFilter';
import { CalendarToolbar } from '@/modules/calendar/ui/CalendarToolbar';
import { CompactMonth } from '@/modules/calendar/ui/CompactMonth';
import { DayAgenda } from '@/modules/calendar/ui/DayAgenda';
import { MonthGrid } from '@/modules/calendar/ui/MonthGrid';
import { useCalendarEvents } from '@/modules/calendar-events/state/CalendarEventsProvider';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { usePetsAndEventsLoad } from '@/modules/pet-events/state/usePetsAndEventsLoad';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { NoPetsCard } from '@/modules/pets/ui/NoPetsCard';
import { combineLoadStatus } from '@/shared/state/LoadStatus';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { WIDE_CONTENT_BREAKPOINT } from '@/shared/ui/breakpoints';
import { LoadState } from '@/shared/ui/LoadState';
import { Screen } from '@/shared/ui/Screen';

/** Monday; a user setting may choose another day later. */
const WEEK_STARTS_ON: Weekday = 1;

/**
 * The household's pet events and calendar events by month: a full grid on wide
 * screens, and a compact month with the selected day's list on narrow ones.
 * The pet selection lives in the route (?petIds=), so a pet's page can open it.
 */
export function CalendarScreen() {
  const { colors } = useAppearance();
  const wide = useWindowDimensions().width > WIDE_CONTENT_BREAKPOINT;
  const { petIds: petIdsParam } = useLocalSearchParams<{ petIds?: string }>();
  const { pets } = usePets();
  const { events } = usePetEvents();
  const {
    calendarEvents,
    loadStatus: calendarStatus,
    retryLoad: retryCalendar,
  } = useCalendarEvents();
  const { loadStatus: petsAndEventsStatus, retryLoad: retryPetsAndEvents } = usePetsAndEventsLoad();
  const [kind, setKind] = useState<CalendarKindChoice>('all');
  const [month, setMonth] = useState(() => monthOf(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const selectedPetIds = useMemo(() => readPetSelection(petIdsParam, pets), [petIdsParam, pets]);
  const itemsByDay = useMemo(() => {
    const items = toCalendarItems(events, calendarEvents, pets, {
      symptom: colors.coral,
      diet: colors.kiwi,
      other: colors.muted,
      calendarEvent: colors.blue,
    });
    return groupCalendarItemsByDay(filterCalendarItems(items, { kind, petIds: selectedPetIds }));
  }, [calendarEvents, colors, events, kind, pets, selectedPetIds]);
  const weeks = useMemo(() => buildMonthGrid(month, WEEK_STARTS_ON), [month]);

  const loadStatus = combineLoadStatus(petsAndEventsStatus, calendarStatus);
  if (loadStatus !== 'ready') {
    return (
      <Screen>
        <LoadState
          status={loadStatus}
          onRetry={() => {
            if (petsAndEventsStatus === 'error') retryPetsAndEvents();
            if (calendarStatus === 'error') retryCalendar();
          }}
        />
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
    if (item.kind !== 'pet-event') return;
    router.push({
      // Inside the Calendar tab, so going back returns here.
      pathname: '/calendar/[petId]/records/[recordId]',
      params: { petId: item.petId, recordId: item.id },
    });
  };
  const names = weekdayNames(WEEK_STARTS_ON);

  return (
    <Screen fullWidth={wide}>
      <View style={styles.content}>
        <CalendarToolbar
          month={month}
          wide={wide}
          onPreviousMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
          petFilter={
            pets.length > 1 && (
              <CalendarPetFilter
                pets={pets}
                selectedPetIds={selectedPetIds}
                large={wide}
                onTogglePet={(petId) =>
                  router.setParams({
                    petIds: toPetSelectionParam(
                      togglePetSelection(selectedPetIds, petId, pets),
                      pets,
                    ),
                  })
                }
              />
            )
          }
          kindFilter={<CalendarKindFilter kind={kind} onKindChange={setKind} />}
        />
        {wide ? (
          <MonthGrid
            weeks={weeks}
            weekdayNames={names}
            itemsByDay={itemsByDay}
            todayKey={todayKey}
            showPetNames={showPetNames}
            onOpenItem={openItem}
          />
        ) : (
          <>
            <CompactMonth
              weeks={weeks}
              weekdayNames={names}
              itemsByDay={itemsByDay}
              todayKey={todayKey}
              selectedDayKey={toDayKey(selectedDay)}
              onSelectDay={setSelectedDay}
            />
            <DayAgenda
              day={selectedDay}
              items={itemsByDay.get(toDayKey(selectedDay)) ?? []}
              kind={kind}
              showPetNames={showPetNames}
              onOpenItem={openItem}
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18 },
});
