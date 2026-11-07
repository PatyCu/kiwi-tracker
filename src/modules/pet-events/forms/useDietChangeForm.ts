import { useCallback, useMemo, useState } from 'react';

import {
  DietChange,
  DietChangeEvent,
  DietChangeInput,
  DietItemInput,
  DietItemSnapshot,
  DietItemType,
  PetEventEdit,
} from '@/modules/pet-events/model/PetEvent';
import { toDisplayedEventDateTime, toEventTimestamp } from '@/shared/dates/dateTime';

export type DietChangeType = 'replace' | 'add' | 'remove';

type UseDietChangeFormInput = {
  currentDiet: DietItemSnapshot[];
  onSubmit: (change: DietChangeInput, note: string, occurredAt: string) => Promise<void>;
  onUpdate?: (eventId: string, edit: PetEventEdit) => Promise<void>;
};

type DietChangeFormValues = {
  changeType: DietChangeType;
  selectedItemId: string | null;
  productName: string;
  foodType: DietItemType;
  note: string;
  occurredDate: string;
  occurredTime: string;
};

type EditedDietChange = { eventId: string; change: DietChange };

function newDietChangeValues(currentDiet: DietItemSnapshot[]): DietChangeFormValues {
  const { date, time } = toDisplayedEventDateTime();
  return {
    changeType: 'add',
    selectedItemId: currentDiet[0]?.id ?? null,
    productName: '',
    foodType: 'dry-food',
    note: '',
    occurredDate: date,
    occurredTime: time,
  };
}

function toEditValues(event: DietChangeEvent): DietChangeFormValues {
  const { date, time } = toDisplayedEventDateTime(new Date(event.occurredAt));
  const { change } = event;
  const introduced = change.type === 'replace' ? change.nextItem : change.item;
  return {
    changeType: change.type,
    selectedItemId: change.type === 'replace' ? change.previousItem.id : change.item.id,
    productName: change.type === 'remove' ? '' : introduced.productName,
    foodType: change.type === 'remove' ? 'dry-food' : introduced.foodType,
    note: event.note ?? '',
    occurredDate: date,
    occurredTime: time,
  };
}

export function useDietChangeForm({ currentDiet, onSubmit, onUpdate }: UseDietChangeFormInput) {
  const [initialValues, setInitialValues] = useState(() => newDietChangeValues(currentDiet));
  const [edited, setEdited] = useState<EditedDietChange | null>(null);
  const [visible, setVisible] = useState(false);
  const [changeType, setChangeType] = useState<DietChangeType>(initialValues.changeType);
  const [selectedItemId, setSelectedItemId] = useState(initialValues.selectedItemId);
  const [productName, setProductName] = useState(initialValues.productName);
  const [foodType, setFoodType] = useState<DietItemType>(initialValues.foodType);
  const [note, setNote] = useState(initialValues.note);
  const [occurredDate, setOccurredDate] = useState(initialValues.occurredDate);
  const [occurredTime, setOccurredTime] = useState(initialValues.occurredTime);
  const [isSaving, setIsSaving] = useState(false);
  const occurredAt = useMemo(
    () => toEventTimestamp(occurredDate, occurredTime),
    [occurredDate, occurredTime],
  );
  const selectedItem = currentDiet.find((item) => item.id === selectedItemId) ?? null;
  // When editing, the replaced or stopped item is fixed, so only the new item is checked.
  const itemIsValid = edited
    ? changeType === 'remove' || productName.trim().length > 0
    : changeType === 'remove'
      ? selectedItem !== null
      : productName.trim().length > 0 && (changeType !== 'replace' || selectedItem !== null);
  const canSubmit = occurredAt !== null && itemIsValid;
  const isDirty =
    changeType !== initialValues.changeType ||
    selectedItemId !== initialValues.selectedItemId ||
    productName !== initialValues.productName ||
    foodType !== initialValues.foodType ||
    note !== initialValues.note ||
    occurredDate !== initialValues.occurredDate ||
    occurredTime !== initialValues.occurredTime;

  const load = useCallback((values: DietChangeFormValues, nextEdited: EditedDietChange | null) => {
    setInitialValues(values);
    setEdited(nextEdited);
    setChangeType(values.changeType);
    setSelectedItemId(values.selectedItemId);
    setProductName(values.productName);
    setFoodType(values.foodType);
    setNote(values.note);
    setOccurredDate(values.occurredDate);
    setOccurredTime(values.occurredTime);
  }, []);
  const reset = useCallback(
    () => load(newDietChangeValues(currentDiet), null),
    [currentDiet, load],
  );

  const open = useCallback(() => {
    reset();
    setVisible(true);
  }, [reset]);
  const openForEdit = useCallback(
    (event: DietChangeEvent) => {
      load(toEditValues(event), { eventId: event.id, change: event.change });
      setVisible(true);
    },
    [load],
  );
  // Values are cleared when the form next opens, so the sheet keeps its content while it
  // animates closed.
  const close = useCallback(() => setVisible(false), []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!visible || isSaving || occurredAt === null || !itemIsValid) return false;
    if (edited && (!onUpdate || !isDirty)) return false;
    setIsSaving(true);
    try {
      if (edited && onUpdate) {
        await onUpdate(edited.eventId, {
          type: 'diet-change',
          note,
          occurredAt,
          ...(edited.change.type === 'remove'
            ? {}
            : { item: toDietItemInput(productName, foodType) }),
        });
      } else {
        const change = toDietChangeInput(changeType, selectedItem, productName, foodType);
        if (!change) return false;
        await onSubmit(change, note, occurredAt);
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
    changeType,
    edited,
    foodType,
    isDirty,
    isSaving,
    itemIsValid,
    note,
    occurredAt,
    onSubmit,
    onUpdate,
    productName,
    selectedItem,
  ]);

  return {
    visible,
    isEditing: edited !== null,
    editedChange: edited?.change ?? null,
    changeType,
    selectedItemId,
    productName,
    foodType,
    note,
    occurredDate,
    occurredTime,
    dateTimeIsValid: occurredAt !== null,
    itemIsValid,
    canSubmit,
    isDirty,
    isSaving,
    open,
    openForEdit,
    close,
    setChangeType,
    setSelectedItemId,
    setProductName,
    setFoodType,
    setNote,
    setOccurredDate,
    setOccurredTime,
    submit,
  };
}

function toDietChangeInput(
  changeType: DietChangeType,
  selectedItem: DietItemSnapshot | null,
  productName: string,
  foodType: DietItemType,
): DietChangeInput | null {
  if (changeType === 'remove') return selectedItem ? { type: 'remove', item: selectedItem } : null;
  const item = toDietItemInput(productName, foodType);
  if (changeType === 'replace') {
    return selectedItem ? { type: 'replace', previousItem: selectedItem, nextItem: item } : null;
  }
  return { type: 'add', item };
}

function toDietItemInput(productName: string, foodType: DietItemType): DietItemInput {
  return {
    productName: productName.trim(),
    foodType,
  };
}
