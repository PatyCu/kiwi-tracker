import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { SessionState, useSession } from '@/modules/auth/state/SessionProvider';
import { CalendarEvent, NewCalendarEvent } from '@/modules/calendar-events/model/CalendarEvent';
import {
  insertCalendarEvent,
  loadCalendarEvents,
} from '@/modules/calendar-events/persistence/calendarEventStore';
import {
  CalendarEventsProvider,
  useCalendarEvents,
} from '@/modules/calendar-events/state/CalendarEventsProvider';

jest.mock('@/modules/auth/state/SessionProvider', () => ({ useSession: jest.fn() }));
jest.mock('@/modules/calendar-events/persistence/calendarEventStore', () => ({
  loadCalendarEvents: jest.fn(),
  insertCalendarEvent: jest.fn(),
}));

const mockedLoad = jest.mocked(loadCalendarEvents);
const mockedInsert = jest.mocked(insertCalendarEvent);

const wrapper = ({ children }: { children: ReactNode }) => (
  <CalendarEventsProvider>{children}</CalendarEventsProvider>
);

function signInAs(id: string) {
  const session: SessionState = { status: 'signed-in', user: { id, email: `${id}@kiwi.test` } };
  jest.mocked(useSession).mockReturnValue({ session, signOut: jest.fn() });
}

function event(id: string, startsAt: string): CalendarEvent {
  return {
    id,
    petId: 'kiwi',
    title: `Event ${id}`,
    startsAt,
    endsAt: new Date(Date.parse(startsAt) + 3_600_000).toISOString(),
    createdAt: '2026-11-01T10:00:00.000Z',
  };
}

const newEvent: NewCalendarEvent = {
  petId: 'kiwi',
  title: 'Vaccines',
  startsAt: '2026-11-15T09:00:00.000Z',
  endsAt: '2026-11-15T10:00:00.000Z',
};

async function renderReady() {
  const rendered = renderHook(() => useCalendarEvents(), { wrapper });
  await waitFor(() => expect(rendered.result.current.loadStatus).toBe('ready'));
  return rendered;
}

describe('CalendarEventsProvider', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    signInAs('alex');
    mockedLoad.mockResolvedValue([]);
    mockedInsert.mockImplementation(async (input) => ({
      ...input,
      id: 'saved',
      createdAt: '2026-11-14T10:00:00.000Z',
    }));
  });

  it('adds a saved event to the list in date order', async () => {
    const early = event('early', '2026-11-10T09:00:00.000Z');
    const late = event('late', '2026-11-20T09:00:00.000Z');
    mockedLoad.mockResolvedValue([early, late]);
    const { result } = await renderReady();

    await act(async () => {
      await result.current.addCalendarEvent(newEvent);
    });

    expect(mockedInsert).toHaveBeenCalledWith(newEvent);
    expect(result.current.calendarEvents.map((item) => item.id)).toEqual([
      'early',
      'saved',
      'late',
    ]);
  });

  it('keeps the list unchanged when a new event is not saved', async () => {
    mockedInsert.mockRejectedValue(new Error('offline'));
    const { result } = await renderReady();

    await act(async () => {
      await expect(result.current.addCalendarEvent(newEvent)).rejects.toThrow('offline');
    });

    expect(result.current.calendarEvents).toEqual([]);
  });

  it('loads again for a different user instead of showing the previous events', async () => {
    const vaccines = event('vaccines', '2026-11-15T09:00:00.000Z');
    mockedLoad.mockResolvedValueOnce([vaccines]).mockResolvedValueOnce([]);
    const { result, rerender } = await renderReady();
    expect(result.current.calendarEvents).toEqual([vaccines]);

    signInAs('sam');
    rerender({});

    expect(result.current.loadStatus).toBe('loading');
    expect(result.current.calendarEvents).toEqual([]);
    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
    expect(mockedLoad).toHaveBeenCalledTimes(2);
  });

  it('reports a failed load and loads again on retry', async () => {
    mockedLoad.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    const { result } = renderHook(() => useCalendarEvents(), { wrapper });
    await waitFor(() => expect(result.current.loadStatus).toBe('error'));

    act(() => result.current.retryLoad());

    await waitFor(() => expect(result.current.loadStatus).toBe('ready'));
  });
});
