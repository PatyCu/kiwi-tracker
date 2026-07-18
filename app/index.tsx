import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert as NativeAlert,
  Platform,
  ScrollView,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Appearance, AppearanceModal } from '@/components/dashboard/AppearanceModal';
import { BottomNavigation, DashboardTab } from '@/components/dashboard/BottomNavigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardLoadState } from '@/components/dashboard/DashboardLoadState';
import { DeleteTimelineEventModal } from '@/components/dashboard/DeleteTimelineEventModal';
import { DietChangeModal } from '@/components/dashboard/DietChangeModal';
import { EditTimelineEventDateTimeModal } from '@/components/dashboard/EditTimelineEventDateTimeModal';
import { OtherEventModal } from '@/components/dashboard/OtherEventModal';
import { PetProfileModal } from '@/components/dashboard/PetProfileModal';
import { PetSelector } from '@/components/dashboard/PetSelector';
import { SymptomModal } from '@/components/dashboard/SymptomModal';
import { Timeline } from '@/components/dashboard/Timeline';
import { TodaySummary } from '@/components/dashboard/TodaySummary';
import { UpcomingCare } from '@/components/dashboard/UpcomingCare';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useDietChangeForm } from '@/hooks/useDietChangeForm';
import { useOtherEventForm } from '@/hooks/useOtherEventForm';
import { usePetProfileForm } from '@/hooks/usePetProfileForm';
import { useSymptomForm } from '@/hooks/useSymptomForm';
import { useTimelineEventDateTimeForm } from '@/hooks/useTimelineEventDateTimeForm';
import { TimelineEntry, toTimelineEntries } from '@/lib/timelineEventPresentation';
import { darkColors, lightColors, Palette } from '@/lib/theme';

const Alert = {
  alert: (title: string, message: string) =>
    Platform.OS === 'web'
      ? window.alert(`${title}\n\n${message}`)
      : NativeAlert.alert(title, message),
};

export default function Home() {
  const scheme = useColorScheme();
  const [appearance, setAppearance] = useState<Appearance>('system');
  const [appearanceModalOpen, setAppearanceModalOpen] = useState(false);
  const [tab, setTab] = useState<DashboardTab>('Today');
  const [eventPendingDeletion, setEventPendingDeletion] = useState<TimelineEntry | null>(null);
  const [deleteTimelineEventError, setDeleteTimelineEventError] = useState<string | null>(null);
  const isDark = appearance === 'dark' || (appearance === 'system' && scheme === 'dark');
  const colors = isDark ? darkColors : lightColors;
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const wide = useWindowDimensions().width > 780;

  const {
    timelineEvents,
    pets,
    activePet,
    activePetId,
    currentDiet,
    loadStatus,
    photoMigrationWarningPetNames,
    clearPhotoMigrationWarning,
    retryLoad,
    selectPet: persistPetSelection,
    logSymptom,
    logDietChange,
    logOtherEvent,
    deleteTimelineEvent,
    deletingTimelineEventId,
    updateTimelineEventOccurredAt,
    updatingTimelineEventId,
    saveProfile,
  } = useDashboardData();
  const symptomForm = useSymptomForm({ onSubmit: logSymptom });
  const dietChangeForm = useDietChangeForm({ currentDiet, onSubmit: logDietChange });
  const otherEventForm = useOtherEventForm({ onSubmit: logOtherEvent });
  const eventDateTimeForm = useTimelineEventDateTimeForm({
    onSubmit: updateTimelineEventOccurredAt,
  });
  const closeSymptomForm = symptomForm.close;
  const symptomFormIsDirty = symptomForm.isDirty;
  const symptomFormIsSaving = symptomForm.isSaving;
  const closeDietChangeForm = dietChangeForm.close;
  const dietChangeFormIsDirty = dietChangeForm.isDirty;
  const dietChangeFormIsSaving = dietChangeForm.isSaving;
  const closeOtherEventForm = otherEventForm.close;
  const otherEventFormIsDirty = otherEventForm.isDirty;
  const otherEventFormIsSaving = otherEventForm.isSaving;
  const closeEventDateTimeForm = eventDateTimeForm.close;
  const eventDateTimeFormIsDirty = eventDateTimeForm.isDirty;
  const eventDateTimeFormIsSaving = eventDateTimeForm.isSaving;
  const petProfileForm = usePetProfileForm({ onSubmit: saveProfile });
  const timeline = useMemo(
    () => toTimelineEntries(timelineEvents, activePetId, colors.coral, colors.kiwi, colors.muted),
    [activePetId, colors.coral, colors.kiwi, colors.muted, timelineEvents],
  );

  useEffect(() => {
    if (photoMigrationWarningPetNames.length === 0) return;
    Alert.alert(
      'Some photos need updating',
      `Please choose a new photo for ${photoMigrationWarningPetNames.join(', ')} so it can be stored permanently.`,
    );
    clearPhotoMigrationWarning();
  }, [clearPhotoMigrationWarning, photoMigrationWarningPetNames]);

  const selectPet = async (petId: string) => {
    if (await persistPetSelection(petId)) return;
    Alert.alert(
      'Pet not selected',
      'The new selection could not be confirmed. Your previous pet remains displayed.',
    );
  };

  const pickPetPhoto = async () => {
    const result = await petProfileForm.pickPhoto();
    if (result === 'permission-denied') {
      Alert.alert(
        'Photo access needed',
        'Allow photo library access to choose a picture for your pet.',
      );
    } else if (result === 'failed') {
      Alert.alert('Photo not selected', 'The photo library could not be opened. Please try again.');
    }
  };

  const savePet = async () => {
    const result = await petProfileForm.submit();
    if (result.status === 'failed') {
      Alert.alert(
        petProfileForm.editing ? 'Pet not updated' : 'Pet not added',
        'The profile could not be confirmed as saved. Reopen the app before trying again so your local data can be checked safely.',
      );
    } else if (result.status === 'saved' && result.result.previousPhotoCleanupFailed) {
      Alert.alert(
        'Pet saved',
        'The profile was saved, but its previous photo could not be removed from device storage.',
      );
    }
  };

  const saveSymptom = async () => {
    if (await symptomForm.submit()) return;
    Alert.alert('Symptom not saved', 'Please try again. Your symptom has not been added.');
  };

  const saveDietChange = async () => {
    if (await dietChangeForm.submit()) return;
    Alert.alert('Diet change not saved', 'Please try again. Your change has not been added.');
  };

  const saveOtherEvent = async () => {
    if (await otherEventForm.submit()) return;
    Alert.alert('Event not saved', 'Please try again. Your event has not been added.');
  };

  const saveTimelineEventDateTime = async () => {
    if (await eventDateTimeForm.submit()) return;
    Alert.alert(
      'Date and time not saved',
      'Please try again. The original event date and time are unchanged.',
    );
  };

  const openTimelineEventDateTime = (entry: TimelineEntry) => {
    eventDateTimeForm.open(entry.id, entry.title, entry.occurredAt);
  };

  const deleteConfirmedTimelineEvent = async () => {
    if (!eventPendingDeletion) return;
    setDeleteTimelineEventError(null);
    try {
      await deleteTimelineEvent(eventPendingDeletion.id);
      setEventPendingDeletion(null);
    } catch {
      setDeleteTimelineEventError(
        'This event could not be deleted. It is still saved. Please try again.',
      );
    }
  };

  const requestDeleteTimelineEvent = (entry: TimelineEntry) => {
    setDeleteTimelineEventError(null);
    setEventPendingDeletion(entry);
  };

  const closeDeleteTimelineEventModal = () => {
    if (deletingTimelineEventId !== null) return;
    setEventPendingDeletion(null);
    setDeleteTimelineEventError(null);
  };

  const requestCloseSymptom = useCallback(() => {
    if (symptomFormIsSaving) return;
    if (!symptomFormIsDirty) {
      closeSymptomForm();
      return;
    }

    const title = 'Discard this symptom?';
    const message = 'Your changes will not be saved.';
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) closeSymptomForm();
      return;
    }

    NativeAlert.alert(title, message, [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: closeSymptomForm },
    ]);
  }, [closeSymptomForm, symptomFormIsDirty, symptomFormIsSaving]);

  const requestCloseDietChange = useCallback(() => {
    if (dietChangeFormIsSaving) return;
    if (!dietChangeFormIsDirty) {
      closeDietChangeForm();
      return;
    }

    const title = 'Discard this diet change?';
    const message = 'Your changes will not be saved.';
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) closeDietChangeForm();
      return;
    }

    NativeAlert.alert(title, message, [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: closeDietChangeForm },
    ]);
  }, [closeDietChangeForm, dietChangeFormIsDirty, dietChangeFormIsSaving]);

  const requestCloseOtherEvent = useCallback(() => {
    if (otherEventFormIsSaving) return;
    if (!otherEventFormIsDirty) {
      closeOtherEventForm();
      return;
    }

    const title = 'Discard this event?';
    const message = 'Your changes will not be saved.';
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) closeOtherEventForm();
      return;
    }

    NativeAlert.alert(title, message, [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: closeOtherEventForm },
    ]);
  }, [closeOtherEventForm, otherEventFormIsDirty, otherEventFormIsSaving]);

  const requestCloseEventDateTime = useCallback(() => {
    if (eventDateTimeFormIsSaving) return;
    if (!eventDateTimeFormIsDirty) {
      closeEventDateTimeForm();
      return;
    }

    const title = 'Discard date and time changes?';
    const message = 'Your changes will not be saved.';
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) closeEventDateTimeForm();
      return;
    }

    NativeAlert.alert(title, message, [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: closeEventDateTimeForm },
    ]);
  }, [closeEventDateTimeForm, eventDateTimeFormIsDirty, eventDateTimeFormIsSaving]);

  if (loadStatus !== 'ready') {
    return (
      <DashboardLoadState status={loadStatus} isDark={isDark} colors={colors} onRetry={retryLoad} />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.shell, wide && styles.wideShell]}>
        <DashboardHeader
          isDark={isDark}
          colors={colors}
          onOpenAppearance={() => setAppearanceModalOpen(true)}
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <PetSelector
            pets={pets}
            activePetId={activePetId}
            colors={colors}
            onSelectPet={selectPet}
            onAddPet={() => petProfileForm.open()}
          />
          <TodaySummary
            pet={activePet}
            hasEvents={timeline.length > 0}
            wide={wide}
            colors={colors}
          />
          <UpcomingCare colors={colors} />
          <Timeline
            entries={timeline}
            petName={activePet.name}
            colors={colors}
            deletingEventId={deletingTimelineEventId}
            updatingEventId={updatingTimelineEventId}
            onLogSymptom={symptomForm.open}
            onLogDietChange={dietChangeForm.open}
            onLogOther={otherEventForm.open}
            onDelete={requestDeleteTimelineEvent}
            onEditDateTime={openTimelineEventDateTime}
            onExport={() => {
              if (Platform.OS === 'web') window.print();
            }}
          />
        </ScrollView>
        <BottomNavigation
          activeTab={tab}
          colors={colors}
          onSelect={(nextTab) => {
            setTab(nextTab);
            if (nextTab === 'Pet') petProfileForm.open(activePet);
          }}
        />
        <DeleteTimelineEventModal
          visible={eventPendingDeletion !== null}
          entry={eventPendingDeletion}
          petName={activePet.name}
          isDeleting={deletingTimelineEventId !== null}
          error={deleteTimelineEventError}
          colors={colors}
          onCancel={closeDeleteTimelineEventModal}
          onConfirm={() => void deleteConfirmedTimelineEvent()}
        />
        <EditTimelineEventDateTimeModal
          visible={eventDateTimeForm.visible}
          eventTitle={eventDateTimeForm.eventTitle}
          occurredDate={eventDateTimeForm.occurredDate}
          occurredTime={eventDateTimeForm.occurredTime}
          dateTimeIsValid={eventDateTimeForm.dateTimeIsValid}
          isDirty={eventDateTimeForm.isDirty}
          isSaving={eventDateTimeForm.isSaving}
          colors={colors}
          onOccurredDateChange={eventDateTimeForm.setOccurredDate}
          onOccurredTimeChange={eventDateTimeForm.setOccurredTime}
          onSave={saveTimelineEventDateTime}
          onClose={requestCloseEventDateTime}
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
          onSymptomChange={symptomForm.setSymptom}
          onNoteChange={symptomForm.setNote}
          onOccurredDateChange={symptomForm.setOccurredDate}
          onOccurredTimeChange={symptomForm.setOccurredTime}
          onSave={saveSymptom}
          onClose={requestCloseSymptom}
        />
        <DietChangeModal
          visible={dietChangeForm.visible}
          changeType={dietChangeForm.changeType}
          selectedItemId={dietChangeForm.selectedItemId}
          currentDiet={currentDiet}
          productName={dietChangeForm.productName}
          foodType={dietChangeForm.foodType}
          note={dietChangeForm.note}
          occurredDate={dietChangeForm.occurredDate}
          occurredTime={dietChangeForm.occurredTime}
          dateTimeIsValid={dietChangeForm.dateTimeIsValid}
          itemIsValid={dietChangeForm.itemIsValid}
          isSaving={dietChangeForm.isSaving}
          colors={colors}
          onChangeTypeChange={dietChangeForm.setChangeType}
          onSelectedItemChange={dietChangeForm.setSelectedItemId}
          onProductNameChange={dietChangeForm.setProductName}
          onFoodTypeChange={dietChangeForm.setFoodType}
          onNoteChange={dietChangeForm.setNote}
          onOccurredDateChange={dietChangeForm.setOccurredDate}
          onOccurredTimeChange={dietChangeForm.setOccurredTime}
          onSave={saveDietChange}
          onClose={requestCloseDietChange}
        />
        <OtherEventModal
          visible={otherEventForm.visible}
          title={otherEventForm.title}
          note={otherEventForm.note}
          occurredDate={otherEventForm.occurredDate}
          occurredTime={otherEventForm.occurredTime}
          titleIsValid={otherEventForm.titleIsValid}
          dateTimeIsValid={otherEventForm.dateTimeIsValid}
          isSaving={otherEventForm.isSaving}
          colors={colors}
          onTitleChange={otherEventForm.setTitle}
          onNoteChange={otherEventForm.setNote}
          onOccurredDateChange={otherEventForm.setOccurredDate}
          onOccurredTimeChange={otherEventForm.setOccurredTime}
          onSave={saveOtherEvent}
          onClose={requestCloseOtherEvent}
        />
        <AppearanceModal
          visible={appearanceModalOpen}
          appearance={appearance}
          colors={colors}
          onSelect={(option) => {
            setAppearance(option);
            setAppearanceModalOpen(false);
          }}
          onClose={() => setAppearanceModalOpen(false)}
        />
        <PetProfileModal
          visible={petProfileForm.visible}
          editing={petProfileForm.editing}
          name={petProfileForm.name}
          species={petProfileForm.species}
          breed={petProfileForm.breed}
          birthDate={petProfileForm.birthDate}
          photoUri={petProfileForm.photoUri}
          birthDateIsValid={petProfileForm.birthDateIsValid}
          isSaving={petProfileForm.isSaving}
          colors={colors}
          onNameChange={petProfileForm.setName}
          onSpeciesChange={petProfileForm.setSpecies}
          onBreedChange={petProfileForm.setBreed}
          onBirthDateChange={petProfileForm.setBirthDate}
          onPickPhoto={pickPetPhoto}
          onSave={savePet}
          onClose={petProfileForm.close}
        />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    shell: { flex: 1, width: '100%', maxWidth: 920, alignSelf: 'center' },
    wideShell: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.line },
    content: { padding: 20, paddingBottom: 120 },
  });
