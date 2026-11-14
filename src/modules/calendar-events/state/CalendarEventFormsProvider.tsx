import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { useCalendarEventForm } from '@/modules/calendar-events/forms/useCalendarEventForm';
import { useCalendarEvents } from '@/modules/calendar-events/state/CalendarEventsProvider';
import { CalendarEventModal } from '@/modules/calendar-events/ui/CalendarEventModal';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { confirmDiscardChanges, showMessage } from '@/shared/platform/dialogs';
import { useAppearance } from '@/shared/theme/AppearanceProvider';

type CalendarEventFormsContextValue = {
  /** Opens the form for a pet, or with a pet picker when none is given and there are several. */
  openAddCalendarEvent: (petId?: string) => void;
};

const CalendarEventFormsContext = createContext<CalendarEventFormsContextValue | null>(null);

export function CalendarEventFormsProvider({ children }: { children: ReactNode }) {
  const { colors } = useAppearance();
  const { pets } = usePets();
  const { addCalendarEvent } = useCalendarEvents();
  const [targetPetId, setTargetPetId] = useState<string | null>(null);
  const [showPetChoice, setShowPetChoice] = useState(false);

  const form = useCalendarEventForm({
    onSubmit: async (input) => {
      if (!targetPetId) throw new Error('A pet is required.');
      await addCalendarEvent({ ...input, petId: targetPetId });
    },
  });

  const openForm = form.open;
  const openAddCalendarEvent = useCallback(
    (petId?: string) => {
      const nextPetId = petId ?? pets[0]?.id ?? null;
      if (!nextPetId) return;
      setTargetPetId(nextPetId);
      setShowPetChoice(petId === undefined && pets.length > 1);
      openForm();
    },
    [openForm, pets],
  );

  const close = () => {
    if (form.isSaving) return;
    if (!form.isDirty) form.close();
    else confirmDiscardChanges('Discard this calendar event?', form.close);
  };

  const value = useMemo(() => ({ openAddCalendarEvent }), [openAddCalendarEvent]);

  return (
    <CalendarEventFormsContext.Provider value={value}>
      {children}
      <CalendarEventModal
        visible={form.visible}
        title={form.title}
        date={form.date}
        startTime={form.startTime}
        endTime={form.endTime}
        location={form.location}
        description={form.description}
        titleIsValid={form.titleIsValid}
        startIsValid={form.startIsValid}
        endIsAfterStart={form.endIsAfterStart}
        isSaving={form.isSaving}
        colors={colors}
        petChoice={
          showPetChoice && targetPetId
            ? { pets, selectedPetId: targetPetId, onSelectPet: setTargetPetId }
            : undefined
        }
        onTitleChange={form.setTitle}
        onDateChange={form.setDate}
        onStartTimeChange={form.setStartTime}
        onEndTimeChange={form.setEndTime}
        onLocationChange={form.setLocation}
        onDescriptionChange={form.setDescription}
        onSave={() =>
          void form
            .submit()
            .then(
              (saved) =>
                !saved &&
                showMessage(
                  'Calendar event not saved',
                  'Your details are still in the form; please try again.',
                ),
            )
        }
        onClose={close}
      />
    </CalendarEventFormsContext.Provider>
  );
}

export function useCalendarEventForms(): CalendarEventFormsContextValue {
  const value = useContext(CalendarEventFormsContext);
  if (!value) {
    throw new Error('useCalendarEventForms must be used inside CalendarEventFormsProvider.');
  }
  return value;
}
