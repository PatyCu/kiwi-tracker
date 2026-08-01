import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

type ModalAccessibilityOptions = {
  visible: boolean;
  sheetTestID: string;
  closeButtonTestID: string;
  onClose: () => void;
};

export function useModalAccessibility({
  visible,
  sheetTestID,
  closeButtonTestID,
  onClose,
}: ModalAccessibilityOptions) {
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
    const sheet = document.querySelector<HTMLElement>(`[data-testid="${sheetTestID}"]`);
    const closeButton = document.querySelector<HTMLElement>(`[data-testid="${closeButtonTestID}"]`);
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
      previouslyFocused?.focus();
    };
  }, [closeButtonTestID, sheetTestID, visible]);
}
