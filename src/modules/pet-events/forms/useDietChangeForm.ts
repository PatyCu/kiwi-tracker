import { useCallback, useMemo, useState } from 'react';

import {
  DietChangeInput,
  DietItemInput,
  DietItemSnapshot,
  DietItemType,
} from '@/modules/pet-events/model/PetEvent';
import { toDisplayedEventDateTime, toEventTimestamp } from '@/shared/dates/dateTime';

export type DietChangeType = 'replace' | 'add' | 'remove';

type UseDietChangeFormInput = {
  currentDiet: DietItemSnapshot[];
  onSubmit: (change: DietChangeInput, note: string, occurredAt: string) => Promise<void>;
};

export function useDietChangeForm({ currentDiet, onSubmit }: UseDietChangeFormInput) {
  const [initialDateTime, setInitialDateTime] = useState(toDisplayedEventDateTime);
  const [visible, setVisible] = useState(false);
  const [changeType, setChangeType] = useState<DietChangeType>('add');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [foodType, setFoodType] = useState<DietItemType>('dry-food');
  const [note, setNote] = useState('');
  const [occurredDate, setOccurredDate] = useState(initialDateTime.date);
  const [occurredTime, setOccurredTime] = useState(initialDateTime.time);
  const [isSaving, setIsSaving] = useState(false);
  const occurredAt = useMemo(
    () => toEventTimestamp(occurredDate, occurredTime),
    [occurredDate, occurredTime],
  );
  const selectedItem = currentDiet.find((item) => item.id === selectedItemId) ?? null;
  const itemIsValid =
    changeType === 'remove'
      ? selectedItem !== null
      : productName.trim().length > 0 && (changeType !== 'replace' || selectedItem !== null);
  const canSubmit = occurredAt !== null && itemIsValid;
  const isDirty =
    changeType !== 'add' ||
    selectedItemId !== (currentDiet[0]?.id ?? null) ||
    productName.length > 0 ||
    foodType !== 'dry-food' ||
    note.length > 0 ||
    occurredDate !== initialDateTime.date ||
    occurredTime !== initialDateTime.time;

  const reset = useCallback(() => {
    const currentDateTime = toDisplayedEventDateTime();
    setInitialDateTime(currentDateTime);
    setChangeType('add');
    setSelectedItemId(currentDiet[0]?.id ?? null);
    setProductName('');
    setFoodType('dry-food');
    setNote('');
    setOccurredDate(currentDateTime.date);
    setOccurredTime(currentDateTime.time);
  }, [currentDiet]);

  const open = useCallback(() => {
    reset();
    setVisible(true);
  }, [reset]);
  const close = useCallback(() => {
    setVisible(false);
    reset();
  }, [reset]);

  const submit = useCallback(async (): Promise<boolean> => {
    if (isSaving || occurredAt === null || !itemIsValid) return false;
    setIsSaving(true);
    try {
      let change: DietChangeInput;
      if (changeType === 'remove') {
        if (!selectedItem) return false;
        change = { type: 'remove', item: selectedItem };
      } else {
        const item = toDietItemInput(productName, foodType);
        if (changeType === 'replace') {
          if (!selectedItem) return false;
          change = { type: 'replace', previousItem: selectedItem, nextItem: item };
        } else {
          change = { type: 'add', item };
        }
      }

      await onSubmit(change, note, occurredAt);
      reset();
      setVisible(false);
      return true;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    changeType,
    foodType,
    isSaving,
    itemIsValid,
    productName,
    note,
    occurredAt,
    onSubmit,
    reset,
    selectedItem,
  ]);

  return {
    visible,
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

function toDietItemInput(productName: string, foodType: DietItemType): DietItemInput {
  return {
    productName: productName.trim(),
    foodType,
  };
}
