import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { HEALTH_EVENT_KINDS, HealthEventKind } from '@/lib/healthEvents';
import { Palette } from '@/lib/theme';

type HealthEventModalProps = {
  visible: boolean;
  kind: HealthEventKind;
  note: string;
  isSaving: boolean;
  colors: Palette;
  onKindChange: (kind: HealthEventKind) => void;
  onNoteChange: (note: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export function HealthEventModal({
  visible,
  kind,
  note,
  isSaving,
  colors,
  onKindChange,
  onNoteChange,
  onSave,
  onClose,
}: HealthEventModalProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Log a health event</Text>
          <Text style={styles.label}>WHAT HAPPENED?</Text>
          <View style={styles.choices}>
            {HEALTH_EVENT_KINDS.map((option) => (
              <Pressable
                key={option}
                onPress={() => onKindChange(option)}
                style={[styles.choice, kind === option && styles.selectedChoice]}
              >
                <Text style={[styles.choiceText, kind === option && styles.selectedChoiceText]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>NOTES</Text>
          <TextInput
            value={note}
            onChangeText={onNoteChange}
            placeholder="Add useful context for your vet…"
            placeholderTextColor={colors.muted}
            multiline
            style={styles.input}
          />
          <Pressable
            disabled={isSaving}
            style={[styles.saveButton, isSaving && styles.disabled]}
            onPress={onSave}
          >
            <Text style={styles.saveText}>{isSaving ? 'Saving…' : 'Save event'}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: '#000A', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 22,
      paddingBottom: 36,
    },
    handle: {
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.line,
      alignSelf: 'center',
    },
    title: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 20 },
    label: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.3,
      marginTop: 24,
      marginBottom: 10,
    },
    choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    choice: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    selectedChoice: { borderColor: colors.kiwi, backgroundColor: colors.surface2 },
    choiceText: { color: colors.text, fontSize: 13 },
    selectedChoiceText: { color: colors.kiwi, fontWeight: '700' },
    input: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      minHeight: 88,
      padding: 14,
      color: colors.text,
      textAlignVertical: 'top',
    },
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
