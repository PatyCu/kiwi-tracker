import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useSession } from '@/modules/auth/state/SessionProvider';
import { CalendarEvent, NewCalendarEvent } from '@/modules/calendar-events/model/CalendarEvent';
import {
  insertCalendarEvent,
  loadCalendarEvents,
} from '@/modules/calendar-events/persistence/calendarEventStore';
import { LoadStatus } from '@/shared/state/LoadStatus';

type CalendarEventsContextValue = {
  /** The household's calendar events, in date order. */
  calendarEvents: CalendarEvent[];
  loadStatus: LoadStatus;
  retryLoad: () => void;
  addCalendarEvent: (event: NewCalendarEvent) => Promise<void>;
};

/** Which load the events belong to, so a new user or a retry never shows stale events. */
type LoadKey = { userId: string; attempt: number };
type LoadedEvents = LoadKey & ({ status: 'ready'; events: CalendarEvent[] } | { status: 'error' });

const CalendarEventsContext = createContext<CalendarEventsContextValue | null>(null);
const NO_EVENTS: CalendarEvent[] = [];

/**
 * Loads the household's calendar events when a user signs in, and again for
 * each new user or retry. A new event is saved before it joins the list.
 */
export function CalendarEventsProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session.status === 'signed-in' ? session.user.id : null;
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<LoadedEvents | null>(null);

  useEffect(() => {
    if (!userId) return;
    let current = true;
    const key = { userId, attempt };
    loadCalendarEvents()
      .then(
        (events): LoadedEvents => ({ ...key, status: 'ready', events }),
        (): LoadedEvents => ({ ...key, status: 'error' }),
      )
      .then((result) => {
        if (current) setLoaded(result);
      });
    return () => {
      current = false;
    };
  }, [userId, attempt]);

  const current = loaded && loaded.userId === userId && loaded.attempt === attempt ? loaded : null;
  const loadStatus: LoadStatus = current?.status ?? 'loading';
  const calendarEvents = current?.status === 'ready' ? current.events : NO_EVENTS;

  const addCalendarEvent = useCallback(
    async (event: NewCalendarEvent) => {
      const saved = await insertCalendarEvent(event);
      // Saved even when the list failed to load; a retry then picks it up.
      setLoaded((previous) =>
        previous?.status === 'ready' && previous.userId === userId
          ? { ...previous, events: insertInDateOrder(previous.events, saved) }
          : previous,
      );
    },
    [userId],
  );

  const retryLoad = useCallback(() => setAttempt((count) => count + 1), []);

  const value = useMemo<CalendarEventsContextValue>(
    () => ({ calendarEvents, loadStatus, retryLoad, addCalendarEvent }),
    [addCalendarEvent, calendarEvents, loadStatus, retryLoad],
  );

  return <CalendarEventsContext.Provider value={value}>{children}</CalendarEventsContext.Provider>;
}

function insertInDateOrder(events: CalendarEvent[], event: CalendarEvent): CalendarEvent[] {
  const index = events.findIndex((item) => Date.parse(item.startsAt) > Date.parse(event.startsAt));
  return index === -1
    ? [...events, event]
    : [...events.slice(0, index), event, ...events.slice(index)];
}

export function useCalendarEvents(): CalendarEventsContextValue {
  const value = useContext(CalendarEventsContext);
  if (!value) throw new Error('useCalendarEvents must be used inside CalendarEventsProvider.');
  return value;
}
