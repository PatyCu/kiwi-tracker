import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
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
import { DietChangeType } from '@/hooks/useDietChangeForm';
import { DIET_ITEM_TYPES, DietItemSnapshot, DietItemType } from '@/lib/timelineEvents';
import { Palette } from '@/lib/theme';

const changeTypeLabels: Record<DietChangeType, string> = {
  add: 'Added an item',
  replace: 'Switched an item',
  remove: 'Stopped an item',
};

const changeTypes: DietChangeType[] = ['add', 'replace', 'remove'];

const foodTypeLabels: Record<DietItemType, string> = {
  'dry-food': 'Dry food',
  'wet-food': 'Wet food',
  snack: 'Snack',
  supplement: 'Supplement',
  other: 'Other',
};

type DietChangeModalProps = {
  visible: boolean;
  changeType: DietChangeType;
  selectedItemId: string | null;
  currentDiet: DietItemSnapshot[];
  productName: string;
  foodType: DietItemType;
  note: string;
  occurredDate: string;
  occurredTime: string;
  dateTimeIsValid: boolean;
  itemIsValid: boolean;
  isSaving: boolean;
  colors: Palette;
  onChangeTypeChange: (changeType: DietChangeType) => void;
  onSelectedItemChange: (itemId: string | null) => void;
  onProductNameChange: (productName: string) => void;
  onFoodTypeChange: (foodType: DietItemType) => void;
  onNoteChange: (note: string) => void;
  onOccurredDateChange: (date: string) => void;
  onOccurredTimeChange: (time: string) => void;
  onSave: () => void;
  onClose: () => void;
};

export function DietChangeModal({
  visible,
  changeType,
  selectedItemId,
  currentDiet,
  productName,
  foodType,
  note,
  occurredDate,
  occurredTime,
  dateTimeIsValid,
  itemIsValid,
  isSaving,
  colors,
  onChangeTypeChange,
  onSelectedItemChange,
  onProductNameChange,
  onFoodTypeChange,
  onNoteChange,
  onOccurredDateChange,
  onOccurredTimeChange,
  onSave,
  onClose,
}: DietChangeModalProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [foodTypeDropdownOpen, setFoodTypeDropdownOpen] = useState(false);
  const saveDisabled = isSaving || !dateTimeIsValid || !itemIsValid;
  const isIos = Platform.OS === 'ios';

  const close = () => {
    setFoodTypeDropdownOpen(false);
    onClose();
  };

  const save = () => {
    setFoodTypeDropdownOpen(false);
    onSave();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.overlay} onPress={close}>
        <Pressable accessibilityViewIsModal testID="diet-change-modal-sheet" style={styles.sheet}>
          <View style={styles.header}>
            {isIos && (
              <Pressable
                accessibilityLabel="Cancel"
                accessibilityRole="button"
                disabled={isSaving}
                onPress={close}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            )}
            <Text style={[styles.title, isIos && styles.iosTitle]}>Log a diet change</Text>
            {isIos ? (
              <View style={styles.headerSpacer} />
            ) : (
              <Pressable
                accessibilityLabel="Close"
                accessibilityRole="button"
                disabled={isSaving}
                onPress={close}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            )}
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.helper}>
              This change stays in the current diet until another change is logged.
            </Text>
            <Text style={styles.label}>WHAT CHANGED?</Text>
            <View style={styles.choices}>
              {changeTypes.map((option) => (
                <Choice
                  disabled={option === 'replace' && currentDiet.length === 0}
                  key={option}
                  label={changeTypeLabels[option]}
                  selected={changeType === option}
                  styles={styles}
                  onPress={() => {
                    setFoodTypeDropdownOpen(false);
                    onChangeTypeChange(option);
                  }}
                />
              ))}
            </View>

            {(changeType === 'replace' || changeType === 'remove') && (
              <>
                <Text style={styles.label}>
                  {changeType === 'replace' ? 'WHAT DID THIS REPLACE?' : 'WHAT DID YOU STOP?'}
                </Text>
                {currentDiet.length === 0 ? (
                  <Text style={styles.emptyDiet}>
                    No current diet items have been recorded yet.
                  </Text>
                ) : (
                  <View style={styles.choices}>
                    {currentDiet.map((item) => (
                      <Choice
                        key={item.id}
                        label={formatDietItem(item)}
                        selected={selectedItemId === item.id}
                        styles={styles}
                        onPress={() => onSelectedItemChange(item.id)}
                      />
                    ))}
                  </View>
                )}
              </>
            )}

            {changeType !== 'remove' && (
              <>
                <Text style={styles.label}>PRODUCT NAME</Text>
                <TextInput
                  accessibilityLabel="Diet product name"
                  value={productName}
                  onChangeText={onProductNameChange}
                  placeholder="For example, Amanova Fish Delicacy"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.input,
                    productName.length > 0 && !itemIsValid && styles.inputError,
                  ]}
                />
                <Text style={styles.label}>FOOD TYPE</Text>
                <View>
                  <Pressable
                    accessibilityLabel="Food type"
                    accessibilityRole="button"
                    accessibilityState={{ expanded: foodTypeDropdownOpen }}
                    accessibilityValue={{ text: foodTypeLabels[foodType] }}
                    onPress={() => setFoodTypeDropdownOpen((open) => !open)}
                    style={styles.dropdownTrigger}
                  >
                    <Text style={styles.dropdownValue}>{foodTypeLabels[foodType]}</Text>
                    <Ionicons
                      name={foodTypeDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.muted}
                    />
                  </Pressable>
                  {foodTypeDropdownOpen && (
                    <View accessibilityRole="menu" style={styles.dropdownOptions}>
                      {DIET_ITEM_TYPES.map((option) => (
                        <Pressable
                          accessibilityLabel={`Select ${foodTypeLabels[option]}`}
                          accessibilityRole="menuitem"
                          accessibilityState={{ selected: foodType === option }}
                          key={option}
                          onPress={() => {
                            onFoodTypeChange(option);
                            setFoodTypeDropdownOpen(false);
                          }}
                          style={[
                            styles.dropdownOption,
                            foodType === option && styles.selectedDropdownOption,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              foodType === option && styles.selectedDropdownOptionText,
                            ]}
                          >
                            {foodTypeLabels[option]}
                          </Text>
                          {foodType === option && (
                            <Ionicons name="checkmark" size={17} color={colors.kiwi} />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeField}>
                <Text style={styles.label}>EFFECTIVE DATE</Text>
                <DateTimePickerField
                  accessibilityLabel="Diet change date"
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
                  accessibilityLabel="Diet change time"
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
              accessibilityLabel="Diet change notes"
              value={note}
              onChangeText={onNoteChange}
              placeholder="Optional context about the change"
              placeholderTextColor={colors.muted}
              multiline
              style={[styles.input, styles.notesInput]}
            />
            <Pressable
              accessibilityRole="button"
              disabled={saveDisabled}
              style={[styles.saveButton, saveDisabled && styles.disabled]}
              onPress={save}
            >
              <Text style={styles.saveText}>{isSaving ? 'Saving…' : 'Save diet change'}</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type ChoiceProps = {
  label: string;
  selected: boolean;
  disabled?: boolean;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
};

function Choice({ label, selected, disabled = false, styles, onPress }: ChoiceProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.choice, selected && styles.selectedChoice, disabled && styles.disabledChoice]}
    >
      <Text style={[styles.choiceText, selected && styles.selectedChoiceText]}>{label}</Text>
    </Pressable>
  );
}

function formatDietItem(item: DietItemSnapshot): string {
  return item.productName;
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
    helper: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 10 },
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
    disabledChoice: { opacity: 0.45 },
    choiceText: { color: colors.text, fontSize: 13 },
    selectedChoiceText: { color: colors.kiwi, fontWeight: '700' },
    emptyDiet: { color: colors.muted, fontSize: 13 },
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
    dropdownTrigger: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      paddingHorizontal: 14,
    },
    dropdownValue: { color: colors.text, fontSize: 14 },
    dropdownOptions: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      marginTop: 6,
      overflow: 'hidden',
    },
    dropdownOption: {
      minHeight: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.line,
    },
    selectedDropdownOption: { backgroundColor: colors.surface2 },
    dropdownOptionText: { color: colors.text, fontSize: 14 },
    selectedDropdownOptionText: { color: colors.kiwi, fontWeight: '700' },
    notesInput: { minHeight: 88, textAlignVertical: 'top' },
    inputError: { borderColor: colors.coral },
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
