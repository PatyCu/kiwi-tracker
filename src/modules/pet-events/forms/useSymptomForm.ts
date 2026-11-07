import { useCallback, useMemo, useState } from 'react';

import { PetEventEdit, SymptomEvent, SymptomKind } from '@/modules/pet-events/model/PetEvent';
import { toDisplayedEventDateTime, toEventTimestamp } from '@/shared/dates/dateTime';

type UseSymptomFormInput = {
  onSubmit: (symptom: SymptomKind, note: string, occurredAt: string) => Promise<void>;
  onUpdate?: (eventId: string, edit: PetEventEdit) => Promise<void>;
};

type SymptomFormValues = {
  symptom: SymptomKind;
  note: string;
  occurredDate: string;
  occurredTime: string;
};

function newSymptomValues(): SymptomFormValues {
  const { date, time } = toDisplayedEventDateTime();
  return { symptom: 'Vomiting', note: '', occurredDate: date, occurredTime: time };
}

export function useSymptomForm({ onSubmit, onUpdate }: UseSymptomFormInput) {
  const [initialValues, setInitialValues] = useState(newSymptomValues);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [symptom, setSymptom] = useState<SymptomKind>(initialValues.symptom);
  const [note, setNote] = useState(initialValues.note);
  const [occurredDate, setOccurredDate] = useState(initialValues.occurredDate);
  const [occurredTime, setOccurredTime] = useState(initialValues.occurredTime);
  const [isSaving, setIsSaving] = useState(false);
  const occurredAt = useMemo(
    () => toEventTimestamp(occurredDate, occurredTime),
    [occurredDate, occurredTime],
  );
  const dateTimeIsValid = occurredAt !== null;
  const isDirty =
    symptom !== initialValues.symptom ||
    note !== initialValues.note ||
    occurredDate !== initialValues.occurredDate ||
    occurredTime !== initialValues.occurredTime;

  const load = useCallback((values: SymptomFormValues, eventId: string | null) => {
    setInitialValues(values);
    setEditingEventId(eventId);
    setSymptom(values.symptom);
    setNote(values.note);
    setOccurredDate(values.occurredDate);
    setOccurredTime(values.occurredTime);
  }, []);
  const reset = useCallback(() => load(newSymptomValues(), null), [load]);

  const open = useCallback(() => {
    reset();
    setVisible(true);
  }, [reset]);
  const openForEdit = useCallback(
    (event: SymptomEvent) => {
      const { date, time } = toDisplayedEventDateTime(new Date(event.occurredAt));
      load(
        { symptom: event.symptom, note: event.note ?? '', occurredDate: date, occurredTime: time },
        event.id,
      );
      setVisible(true);
    },
    [load],
  );
  // Values are cleared when the form next opens, so the sheet keeps its content while it
  // animates closed.
  const close = useCallback(() => setVisible(false), []);
  const submit = useCallback(async (): Promise<boolean> => {
    if (!visible || isSaving || occurredAt === null) return false;
    if (editingEventId && (!onUpdate || !isDirty)) return false;
    setIsSaving(true);
    try {
      if (editingEventId && onUpdate) {
        await onUpdate(editingEventId, { type: 'symptom', symptom, note, occurredAt });
      } else {
        await onSubmit(symptom, note, occurredAt);
      }
      setVisible(false);
      return true;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [visible, editingEventId, isDirty, isSaving, note, occurredAt, onSubmit, onUpdate, symptom]);

  return {
    visible,
    isEditing: editingEventId !== null,
    symptom,
    note,
    occurredDate,
    occurredTime,
    dateTimeIsValid,
    isDirty,
    isSaving,
    open,
    openForEdit,
    close,
    setSymptom,
    setNote,
    setOccurredDate,
    setOccurredTime,
    submit,
  };
}
