import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Pet } from '@/lib/pets';
import { Palette } from '@/lib/theme';

type PetProfileModalProps = {
  visible: boolean;
  editing: boolean;
  name: string;
  species: Pet['species'];
  breed: string;
  birthDate: string;
  photoUri?: string;
  birthDateIsValid: boolean;
  isSaving: boolean;
  colors: Palette;
  onNameChange: (name: string) => void;
  onSpeciesChange: (species: Pet['species']) => void;
  onBreedChange: (breed: string) => void;
  onBirthDateChange: (birthDate: string) => void;
  onPickPhoto: () => void;
  onSave: () => void;
  onClose: () => void;
};

const speciesOptions: Pet['species'][] = ['Cat', 'Dog', 'Other'];

export function PetProfileModal({
  visible,
  editing,
  name,
  species,
  breed,
  birthDate,
  photoUri,
  birthDateIsValid,
  isSaving,
  colors,
  onNameChange,
  onSpeciesChange,
  onBreedChange,
  onBirthDateChange,
  onPickPhoto,
  onSave,
  onClose,
}: PetProfileModalProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const saveDisabled = !name.trim() || isSaving || !birthDateIsValid;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{editing ? 'Edit pet' : 'Add a pet'}</Text>
            <Pressable onPress={onPickPhoto} style={styles.photoPicker}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              ) : (
                <View style={[styles.photoPreview, styles.photoFallback]}>
                  <Ionicons name="camera-outline" size={29} color={colors.kiwi} />
                </View>
              )}
              <Text style={styles.photoPickerText}>{photoUri ? 'Change photo' : 'Add photo'}</Text>
            </Pressable>
            <Text style={styles.label}>NAME</Text>
            <TextInput
              value={name}
              onChangeText={onNameChange}
              autoFocus
              placeholder="e.g. Miso"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <Text style={styles.label}>SPECIES</Text>
            <View style={styles.choices}>
              {speciesOptions.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => onSpeciesChange(option)}
                  style={[styles.choice, species === option && styles.selectedChoice]}
                >
                  <Text
                    style={[styles.choiceText, species === option && styles.selectedChoiceText]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>BREED</Text>
            <TextInput
              value={breed}
              onChangeText={onBreedChange}
              placeholder="e.g. European shorthair"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
            <Text style={styles.label}>DATE OF BIRTH</Text>
            <TextInput
              value={birthDate}
              onChangeText={onBirthDateChange}
              placeholder="DD-MM-YYYY"
              placeholderTextColor={colors.muted}
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
              maxLength={10}
              style={[styles.input, !birthDateIsValid && styles.inputError]}
            />
            {!birthDateIsValid && (
              <Text style={styles.errorText}>
                Use DD-MM-YYYY and choose today or an earlier date.
              </Text>
            )}
            <Pressable
              disabled={saveDisabled}
              style={[styles.saveButton, saveDisabled && styles.disabled]}
              onPress={onSave}
            >
              <Text style={styles.saveText}>
                {isSaving ? 'Saving…' : editing ? 'Save changes' : 'Add pet'}
              </Text>
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
    photoPicker: { alignItems: 'center', alignSelf: 'center', marginTop: 18, gap: 8 },
    photoPreview: { width: 92, height: 92, borderRadius: 28 },
    photoFallback: {
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoPickerText: { color: colors.kiwi, fontSize: 13, fontWeight: '700' },
    label: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.3,
      marginTop: 24,
      marginBottom: 10,
    },
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
    inputError: { borderColor: colors.coral },
    errorText: { color: colors.coral, fontSize: 12, marginTop: 7 },
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
