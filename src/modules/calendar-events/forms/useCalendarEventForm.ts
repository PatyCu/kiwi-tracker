import { useCallback, useMemo, useState } from 'react';

import { NewCalendarEvent } from '@/modules/calendar-events/model/CalendarEvent';
import { toDisplayedEventDateTime, toEventTimestamp } from '@/shared/dates/dateTime';

export type CalendarEventInput = Omit<NewCalendarEvent, 'petId'>;

type UseCalendarEventFormInput = {
  onSubmit: (input: CalendarEventInput) => Promise<void>;
};

type CalendarEventFormValues = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
};

const LAST_MINUTE_OF_DAY = 23 * 60 + 59;

/** Starts at the next full hour and lasts an hour, ending by midnight. */
function newCalendarEventValues(now = new Date()): CalendarEventFormValues {
  const start = new Date(now);
  start.setHours(start.getHours() + 1, 0, 0, 0);
  const startValues = toDisplayedEventDateTime(start);
  const startMinutes = start.getHours() * 60;
  return {
    title: '',
    date: startValues.date,
    startTime: startValues.time,
    endTime: toTimeValue(Math.min(startMinutes + 60, LAST_MINUTE_OF_DAY)),
    location: '',
    description: '',
  };
}

export function useCalendarEventForm({ onSubmit }: UseCalendarEventFormInput) {
  const [visible, setVisible] = useState(false);
  const [values, setValues] = useState(newCalendarEventValues);
  const [initialValues, setInitialValues] = useState(values);
  const [isSaving, setIsSaving] = useState(false);

  const startsAt = useMemo(
    () => toEventTimestamp(values.date, values.startTime),
    [values.date, values.startTime],
  );
  const endsAt = useMemo(
    () => toEventTimestamp(values.date, values.endTime),
    [values.date, values.endTime],
  );
  const titleIsValid = values.title.trim().length > 0;
  const startIsValid = startsAt !== null;
  const endIsAfterStart =
    startsAt !== null && endsAt !== null && Date.parse(endsAt) > Date.parse(startsAt);
  const isDirty = (Object.keys(values) as (keyof CalendarEventFormValues)[]).some(
    (key) => values[key] !== initialValues[key],
  );

  const setField = useCallback(
    (key: keyof CalendarEventFormValues) => (value: string) =>
      setValues((current) => ({ ...current, [key]: value })),
    [],
  );
  const setTitle = useMemo(() => setField('title'), [setField]);
  const setDate = useMemo(() => setField('date'), [setField]);
  const setEndTime = useMemo(() => setField('endTime'), [setField]);
  const setLocation = useMemo(() => setField('location'), [setField]);
  const setDescription = useMemo(() => setField('description'), [setField]);
  // Moving the start keeps the event's length, like Google Calendar, without passing midnight.
  const setStartTime = useCallback(
    (startTime: string) =>
      setValues((current) => ({
        ...current,
        startTime,
        endTime: shiftEndTime(current.startTime, startTime, current.endTime),
      })),
    [],
  );

  const open = useCallback(() => {
    const next = newCalendarEventValues();
    setValues(next);
    setInitialValues(next);
    setVisible(true);
  }, []);
  // Values are cleared when the form next opens, so the sheet keeps its content while it
  // animates closed.
  const close = useCallback(() => setVisible(false), []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!visible || isSaving || !titleIsValid || !startsAt || !endsAt || !endIsAfterStart) {
      return false;
    }
    setIsSaving(true);
    try {
      const location = values.location.trim();
      const description = values.description.trim();
      await onSubmit({
        title: values.title.trim(),
        startsAt,
        endsAt,
        ...(location ? { location } : {}),
        ...(description ? { description } : {}),
      });
      setVisible(false);
      return true;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [endIsAfterStart, endsAt, isSaving, onSubmit, startsAt, titleIsValid, values, visible]);

  return {
    visible,
    ...values,
    titleIsValid,
    startIsValid,
    endIsAfterStart,
    isDirty,
    isSaving,
    open,
    close,
    setTitle,
    setDate,
    setStartTime,
    setEndTime,
    setLocation,
    setDescription,
    submit,
  };
}

function shiftEndTime(previousStart: string, nextStart: string, end: string): string {
  const previousStartMinutes = toMinutes(previousStart);
  const nextStartMinutes = toMinutes(nextStart);
  const endMinutes = toMinutes(end);
  if (previousStartMinutes === null || nextStartMinutes === null || endMinutes === null) {
    return end;
  }
  const duration = endMinutes - previousStartMinutes;
  if (duration <= 0) return end;
  return toTimeValue(Math.min(nextStartMinutes + duration, LAST_MINUTE_OF_DAY));
}

function toMinutes(time: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(time)) return null;
  const [hour, minute] = time.split(':').map(Number);
  return hour < 24 && minute < 60 ? hour * 60 + minute : null;
}

function toTimeValue(minutes: number): string {
  const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
  const minute = String(minutes % 60).padStart(2, '0');
  return `${hour}:${minute}`;
}
