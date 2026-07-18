import { useCallback, useMemo, useState } from 'react';

import { toDisplayedEventDateTime, toEventTimestamp } from '@/lib/dateUtils';
import { SymptomKind } from '@/lib/timelineEvents';

type UseSymptomFormInput = {
  onSubmit: (symptom: SymptomKind, note: string, occurredAt: string) => Promise<void>;
};

export function useSymptomForm({ onSubmit }: UseSymptomFormInput) {
  const [initialDateTime, setInitialDateTime] = useState(toDisplayedEventDateTime);
  const [visible, setVisible] = useState(false);
  const [symptom, setSymptom] = useState<SymptomKind>('Vomiting');
  const [note, setNote] = useState('');
  const [occurredDate, setOccurredDate] = useState(initialDateTime.date);
  const [occurredTime, setOccurredTime] = useState(initialDateTime.time);
  const [isSaving, setIsSaving] = useState(false);
  const occurredAt = useMemo(
    () => toEventTimestamp(occurredDate, occurredTime),
    [occurredDate, occurredTime],
  );
  const dateTimeIsValid = occurredAt !== null;
  const isDirty =
    symptom !== 'Vomiting' ||
    note.length > 0 ||
    occurredDate !== initialDateTime.date ||
    occurredTime !== initialDateTime.time;

  const reset = useCallback(() => {
    const currentDateTime = toDisplayedEventDateTime();
    setInitialDateTime(currentDateTime);
    setSymptom('Vomiting');
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
      await onSubmit(symptom, note, occurredAt);
      reset();
      setVisible(false);
      return true;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, note, occurredAt, onSubmit, reset, symptom]);

  return {
    visible,
    symptom,
    note,
    occurredDate,
    occurredTime,
    dateTimeIsValid,
    isDirty,
    isSaving,
    open,
    close,
    setSymptom,
    setNote,
    setOccurredDate,
    setOccurredTime,
    submit,
  };
}
