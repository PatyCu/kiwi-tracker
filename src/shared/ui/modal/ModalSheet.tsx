import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';
import { useModalAccessibility } from '@/shared/ui/modal/useModalAccessibility';

type ModalSheetProps = {
  visible: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  testID: string;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ModalSheet({
  visible,
  title,
  children,
  onClose,
  testID,
  contentStyle,
}: ModalSheetProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const closeButtonTestID = `${testID}-close`;
  useModalAccessibility({ visible, sheetTestID: testID, closeButtonTestID, onClose });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          accessibilityViewIsModal
          testID={testID}
          style={styles.sheet}
          onPress={(event) => event.stopPropagation()}
        >
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            testID={closeButtonTestID}
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <ScrollView
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{title}</Text>
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000A' },
    sheet: {
      maxHeight: '92%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 20,
      paddingHorizontal: 22,
      paddingBottom: 36,
    },
    closeButton: {
      position: 'absolute',
      top: 18,
      right: 18,
      zIndex: 1,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface2,
    },
    content: { paddingBottom: 4 },
    title: { color: colors.text, fontSize: 24, fontWeight: '700', paddingRight: 52 },
  });
