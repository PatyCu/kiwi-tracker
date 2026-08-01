import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { useDietChangeForm } from '@/modules/pet-events/forms/useDietChangeForm';
import { useOtherEventForm } from '@/modules/pet-events/forms/useOtherEventForm';
import { usePetEventDateTimeForm } from '@/modules/pet-events/forms/usePetEventDateTimeForm';
import { useSymptomForm } from '@/modules/pet-events/forms/useSymptomForm';
import { getCurrentDiet } from '@/modules/pet-events/model/getCurrentDiet';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { TimelineEntry } from '@/modules/pet-events/timeline/toTimelineEntries';
import { DeletePetEventModal } from '@/modules/pet-events/ui/DeletePetEventModal';
import { DietChangeModal } from '@/modules/pet-events/ui/DietChangeModal';
import { EditPetEventDateTimeModal } from '@/modules/pet-events/ui/EditPetEventDateTimeModal';
import { OtherEventModal } from '@/modules/pet-events/ui/OtherEventModal';
import { PetEventPetField } from '@/modules/pet-events/ui/PetEventPetField';
import { SymptomModal } from '@/modules/pet-events/ui/SymptomModal';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { confirmDiscardChanges, showMessage } from '@/shared/platform/dialogs';

type PetEventFormsContextValue = {
  openSymptom: (petId?: string) => void;
  openDietChange: (petId?: string) => void;
  openOtherEvent: (petId?: string) => void;
  editEventDateTime: (entry: TimelineEntry) => void;
  requestDeleteEvent: (entry: TimelineEntry, petName: string) => void;
};

const PetEventFormsContext = createContext<PetEventFormsContextValue | null>(null);

export function PetEventFormsProvider({ children }: { children: ReactNode }) {
  const { colors } = useAppearance();
  const { pets } = usePets();
  const {
    events,
    logSymptom,
    logDietChange,
    logOtherEvent,
    deleteEvent,
    deletingEventId,
    updateEventOccurredAt,
    updatingEventId,
  } = usePetEvents();
  const [targetPetId, setTargetPetId] = useState<string | null>(null);
  const [showPetField, setShowPetField] = useState(false);
  const [eventPendingDeletion, setEventPendingDeletion] = useState<TimelineEntry | null>(null);
  const [deletionPetName, setDeletionPetName] = useState('this pet');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const currentDiet = useMemo(
    () => (targetPetId ? getCurrentDiet(events, targetPetId) : []),
    [events, targetPetId],
  );
  const symptomForm = useSymptomForm({
    onSubmit: async (symptom, note, occurredAt) => {
      if (!targetPetId) throw new Error('A pet is required.');
      await logSymptom(targetPetId, symptom, note, occurredAt);
    },
  });
  const dietForm = useDietChangeForm({
    currentDiet,
    onSubmit: async (input, note, occurredAt) => {
      if (!targetPetId) throw new Error('A pet is required.');
      await logDietChange(targetPetId, input, note, occurredAt);
    },
  });
  const otherForm = useOtherEventForm({
    onSubmit: async (title, note, occurredAt) => {
      if (!targetPetId) throw new Error('A pet is required.');
      await logOtherEvent(targetPetId, title, note, occurredAt);
    },
  });
  const dateTimeForm = usePetEventDateTimeForm({ onSubmit: updateEventOccurredAt });

  const prepareTargetPet = useCallback(
    (petId?: string) => {
      const nextPetId = petId ?? pets[0]?.id ?? null;
      setTargetPetId(nextPetId);
      setShowPetField(petId === undefined && pets.length > 1);
      return nextPetId;
    },
    [pets],
  );
  const openSymptom = useCallback(
    (petId?: string) => {
      if (!prepareTargetPet(petId)) return;
      symptomForm.open();
    },
    [prepareTargetPet, symptomForm],
  );
  const openDietChange = useCallback(
    (petId?: string) => {
      if (!prepareTargetPet(petId)) return;
      dietForm.open();
    },
    [dietForm, prepareTargetPet],
  );
  const openOtherEvent = useCallback(
    (petId?: string) => {
      if (!prepareTargetPet(petId)) return;
      otherForm.open();
    },
    [otherForm, prepareTargetPet],
  );

  const petField = showPetField && targetPetId && (
    <PetEventPetField pets={pets} selectedPetId={targetPetId} onSelectPet={setTargetPetId} />
  );

  const confirmDiscard = useCallback(
    (title: string, isDirty: boolean, isSaving: boolean, close: () => void) => {
      if (isSaving) return;
      if (!isDirty) {
        close();
        return;
      }
      confirmDiscardChanges(title, close);
    },
    [],
  );

  const confirmDeletion = async () => {
    if (!eventPendingDeletion) return;
    setDeleteError(null);
    try {
      await deleteEvent(eventPendingDeletion.id);
      setEventPendingDeletion(null);
    } catch {
      setDeleteError('This event could not be deleted. It is still saved. Please try again.');
    }
  };

  const value = useMemo<PetEventFormsContextValue>(
    () => ({
      openSymptom,
      openDietChange,
      openOtherEvent,
      editEventDateTime: (entry) => dateTimeForm.open(entry.id, entry.title, entry.occurredAt),
      requestDeleteEvent: (entry, petName) => {
        setDeleteError(null);
        setDeletionPetName(petName);
        setEventPendingDeletion(entry);
      },
    }),
    [dateTimeForm, openDietChange, openOtherEvent, openSymptom],
  );

  return (
    <PetEventFormsContext.Provider value={value}>
      {children}
      <DeletePetEventModal
        visible={eventPendingDeletion !== null}
        entry={eventPendingDeletion}
        petName={deletionPetName}
        isDeleting={deletingEventId !== null}
        error={deleteError}
        colors={colors}
        onCancel={() => {
          if (!deletingEventId) setEventPendingDeletion(null);
        }}
        onConfirm={() => void confirmDeletion()}
      />
      <EditPetEventDateTimeModal
        visible={dateTimeForm.visible}
        eventTitle={dateTimeForm.eventTitle}
        occurredDate={dateTimeForm.occurredDate}
        occurredTime={dateTimeForm.occurredTime}
        dateTimeIsValid={dateTimeForm.dateTimeIsValid}
        isDirty={dateTimeForm.isDirty}
        isSaving={dateTimeForm.isSaving || updatingEventId !== null}
        colors={colors}
        onOccurredDateChange={dateTimeForm.setOccurredDate}
        onOccurredTimeChange={dateTimeForm.setOccurredTime}
        onSave={() => void dateTimeForm.submit()}
        onClose={() =>
          confirmDiscard(
            'Discard date and time changes?',
            dateTimeForm.isDirty,
            dateTimeForm.isSaving,
            dateTimeForm.close,
          )
        }
      />
      <SymptomModal
        visible={symptomForm.visible}
        symptom={symptomForm.symptom}
        note={symptomForm.note}
        occurredDate={symptomForm.occurredDate}
        occurredTime={symptomForm.occurredTime}
        dateTimeIsValid={symptomForm.dateTimeIsValid}
        isSaving={symptomForm.isSaving}
        colors={colors}
        petField={petField}
        onSymptomChange={symptomForm.setSymptom}
        onNoteChange={symptomForm.setNote}
        onOccurredDateChange={symptomForm.setOccurredDate}
        onOccurredTimeChange={symptomForm.setOccurredTime}
        onSave={() =>
          void symptomForm
            .submit()
            .then((saved) => !saved && showMessage('Symptom not saved', 'Please try again.'))
        }
        onClose={() =>
          confirmDiscard(
            'Discard this symptom?',
            symptomForm.isDirty,
            symptomForm.isSaving,
            symptomForm.close,
          )
        }
      />
      <DietChangeModal
        visible={dietForm.visible}
        changeType={dietForm.changeType}
        selectedItemId={dietForm.selectedItemId}
        currentDiet={currentDiet}
        productName={dietForm.productName}
        foodType={dietForm.foodType}
        note={dietForm.note}
        occurredDate={dietForm.occurredDate}
        occurredTime={dietForm.occurredTime}
        dateTimeIsValid={dietForm.dateTimeIsValid}
        itemIsValid={dietForm.itemIsValid}
        isSaving={dietForm.isSaving}
        colors={colors}
        petField={petField}
        onChangeTypeChange={dietForm.setChangeType}
        onSelectedItemChange={dietForm.setSelectedItemId}
        onProductNameChange={dietForm.setProductName}
        onFoodTypeChange={dietForm.setFoodType}
        onNoteChange={dietForm.setNote}
        onOccurredDateChange={dietForm.setOccurredDate}
        onOccurredTimeChange={dietForm.setOccurredTime}
        onSave={() =>
          void dietForm
            .submit()
            .then((saved) => !saved && showMessage('Diet change not saved', 'Please try again.'))
        }
        onClose={() =>
          confirmDiscard(
            'Discard this diet change?',
            dietForm.isDirty,
            dietForm.isSaving,
            dietForm.close,
          )
        }
      />
      <OtherEventModal
        visible={otherForm.visible}
        title={otherForm.title}
        note={otherForm.note}
        occurredDate={otherForm.occurredDate}
        occurredTime={otherForm.occurredTime}
        titleIsValid={otherForm.titleIsValid}
        dateTimeIsValid={otherForm.dateTimeIsValid}
        isSaving={otherForm.isSaving}
        colors={colors}
        petField={petField}
        onTitleChange={otherForm.setTitle}
        onNoteChange={otherForm.setNote}
        onOccurredDateChange={otherForm.setOccurredDate}
        onOccurredTimeChange={otherForm.setOccurredTime}
        onSave={() =>
          void otherForm
            .submit()
            .then((saved) => !saved && showMessage('Event not saved', 'Please try again.'))
        }
        onClose={() =>
          confirmDiscard(
            'Discard this event?',
            otherForm.isDirty,
            otherForm.isSaving,
            otherForm.close,
          )
        }
      />
    </PetEventFormsContext.Provider>
  );
}

export function usePetEventForms(): PetEventFormsContextValue {
  const value = useContext(PetEventFormsContext);
  if (!value) throw new Error('usePetEventForms must be used inside PetEventFormsProvider.');
  return value;
}
