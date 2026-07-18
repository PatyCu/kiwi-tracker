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
import { DeleteHealthEventModal } from '@/components/dashboard/DeleteHealthEventModal';
import { HealthEventModal } from '@/components/dashboard/HealthEventModal';
import { PetProfileModal } from '@/components/dashboard/PetProfileModal';
import { PetSelector } from '@/components/dashboard/PetSelector';
import { Timeline } from '@/components/dashboard/Timeline';
import { TodaySummary } from '@/components/dashboard/TodaySummary';
import { UpcomingCare } from '@/components/dashboard/UpcomingCare';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useHealthEventForm } from '@/hooks/useHealthEventForm';
import { usePetProfileForm } from '@/hooks/usePetProfileForm';
import { TimelineEntry, toTimelineEntries } from '@/lib/healthEventPresentation';
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
  const [deleteHealthEventError, setDeleteHealthEventError] = useState<string | null>(null);
  const isDark = appearance === 'dark' || (appearance === 'system' && scheme === 'dark');
  const colors = isDark ? darkColors : lightColors;
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const wide = useWindowDimensions().width > 780;

  const {
    healthEvents,
    pets,
    activePet,
    activePetId,
    loadStatus,
    photoMigrationWarningPetNames,
    clearPhotoMigrationWarning,
    retryLoad,
    selectPet: persistPetSelection,
    logHealthEvent,
    deleteHealthEvent,
    deletingHealthEventId,
    saveProfile,
  } = useDashboardData();
  const healthEventForm = useHealthEventForm({ onSubmit: logHealthEvent });
  const closeHealthEventForm = healthEventForm.close;
  const healthEventFormIsDirty = healthEventForm.isDirty;
  const healthEventFormIsSaving = healthEventForm.isSaving;
  const petProfileForm = usePetProfileForm({ onSubmit: saveProfile });
  const timeline = useMemo(
    () => toTimelineEntries(healthEvents, activePetId, colors.coral),
    [activePetId, healthEvents, colors.coral],
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

  const saveHealthEvent = async () => {
    if (await healthEventForm.submit()) return;
    Alert.alert('Event not saved', 'Please try again. Your event has not been added.');
  };

  const deleteConfirmedHealthEvent = async () => {
    if (!eventPendingDeletion) return;
    setDeleteHealthEventError(null);
    try {
      await deleteHealthEvent(eventPendingDeletion.id);
      setEventPendingDeletion(null);
    } catch {
      setDeleteHealthEventError(
        'This event could not be deleted. It is still saved. Please try again.',
      );
    }
  };

  const requestDeleteHealthEvent = (entry: TimelineEntry) => {
    setDeleteHealthEventError(null);
    setEventPendingDeletion(entry);
  };

  const closeDeleteHealthEventModal = () => {
    if (deletingHealthEventId !== null) return;
    setEventPendingDeletion(null);
    setDeleteHealthEventError(null);
  };

  const requestCloseHealthEvent = useCallback(() => {
    if (healthEventFormIsSaving) return;
    if (!healthEventFormIsDirty) {
      closeHealthEventForm();
      return;
    }

    const title = 'Discard this event?';
    const message = 'Your changes will not be saved.';
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) closeHealthEventForm();
      return;
    }

    NativeAlert.alert(title, message, [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: closeHealthEventForm },
    ]);
  }, [closeHealthEventForm, healthEventFormIsDirty, healthEventFormIsSaving]);

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
            deletingEventId={deletingHealthEventId}
            onLog={healthEventForm.open}
            onDelete={requestDeleteHealthEvent}
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
        <DeleteHealthEventModal
          visible={eventPendingDeletion !== null}
          entry={eventPendingDeletion}
          petName={activePet.name}
          isDeleting={deletingHealthEventId !== null}
          error={deleteHealthEventError}
          colors={colors}
          onCancel={closeDeleteHealthEventModal}
          onConfirm={() => void deleteConfirmedHealthEvent()}
        />
        <HealthEventModal
          visible={healthEventForm.visible}
          kind={healthEventForm.kind}
          note={healthEventForm.note}
          occurredDate={healthEventForm.occurredDate}
          occurredTime={healthEventForm.occurredTime}
          dateTimeIsValid={healthEventForm.dateTimeIsValid}
          isSaving={healthEventForm.isSaving}
          colors={colors}
          onKindChange={healthEventForm.setKind}
          onNoteChange={healthEventForm.setNote}
          onOccurredDateChange={healthEventForm.setOccurredDate}
          onOccurredTimeChange={healthEventForm.setOccurredTime}
          onSave={saveHealthEvent}
          onClose={requestCloseHealthEvent}
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
