import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Pet } from '@/modules/pets/model/Pet';
import { PetPicker } from '@/modules/pets/ui/PetPicker';
import { Palette } from '@/shared/theme/palette';
import { DateTimePickerField } from '@/shared/ui/date-time/DateTimePickerField';
import { ModalSheet } from '@/shared/ui/modal/ModalSheet';

type PetChoice = {
  pets: readonly Pet[];
  selectedPetId: string;
  onSelectPet: (petId: string) => void;
};

type CalendarEventModalProps = {
  visible: boolean;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  titleIsValid: boolean;
  startIsValid: boolean;
  endIsAfterStart: boolean;
  isSaving: boolean;
  colors: Palette;
  /** Shown when the pet isn't known yet, as in the logging forms. */
  petChoice?: PetChoice;
  onTitleChange: (title: string) => void;
  onDateChange: (date: string) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  onLocationChange: (location: string) => void;
  onDescriptionChange: (description: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export function CalendarEventModal({
  visible,
  title,
  date,
  startTime,
  endTime,
  location,
  description,
  titleIsValid,
  startIsValid,
  endIsAfterStart,
  isSaving,
  colors,
  petChoice,
  onTitleChange,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onLocationChange,
  onDescriptionChange,
  onSave,
  onClose,
}: CalendarEventModalProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const saveDisabled = isSaving || !titleIsValid || !startIsValid || !endIsAfterStart;
  const timeError = !startIsValid
    ? 'Choose a valid date and start time.'
    : !endIsAfterStart
      ? 'End time must be after the start time.'
      : null;

  return (
    <ModalSheet
      visible={visible}
      title="Add calendar event"
      testID="calendar-event-modal"
      onClose={onClose}
    >
      {petChoice && (
        <>
          <Text style={styles.label}>PET</Text>
          <PetPicker
            pets={petChoice.pets}
            selectedPetId={petChoice.selectedPetId}
            onSelectPet={petChoice.onSelectPet}
          />
        </>
      )}
      <Text style={styles.label}>TITLE</Text>
      <TextInput
        accessibilityLabel="Calendar event title"
        autoFocus
        value={title}
        onChangeText={onTitleChange}
        placeholder="e.g. Annual vaccines"
        placeholderTextColor={colors.muted}
        maxLength={80}
        editable={!isSaving}
        style={styles.input}
      />
      <Text style={styles.label}>DATE</Text>
      <DateTimePickerField
        accessibilityLabel="Calendar event date"
        colors={colors}
        disabled={isSaving}
        isInvalid={!startIsValid}
        mode="date"
        value={date}
        onChange={onDateChange}
      />
      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <Text style={styles.label}>START</Text>
          <DateTimePickerField
            accessibilityLabel="Calendar event start time"
            colors={colors}
            disabled={isSaving}
            isInvalid={!startIsValid}
            mode="time"
            value={startTime}
            onChange={onStartTimeChange}
          />
        </View>
        <View style={styles.timeField}>
          <Text style={styles.label}>END</Text>
          <DateTimePickerField
            accessibilityLabel="Calendar event end time"
            colors={colors}
            disabled={isSaving}
            isInvalid={startIsValid && !endIsAfterStart}
            mode="time"
            value={endTime}
            onChange={onEndTimeChange}
          />
        </View>
      </View>
      {timeError && <Text style={styles.errorText}>{timeError}</Text>}
      <Text style={styles.label}>LOCATION</Text>
      <TextInput
        accessibilityLabel="Calendar event location"
        value={location}
        onChangeText={onLocationChange}
        placeholder="e.g. Riverside Vet Clinic"
        placeholderTextColor={colors.muted}
        maxLength={120}
        editable={!isSaving}
        style={styles.input}
      />
      <Text style={styles.label}>DESCRIPTION</Text>
      <TextInput
        accessibilityLabel="Calendar event description"
        value={description}
        onChangeText={onDescriptionChange}
        placeholder="Add any useful details…"
        placeholderTextColor={colors.muted}
        multiline
        editable={!isSaving}
        style={[styles.input, styles.descriptionInput]}
      />
      <Pressable
        accessibilityRole="button"
        disabled={saveDisabled}
        style={[styles.saveButton, saveDisabled && styles.disabled]}
        onPress={onSave}
      >
        <Text style={styles.saveText}>{isSaving ? 'Saving…' : 'Save event'}</Text>
      </Pressable>
    </ModalSheet>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    label: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.3,
      marginTop: 24,
      marginBottom: 10,
    },
    timeRow: { flexDirection: 'row', gap: 12 },
    timeField: { flex: 1 },
    input: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      minHeight: 50,
      padding: 14,
      color: colors.text,
      textAlignVertical: 'center',
    },
    descriptionInput: { minHeight: 88, textAlignVertical: 'top' },
    errorText: { color: colors.coral, fontSize: 12, marginTop: 7 },
    saveButton: {
      backgroundColor: colors.kiwi,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      marginTop: 18,
    },
    disabled: { opacity: 0.5 },
    saveText: { color: colors.ink, fontWeight: '800' },
  });
