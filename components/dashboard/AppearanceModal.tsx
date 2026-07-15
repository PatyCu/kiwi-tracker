import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import { Palette } from '@/lib/theme';

export type Appearance = 'system' | 'light' | 'dark';

type AppearanceModalProps = {
  visible: boolean;
  appearance: Appearance;
  colors: Palette;
  onSelect: (appearance: Appearance) => void;
  onClose: () => void;
};

const options: Appearance[] = ['system', 'light', 'dark'];

export function AppearanceModal({
  visible,
  appearance,
  colors,
  onSelect,
  onClose,
}: AppearanceModalProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card}>
          <Text style={styles.title}>Appearance</Text>
          <Text style={styles.help}>Use your device setting or choose a theme.</Text>
          {options.map((option) => (
            <Pressable key={option} onPress={() => onSelect(option)} style={styles.option}>
              <Ionicons
                name={
                  option === 'system'
                    ? 'phone-portrait-outline'
                    : option === 'light'
                      ? 'sunny-outline'
                      : 'moon-outline'
                }
                size={21}
                color={colors.text}
              />
              <Text style={styles.optionText}>{option[0].toUpperCase() + option.slice(1)}</Text>
              {appearance === option && (
                <Ionicons name="checkmark-circle" size={22} color={colors.kiwi} />
              )}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: '#0008',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 22,
      borderWidth: 1,
      borderColor: colors.line,
    },
    title: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 20 },
    help: { color: colors.muted, fontSize: 14, marginTop: 8, marginBottom: 12 },
    option: {
      height: 54,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    optionText: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '600' },
  });
