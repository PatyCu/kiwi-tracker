import { useCallback } from 'react';

import { useCalendarEvents } from '@/modules/calendar-events/state/CalendarEventsProvider';
import { usePetsAndEventsLoad } from '@/modules/pet-events/state/usePetsAndEventsLoad';
import { combineLoadStatus, LoadStatus } from '@/shared/state/LoadStatus';

/**
 * Whether the household's pets, their events and its calendar events have all
 * loaded, for screens that show them together. Retry loads again only what failed.
 */
export function useCalendarDataLoad(): { loadStatus: LoadStatus; retryLoad: () => void } {
  const { loadStatus: petsAndEventsStatus, retryLoad: retryPetsAndEvents } = usePetsAndEventsLoad();
  const { loadStatus: calendarStatus, retryLoad: retryCalendar } = useCalendarEvents();

  const retryLoad = useCallback(() => {
    if (petsAndEventsStatus === 'error') retryPetsAndEvents();
    if (calendarStatus === 'error') retryCalendar();
  }, [calendarStatus, petsAndEventsStatus, retryCalendar, retryPetsAndEvents]);

  return { loadStatus: combineLoadStatus(petsAndEventsStatus, calendarStatus), retryLoad };
}
