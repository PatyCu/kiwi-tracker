import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CALENDAR_ITEM_KIND_LABELS,
  CALENDAR_ITEM_KINDS,
  CalendarItemKind,
} from '@/modules/calendar/calendarItems';
import { Pet } from '@/modules/pets/model/Pet';
import { PetAvatar } from '@/modules/pets/ui/PetAvatar';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';
import { ModalSheet } from '@/shared/ui/modal/ModalSheet';
import { Popover } from '@/shared/ui/Popover';

const KIND_ICONS: Record<CalendarItemKind, keyof typeof Ionicons.glyphMap> = {
  'calendar-event': 'calendar-outline',
  'pet-event': 'pulse-outline',
};

const POPOVER_WIDTH = 300;

type CalendarFilterProps = {
  pets: readonly Pet[];
  selectedPetIds: readonly string[];
  onTogglePet: (petId: string) => void;
  kinds: readonly CalendarItemKind[];
  onToggleKind: (kind: CalendarItemKind) => void;
  /** Selects every pet and every event type again. */
  onReset: () => void;
  /** Opens the choices in a popover under the button instead of a bottom sheet. */
  wide: boolean;
};

/**
 * One "Filter by" button for whose items and which event types the calendar
 * shows. Every option starts checked, which is how it shows everything;
 * unchecking one narrows the calendar. The button counts the filters that are
 * on, and its choices apply as they are tapped.
 */
export function CalendarFilter({
  pets,
  selectedPetIds,
  onTogglePet,
  kinds,
  onToggleKind,
  onReset,
  wide,
}: CalendarFilterProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<View>(null);
  const close = () => setOpen(false);

  const summary = [
    selectedPetIds.length < pets.length &&
      pets
        .filter((pet) => selectedPetIds.includes(pet.id))
        .map((pet) => pet.name)
        .join(', '),
    kinds.length < CALENDAR_ITEM_KINDS.length &&
      kinds.map((kind) => CALENDAR_ITEM_KIND_LABELS[kind]).join(', '),
  ].filter((part): part is string => Boolean(part));
  const active = summary.length > 0;

  const options = (
    <>
      {pets.length > 1 && (
        <FilterSection title="PET" styles={styles}>
          {pets.map((pet) => (
            <FilterOption
              key={pet.id}
              label={pet.name}
              checked={selectedPetIds.includes(pet.id)}
              leading={<PetAvatar pet={pet} size={24} />}
              onToggle={() => onTogglePet(pet.id)}
              styles={styles}
            />
          ))}
        </FilterSection>
      )}
      <FilterSection title="EVENT TYPE" styles={styles}>
        {CALENDAR_ITEM_KINDS.map((kind) => (
          <FilterOption
            key={kind}
            label={CALENDAR_ITEM_KIND_LABELS[kind]}
            checked={kinds.includes(kind)}
            leading={
              <Ionicons
                name={KIND_ICONS[kind]}
                size={16}
                color={kinds.includes(kind) ? colors.kiwi : colors.muted}
              />
            }
            onToggle={() => onToggleKind(kind)}
            styles={styles}
          />
        ))}
      </FilterSection>
    </>
  );

  const clear = active && (
    <Pressable
      accessibilityRole="button"
      onPress={onReset}
      style={({ pressed, hovered }) => [styles.clear, (pressed || hovered) && styles.pressed]}
    >
      <Text style={styles.clearText}>Clear filters</Text>
    </Pressable>
  );

  return (
    <>
      <Pressable
        ref={buttonRef}
        accessibilityLabel={active ? `Filter by, ${summary.join('; ')}` : 'Filter by'}
        accessibilityRole="button"
        aria-expanded={open}
        hitSlop={{ top: 6, bottom: 6 }}
        onPress={() => setOpen(true)}
        style={({ pressed, hovered }) => [
          styles.button,
          active && styles.activeButton,
          (pressed || hovered) && styles.pressed,
        ]}
      >
        <Ionicons name="options-outline" size={16} color={active ? colors.kiwi : colors.text} />
        <Text style={[styles.buttonText, active && styles.activeButtonText]}>Filter by</Text>
        {active && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{summary.length}</Text>
          </View>
        )}
        {wide && (
          <Ionicons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={active ? colors.kiwi : colors.muted}
          />
        )}
      </Pressable>
      {wide ? (
        <Popover
          visible={open}
          anchorRef={buttonRef}
          accessibilityLabel="Filter by"
          testID="calendar-filter"
          width={POPOVER_WIDTH}
          onClose={close}
        >
          {options}
          {clear && <View style={styles.popoverFooter}>{clear}</View>}
        </Popover>
      ) : (
        <ModalSheet visible={open} title="Filter by" testID="calendar-filter" onClose={close}>
          {options}
          <View style={styles.sheetFooter}>
            {clear}
            <Pressable
              accessibilityRole="button"
              onPress={close}
              style={({ pressed }) => [styles.done, pressed && styles.pressed]}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </ModalSheet>
      )}
    </>
  );
}

type Styles = ReturnType<typeof makeStyles>;

function FilterSection({
  title,
  children,
  styles,
}: {
  title: string;
  children: ReactNode;
  styles: Styles;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

type FilterOptionProps = {
  label: string;
  checked: boolean;
  leading: ReactNode;
  onToggle: () => void;
  styles: Styles;
};

/** One choice of a filter, as a chip that is filled while it's on. */
function FilterOption({ label, checked, leading, onToggle, styles }: FilterOptionProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      aria-checked={checked}
      onPress={onToggle}
      style={({ pressed, hovered }) => [
        styles.chip,
        checked && styles.checkedChip,
        hovered && !checked && styles.hoveredChip,
        pressed && styles.pressed,
      ]}
    >
      <View style={!checked && styles.unchecked}>{leading}</View>
      <Text style={[styles.chipText, checked && styles.checkedChipText]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    button: {
      minHeight: 36,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingLeft: 12,
      paddingRight: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    activeButton: { borderColor: colors.kiwi, backgroundColor: `${colors.kiwi}12` },
    buttonText: { color: colors.text, fontSize: 13, fontWeight: '700' },
    activeButtonText: { color: colors.kiwi },
    badge: {
      minWidth: 18,
      height: 18,
      paddingHorizontal: 5,
      borderRadius: 9,
      backgroundColor: colors.kiwi,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
    pressed: { opacity: 0.7 },
    section: { marginTop: 18 },
    sectionTitle: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.3,
      marginBottom: 10,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      minHeight: 36,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingLeft: 8,
      paddingRight: 13,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.line,
    },
    checkedChip: { borderColor: colors.kiwi, backgroundColor: `${colors.kiwi}1A` },
    hoveredChip: { backgroundColor: colors.surface2 },
    unchecked: { opacity: 0.5 },
    chipText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
    checkedChipText: { color: colors.text },
    popoverFooter: {
      marginTop: 14,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      alignItems: 'flex-start',
    },
    sheetFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 10,
      marginTop: 24,
    },
    clear: { minHeight: 40, paddingHorizontal: 8, justifyContent: 'center' },
    clearText: { color: colors.kiwi, fontSize: 14, fontWeight: '700' },
    done: {
      minHeight: 44,
      paddingHorizontal: 24,
      borderRadius: 22,
      backgroundColor: colors.kiwi,
      justifyContent: 'center',
    },
    doneText: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  });
