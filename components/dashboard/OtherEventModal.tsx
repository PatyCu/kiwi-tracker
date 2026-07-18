import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DateTimePickerField } from '@/components/forms/DateTimePickerField';
import { Palette } from '@/lib/theme';

type OtherEventModalProps = {
  visible: boolean;
  title: string;
  note: string;
  occurredDate: string;
  occurredTime: string;
  titleIsValid: boolean;
  dateTimeIsValid: boolean;
  isSaving: boolean;
  colors: Palette;
  onTitleChange: (title: string) => void;
  onNoteChange: (note: string) => void;
  onOccurredDateChange: (date: string) => void;
  onOccurredTimeChange: (time: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export function OtherEventModal({
  visible,
  title,
  note,
  occurredDate,
  occurredTime,
  titleIsValid,
  dateTimeIsValid,
  isSaving,
  colors,
  onTitleChange,
  onNoteChange,
  onOccurredDateChange,
  onOccurredTimeChange,
  onSave,
  onClose,
}: OtherEventModalProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const saveDisabled = isSaving || !titleIsValid || !dateTimeIsValid;
  const isIos = Platform.OS === 'ios';
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (
      Platform.OS !== 'web' ||
      !visible ||
      typeof document === 'undefined' ||
      typeof window === 'undefined'
    ) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const sheet = document.querySelector<HTMLElement>('[data-testid="other-event-modal-sheet"]');
    const closeButton = document.querySelector<HTMLElement>(
      '[data-testid="other-event-modal-close"]',
    );
    const focusFrame = window.requestAnimationFrame(() => closeButton?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !sheet) return;
      const focusableElements = Array.from(
        sheet.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) =>
          !element.hasAttribute('disabled') && element.getAttribute('aria-disabled') !== 'true',
      );
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!sheet.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      window.requestAnimationFrame(() => previouslyFocused?.focus());
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable accessibilityViewIsModal testID="other-event-modal-sheet" style={styles.sheet}>
          <View style={styles.header}>
            {isIos && (
              <Pressable
                accessibilityLabel="Cancel"
                accessibilityRole="button"
                disabled={isSaving}
                onPress={onClose}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            )}
            <Text style={[styles.title, isIos && styles.iosTitle]}>Log another event</Text>
            {isIos ? (
              <View style={styles.headerSpacer} />
            ) : (
              <Pressable
                accessibilityLabel="Close"
                accessibilityRole="button"
                disabled={isSaving}
                onPress={onClose}
                testID="other-event-modal-close"
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            )}
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>WHAT HAPPENED?</Text>
            <TextInput
              accessibilityLabel="Event title"
              autoFocus={!isIos}
              value={title}
              onChangeText={onTitleChange}
              placeholder="e.g. Started sleeping upstairs"
              placeholderTextColor={colors.muted}
              maxLength={80}
              style={styles.input}
            />
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeField}>
                <Text style={styles.label}>DATE</Text>
                <DateTimePickerField
                  accessibilityLabel="Other event date"
                  colors={colors}
                  disabled={isSaving}
                  isInvalid={!dateTimeIsValid}
                  mode="date"
                  value={occurredDate}
                  onChange={onOccurredDateChange}
                />
              </View>
              <View style={styles.dateTimeField}>
                <Text style={styles.label}>TIME</Text>
                <DateTimePickerField
                  accessibilityLabel="Other event time"
                  colors={colors}
                  disabled={isSaving}
                  isInvalid={!dateTimeIsValid}
                  mode="time"
                  value={occurredTime}
                  onChange={onOccurredTimeChange}
                />
              </View>
            </View>
            {!dateTimeIsValid && (
              <Text style={styles.errorText}>Choose a valid date and time.</Text>
            )}
            <Text style={styles.label}>NOTES</Text>
            <TextInput
              accessibilityLabel="Event notes"
              value={note}
              onChangeText={onNoteChange}
              placeholder="Add any useful details…"
              placeholderTextColor={colors.muted}
              multiline
              style={[styles.input, styles.notesInput]}
            />
            <Pressable
              accessibilityRole="button"
              disabled={saveDisabled}
              style={[styles.saveButton, saveDisabled && styles.disabled]}
              onPress={onSave}
            >
              <Text style={styles.saveText}>{isSaving ? 'Saving…' : 'Save event'}</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: '#000A', justifyContent: 'flex-end' },
    sheet: {
      width: '100%',
      maxWidth: 600,
      maxHeight: '90%',
      alignSelf: 'center',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 22,
      paddingBottom: 36,
    },
    header: { minHeight: 44, flexDirection: 'row', alignItems: 'center' },
    title: { flex: 1, color: colors.text, fontSize: 24, fontWeight: '700' },
    iosTitle: { textAlign: 'center', fontSize: 19 },
    cancelButton: { width: 64, minHeight: 44, justifyContent: 'center' },
    cancelText: { color: colors.kiwi, fontSize: 16, fontWeight: '600' },
    headerSpacer: { width: 64 },
    closeButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.3,
      marginTop: 24,
      marginBottom: 10,
    },
    dateTimeRow: { flexDirection: 'row', gap: 12 },
    dateTimeField: { flex: 1 },
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
    notesInput: { minHeight: 88, textAlignVertical: 'top' },
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
