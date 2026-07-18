import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { TimelineEntry } from '@/lib/timelineEventPresentation';
import { Palette } from '@/lib/theme';

type DeleteTimelineEventModalProps = {
  visible: boolean;
  entry: TimelineEntry | null;
  petName: string;
  isDeleting: boolean;
  error: string | null;
  colors: Palette;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteTimelineEventModal({
  visible,
  entry,
  petName,
  isDeleting,
  error,
  colors,
  onCancel,
  onConfirm,
}: DeleteTimelineEventModalProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const centered = useWindowDimensions().width > 600;
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

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
    const dialog = document.querySelector<HTMLElement>('[data-testid="delete-event-modal"]');
    const cancelButton = document.querySelector<HTMLElement>(
      '[data-testid="delete-event-modal-cancel"]',
    );
    const focusFrame = window.requestAnimationFrame(() => cancelButton?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancelRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;
      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
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
      } else if (!dialog.contains(document.activeElement)) {
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

  const requestCancel = () => {
    if (!isDeleting) onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType={centered ? 'fade' : 'slide'}
      onRequestClose={requestCancel}
    >
      <Pressable
        accessible={false}
        style={[styles.overlay, centered && styles.centeredOverlay]}
        onPress={requestCancel}
      >
        <Pressable
          accessibilityViewIsModal
          testID="delete-event-modal"
          style={[styles.card, centered && styles.centeredCard]}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="trash-outline" size={20} color={colors.coral} />
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            Delete this event?
          </Text>
          <Text style={styles.message}>
            This will permanently remove it from {petName}&apos;s timeline.
          </Text>
          {entry && (
            <View style={styles.eventPreview}>
              <Text style={styles.eventTitle}>{entry.title}</Text>
              <Text style={styles.eventMeta}>{entry.meta}</Text>
            </View>
          )}
          {error && (
            <View accessibilityLiveRegion="polite" style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={17} color={colors.coral} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isDeleting}
              onPress={onCancel}
              testID="delete-event-modal-cancel"
              style={({ pressed }) => [
                styles.actionButton,
                styles.cancelButton,
                pressed && styles.pressed,
                isDeleting && styles.disabled,
              ]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: isDeleting, disabled: isDeleting }}
              disabled={isDeleting}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.actionButton,
                styles.deleteButton,
                pressed && styles.deletePressed,
                isDeleting && styles.disabled,
              ]}
            >
              <Text style={styles.deleteText}>{isDeleting ? 'Deleting…' : 'Delete'}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: '#000A',
      justifyContent: 'flex-end',
    },
    centeredOverlay: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 22,
      paddingBottom: 32,
    },
    centeredCard: {
      borderRadius: 24,
      padding: 24,
    },
    iconContainer: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface2,
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '700',
      marginTop: 16,
    },
    message: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 7,
    },
    eventPreview: {
      backgroundColor: colors.surface2,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 14,
      marginTop: 18,
    },
    eventTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
    eventMeta: { color: colors.muted, fontSize: 12, marginTop: 5 },
    errorContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginTop: 14,
    },
    errorText: { flex: 1, color: colors.coral, fontSize: 13, lineHeight: 18 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
    actionButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.line,
    },
    deleteButton: { backgroundColor: colors.coral },
    pressed: { backgroundColor: colors.line },
    deletePressed: { opacity: 0.82 },
    disabled: { opacity: 0.55 },
    cancelText: { color: colors.text, fontSize: 15, fontWeight: '700' },
    deleteText: { color: colors.surface, fontSize: 15, fontWeight: '800' },
  });
