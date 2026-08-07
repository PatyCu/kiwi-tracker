import { useCallback, useMemo, useState } from 'react';

import { toDisplayedEventDateTime, toEventTimestamp } from '@/shared/dates/dateTime';

type UseOtherEventFormInput = {
  onSubmit: (title: string, note: string, occurredAt: string) => Promise<void>;
};

export function useOtherEventForm({ onSubmit }: UseOtherEventFormInput) {
  const [initialDateTime, setInitialDateTime] = useState(toDisplayedEventDateTime);
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [occurredDate, setOccurredDate] = useState(initialDateTime.date);
  const [occurredTime, setOccurredTime] = useState(initialDateTime.time);
  const [isSaving, setIsSaving] = useState(false);
  const occurredAt = useMemo(
    () => toEventTimestamp(occurredDate, occurredTime),
    [occurredDate, occurredTime],
  );
  const titleIsValid = title.trim().length > 0;
  const dateTimeIsValid = occurredAt !== null;
  const isDirty =
    title.length > 0 ||
    note.length > 0 ||
    occurredDate !== initialDateTime.date ||
    occurredTime !== initialDateTime.time;

  const reset = useCallback(() => {
    const currentDateTime = toDisplayedEventDateTime();
    setInitialDateTime(currentDateTime);
    setTitle('');
    setNote('');
    setOccurredDate(currentDateTime.date);
    setOccurredTime(currentDateTime.time);
  }, []);

  const open = useCallback(() => {
    reset();
    setVisible(true);
  }, [reset]);
  const close = useCallback(() => {
    setVisible(false);
    reset();
  }, [reset]);
  const submit = useCallback(async (): Promise<boolean> => {
    if (isSaving || occurredAt === null || !titleIsValid) return false;
    setIsSaving(true);
    try {
      await onSubmit(title.trim(), note, occurredAt);
      reset();
      setVisible(false);
      return true;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, note, occurredAt, onSubmit, reset, title, titleIsValid]);

  return {
    visible,
    title,
    note,
    occurredDate,
    occurredTime,
    titleIsValid,
    dateTimeIsValid,
    isDirty,
    isSaving,
    open,
    close,
    setTitle,
    setNote,
    setOccurredDate,
    setOccurredTime,
    submit,
  };
}
