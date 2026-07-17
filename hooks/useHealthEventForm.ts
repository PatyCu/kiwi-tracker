import { useCallback, useMemo, useState } from 'react';

import { toDisplayedHealthEventDateTime, toHealthEventTimestamp } from '@/lib/dateUtils';
import { HealthEventKind } from '@/lib/healthEvents';

type UseHealthEventFormInput = {
  onSubmit: (kind: HealthEventKind, note: string, occurredAt: string) => Promise<void>;
};

export function useHealthEventForm({ onSubmit }: UseHealthEventFormInput) {
  const [initialDateTime, setInitialDateTime] = useState(toDisplayedHealthEventDateTime);
  const [visible, setVisible] = useState(false);
  const [kind, setKind] = useState<HealthEventKind>('Vomiting');
  const [note, setNote] = useState('');
  const [occurredDate, setOccurredDate] = useState(initialDateTime.date);
  const [occurredTime, setOccurredTime] = useState(initialDateTime.time);
  const [isSaving, setIsSaving] = useState(false);
  const occurredAt = useMemo(
    () => toHealthEventTimestamp(occurredDate, occurredTime),
    [occurredDate, occurredTime],
  );
  const dateTimeIsValid = occurredAt !== null;
  const isDirty =
    kind !== 'Vomiting' ||
    note.length > 0 ||
    occurredDate !== initialDateTime.date ||
    occurredTime !== initialDateTime.time;

  const reset = useCallback(() => {
    const currentDateTime = toDisplayedHealthEventDateTime();
    setInitialDateTime(currentDateTime);
    setKind('Vomiting');
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
    if (isSaving || occurredAt === null) return false;
    setIsSaving(true);
    try {
      await onSubmit(kind, note, occurredAt);
      reset();
      setVisible(false);
      return true;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, kind, note, occurredAt, onSubmit, reset]);

  return {
    visible,
    kind,
    note,
    occurredDate,
    occurredTime,
    dateTimeIsValid,
    isDirty,
    isSaving,
    open,
    close,
    setKind,
    setNote,
    setOccurredDate,
    setOccurredTime,
    submit,
  };
}
