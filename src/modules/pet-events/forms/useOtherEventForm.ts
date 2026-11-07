import { useCallback, useMemo, useState } from 'react';

import { OtherEvent, PetEventEdit } from '@/modules/pet-events/model/PetEvent';
import { toDisplayedEventDateTime, toEventTimestamp } from '@/shared/dates/dateTime';

type UseOtherEventFormInput = {
  onSubmit: (title: string, note: string, occurredAt: string) => Promise<void>;
  onUpdate?: (eventId: string, edit: PetEventEdit) => Promise<void>;
};

type OtherEventFormValues = {
  title: string;
  note: string;
  occurredDate: string;
  occurredTime: string;
};

function newOtherEventValues(): OtherEventFormValues {
  const { date, time } = toDisplayedEventDateTime();
  return { title: '', note: '', occurredDate: date, occurredTime: time };
}

export function useOtherEventForm({ onSubmit, onUpdate }: UseOtherEventFormInput) {
  const [initialValues, setInitialValues] = useState(newOtherEventValues);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState(initialValues.title);
  const [note, setNote] = useState(initialValues.note);
  const [occurredDate, setOccurredDate] = useState(initialValues.occurredDate);
  const [occurredTime, setOccurredTime] = useState(initialValues.occurredTime);
  const [isSaving, setIsSaving] = useState(false);
  const occurredAt = useMemo(
    () => toEventTimestamp(occurredDate, occurredTime),
    [occurredDate, occurredTime],
  );
  const titleIsValid = title.trim().length > 0;
  const dateTimeIsValid = occurredAt !== null;
  const isDirty =
    title !== initialValues.title ||
    note !== initialValues.note ||
    occurredDate !== initialValues.occurredDate ||
    occurredTime !== initialValues.occurredTime;

  const load = useCallback((values: OtherEventFormValues, eventId: string | null) => {
    setInitialValues(values);
    setEditingEventId(eventId);
    setTitle(values.title);
    setNote(values.note);
    setOccurredDate(values.occurredDate);
    setOccurredTime(values.occurredTime);
  }, []);
  const reset = useCallback(() => load(newOtherEventValues(), null), [load]);

  const open = useCallback(() => {
    reset();
    setVisible(true);
  }, [reset]);
  const openForEdit = useCallback(
    (event: OtherEvent) => {
      const { date, time } = toDisplayedEventDateTime(new Date(event.occurredAt));
      load(
        { title: event.title, note: event.note ?? '', occurredDate: date, occurredTime: time },
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
    if (!visible || isSaving || occurredAt === null || !titleIsValid) return false;
    if (editingEventId && (!onUpdate || !isDirty)) return false;
    setIsSaving(true);
    try {
      if (editingEventId && onUpdate) {
        await onUpdate(editingEventId, { type: 'other', title: title.trim(), note, occurredAt });
      } else {
        await onSubmit(title.trim(), note, occurredAt);
      }
      setVisible(false);
      return true;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    visible,
    editingEventId,
    isDirty,
    isSaving,
    note,
    occurredAt,
    onSubmit,
    onUpdate,
    title,
    titleIsValid,
  ]);

  return {
    visible,
    isEditing: editingEventId !== null,
    title,
    note,
    occurredDate,
    occurredTime,
    titleIsValid,
    dateTimeIsValid,
    isDirty,
    isSaving,
    open,
    openForEdit,
    close,
    setTitle,
    setNote,
    setOccurredDate,
    setOccurredTime,
    submit,
  };
}
