import { ReactNode, RefObject, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';
import { useModalAccessibility } from '@/shared/ui/modal/useModalAccessibility';

const GAP = 8;
const EDGE_MARGIN = 16;

type AnchorRect = { x: number; y: number; width: number; height: number };

type PopoverProps = {
  visible: boolean;
  /** The control the panel opens from; the panel lines up with its right edge, below it. */
  anchorRef: RefObject<View | null>;
  /** What the panel is, for screen readers. */
  accessibilityLabel: string;
  testID: string;
  width: number;
  children: ReactNode;
  onClose: () => void;
};

/**
 * A small panel under the control that opened it, for wide screens where a
 * bottom sheet would feel out of place. Clicking outside it or pressing Escape
 * closes it.
 */
export function Popover({
  visible,
  anchorRef,
  accessibilityLabel,
  testID,
  width,
  children,
  onClose,
}: PopoverProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const window = useWindowDimensions();
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  // On web: focus moves into the panel, Escape closes it, and focus returns to the anchor.
  useModalAccessibility({ visible, sheetTestID: testID, onClose });

  useEffect(() => {
    // Measured on every open, since the anchor may have moved since the last one.
    if (!visible) return;
    anchorRef.current?.measureInWindow((x, y, anchorWidth, height) =>
      setAnchor({ x, y, width: anchorWidth, height }),
    );
  }, [anchorRef, visible, window.width, window.height]);

  const right = anchor
    ? Math.min(window.width - (anchor.x + anchor.width), window.width - width - EDGE_MARGIN)
    : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessible={false} style={styles.backdrop} onPress={onClose} />
      <View
        accessibilityLabel={accessibilityLabel}
        accessibilityViewIsModal
        role="dialog"
        testID={testID}
        style={[
          styles.panel,
          { width, right: Math.max(right, EDGE_MARGIN) },
          anchor ? { top: anchor.y + anchor.height + GAP } : styles.measuring,
        ]}
      >
        {children}
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFill },
    panel: {
      position: 'absolute',
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
    },
    // Hidden until the anchor is measured, so it doesn't flash in the corner.
    measuring: { top: 0, opacity: 0 },
  });
