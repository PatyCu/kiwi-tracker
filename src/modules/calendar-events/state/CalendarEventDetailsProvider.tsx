import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { useCalendarEvents } from '@/modules/calendar-events/state/CalendarEventsProvider';
import { CalendarEventDetailsModal } from '@/modules/calendar-events/ui/CalendarEventDetailsModal';
import { usePets } from '@/modules/pets/state/PetsProvider';

type CalendarEventDetailsContextValue = {
  /** Shows a calendar event's details over whichever screen asked. */
  openCalendarEventDetails: (calendarEventId: string) => void;
};

const CalendarEventDetailsContext = createContext<CalendarEventDetailsContextValue | null>(null);

/**
 * One details sheet for the whole app, so Today, a pet's page and the
 * Calendar tab open a calendar event the same way without routes of their own.
 * It reads the event from the household's list, so it always shows what is saved.
 */
export function CalendarEventDetailsProvider({ children }: { children: ReactNode }) {
  const { calendarEvents } = useCalendarEvents();
  const { pets } = usePets();
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const event = calendarEvents.find((item) => item.id === openEventId);
  const pet = event && pets.find((item) => item.id === event.petId);

  const value = useMemo(() => ({ openCalendarEventDetails: setOpenEventId }), []);

  return (
    <CalendarEventDetailsContext.Provider value={value}>
      {children}
      <CalendarEventDetailsModal event={event} pet={pet} onClose={() => setOpenEventId(null)} />
    </CalendarEventDetailsContext.Provider>
  );
}

export function useCalendarEventDetails(): CalendarEventDetailsContextValue {
  const value = useContext(CalendarEventDetailsContext);
  if (!value) {
    throw new Error('useCalendarEventDetails must be used inside CalendarEventDetailsProvider.');
  }
  return value;
}
