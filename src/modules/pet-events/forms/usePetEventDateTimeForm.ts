import { useCallback, useMemo, useState } from 'react';

import { toDisplayedEventDateTime, toEventTimestamp } from '@/shared/dates/dateTime';

type UsePetEventDateTimeFormInput = {
  onSubmit: (eventId: string, occurredAt: string) => Promise<void>;
};

export function usePetEventDateTimeForm({ onSubmit }: UsePetEventDateTimeFormInput) {
  const [visible, setVisible] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [initialDate, setInitialDate] = useState('');
  const [initialTime, setInitialTime] = useState('');
  const [occurredDate, setOccurredDate] = useState('');
  const [occurredTime, setOccurredTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const occurredAt = useMemo(
    () => toEventTimestamp(occurredDate, occurredTime),
    [occurredDate, occurredTime],
  );
  const dateTimeIsValid = occurredAt !== null;
  const isDirty = occurredDate !== initialDate || occurredTime !== initialTime;

  const open = useCallback((id: string, title: string, currentOccurredAt: string) => {
    const currentDateTime = toDisplayedEventDateTime(new Date(currentOccurredAt));
    setEventId(id);
    setEventTitle(title);
    setInitialDate(currentDateTime.date);
    setInitialTime(currentDateTime.time);
    setOccurredDate(currentDateTime.date);
    setOccurredTime(currentDateTime.time);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setEventId(null);
    setEventTitle('');
    setInitialDate('');
    setInitialTime('');
    setOccurredDate('');
    setOccurredTime('');
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (isSaving || !eventId || occurredAt === null || !isDirty) return false;
    setIsSaving(true);
    try {
      await onSubmit(eventId, occurredAt);
      close();
      return true;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [close, eventId, isDirty, isSaving, occurredAt, onSubmit]);

  return {
    visible,
    eventTitle,
    occurredDate,
    occurredTime,
    dateTimeIsValid,
    isDirty,
    isSaving,
    open,
    close,
    setOccurredDate,
    setOccurredTime,
    submit,
  };
}
