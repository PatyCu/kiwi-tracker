import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { darkColors, Palette } from '@/shared/theme/palette';

export type DateTimePickerFieldMode = 'date' | 'time';

type DateTimePickerFieldProps = {
  accessibilityLabel: string;
  value: string;
  mode: DateTimePickerFieldMode;
  colors: Palette;
  isInvalid?: boolean;
  disabled?: boolean;
  allowEmpty?: boolean;
  maximumDate?: Date;
  onChange: (value: string) => void;
};

export function DateTimePickerField({
  accessibilityLabel,
  value,
  mode,
  colors,
  isInvalid = false,
  disabled = false,
  allowEmpty = false,
  maximumDate,
  onChange,
}: DateTimePickerFieldProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [draftValue, setDraftValue] = useState(() => toPickerDate(value, mode));

  const openPicker = () => {
    setDraftValue(toPickerDate(value, mode));
    setPickerVisible(true);
  };

  const closePicker = () => setPickerVisible(false);

  const handleValueChange = (_event: DateTimePickerChangeEvent, selectedValue: Date) => {
    if (Platform.OS === 'android') {
      setPickerVisible(false);
      onChange(toDisplayedValue(selectedValue, mode));
      return;
    }

    setDraftValue(selectedValue);
  };

  const confirmIosValue = () => {
    onChange(toDisplayedValue(draftValue, mode));
    setPickerVisible(false);
  };

  if (Platform.OS === 'ios' && value) {
    return (
      <View
        style={[styles.field, isInvalid && styles.invalidField, disabled && styles.disabledField]}
      >
        <DateTimePicker
          accessibilityLabel={accessibilityLabel}
          accessibilityValue={{ text: value }}
          testID={`${accessibilityLabel}-picker`}
          value={toPickerDate(value, mode)}
          mode={mode}
          display="compact"
          disabled={disabled}
          maximumDate={maximumDate}
          accentColor={colors.kiwi}
          themeVariant={colors.bg === darkColors.bg ? 'dark' : 'light'}
          onValueChange={(_event, selectedValue) => {
            onChange(toDisplayedValue(selectedValue, mode));
          }}
          style={styles.compactPicker}
        />
        {allowEmpty && (
          <Pressable
            accessibilityLabel={`Clear ${mode}`}
            accessibilityRole="button"
            disabled={disabled}
            hitSlop={8}
            onPress={() => onChange('')}
          >
            <Ionicons name="close-circle" size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        aria-expanded={pickerVisible}
        accessibilityValue={{ text: value || `No ${mode} selected` }}
        disabled={disabled}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.field,
          isInvalid && styles.invalidField,
          disabled && styles.disabledField,
          pressed && styles.pressedField,
        ]}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value || (mode === 'date' ? 'Select date' : 'Select time')}
        </Text>
        <Ionicons
          name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
          size={19}
          color={colors.muted}
        />
      </Pressable>

      {pickerVisible && Platform.OS === 'android' && (
        <DateTimePicker
          value={draftValue}
          mode={mode}
          display="default"
          is24Hour
          maximumDate={maximumDate}
          neutralButton={allowEmpty ? { label: 'Clear' } : undefined}
          onDismiss={closePicker}
          onNeutralButtonPress={() => {
            onChange('');
            closePicker();
          }}
          onValueChange={handleValueChange}
        />
      )}

      {pickerVisible && Platform.OS === 'ios' && (
        <View style={styles.inlinePicker}>
          <View style={styles.pickerHeader}>
            <Pressable
              accessibilityLabel={`Cancel ${mode} selection`}
              accessibilityRole="button"
              onPress={closePicker}
              style={styles.pickerHeaderButton}
            >
              <Text style={styles.pickerHeaderButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Confirm ${mode} selection`}
              accessibilityRole="button"
              onPress={confirmIosValue}
              style={styles.pickerHeaderButton}
            >
              <Text style={[styles.pickerHeaderButtonText, styles.confirmText]}>Done</Text>
            </Pressable>
          </View>
          <DateTimePicker
            testID={`${accessibilityLabel}-picker`}
            value={draftValue}
            mode={mode}
            display="spinner"
            maximumDate={maximumDate}
            themeVariant={colors.bg === darkColors.bg ? 'dark' : 'light'}
            onValueChange={handleValueChange}
            style={styles.picker}
          />
        </View>
      )}
    </>
  );
}

function toPickerDate(value: string, mode: DateTimePickerFieldMode): Date {
  const fallback = new Date();

  if (mode === 'date' && /^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [day, month, year] = value.split('-').map(Number);
    const parsed = new Date(year, month - 1, day, fallback.getHours(), fallback.getMinutes());
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed;
    }
  }

  if (mode === 'time' && /^\d{2}:\d{2}$/.test(value)) {
    const [hour, minute] = value.split(':').map(Number);
    if (hour < 24 && minute < 60) {
      fallback.setHours(hour, minute, 0, 0);
    }
  }

  return fallback;
}

function toDisplayedValue(value: Date, mode: DateTimePickerFieldMode): string {
  if (mode === 'time') {
    return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  }

  return `${pad(value.getDate())}-${pad(value.getMonth() + 1)}-${value.getFullYear()}`;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    field: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      paddingHorizontal: 14,
    },
    invalidField: { borderColor: colors.coral },
    disabledField: { opacity: 0.5 },
    pressedField: { opacity: 0.8 },
    value: { flex: 1, color: colors.text, fontSize: 14 },
    placeholder: { color: colors.muted },
    compactPicker: { flex: 1 },
    inlinePicker: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      marginTop: 8,
      overflow: 'hidden',
    },
    pickerHeader: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.line,
      paddingHorizontal: 10,
    },
    pickerHeaderButton: {
      minWidth: 64,
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    pickerHeaderButtonText: { color: colors.muted, fontSize: 16 },
    confirmText: { color: colors.kiwi, fontWeight: '700', textAlign: 'right' },
    picker: { alignSelf: 'center' },
  });
