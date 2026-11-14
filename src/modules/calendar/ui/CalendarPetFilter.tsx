import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Pet } from '@/modules/pets/model/Pet';
import { PetAvatar } from '@/modules/pets/ui/PetAvatar';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

const COMPACT_AVATAR_SIZE = 30;
const LARGE_AVATAR_SIZE = 40;

type CalendarPetFilterProps = {
  pets: readonly Pet[];
  selectedPetIds: readonly string[];
  onTogglePet: (petId: string) => void;
  /** Bigger photos, for wide screens where the row has room. */
  large?: boolean;
};

/**
 * One photo toggle per pet: selected pets have a kiwi ring and a check, the
 * others fade. Every pet starts selected, which is how the calendar shows all.
 */
export function CalendarPetFilter({
  pets,
  selectedPetIds,
  onTogglePet,
  large = false,
}: CalendarPetFilterProps) {
  const { colors } = useAppearance();
  const avatarSize = large ? LARGE_AVATAR_SIZE : COMPACT_AVATAR_SIZE;
  const styles = useMemo(() => makeStyles(colors, avatarSize), [colors, avatarSize]);

  return (
    <ScrollView
      horizontal
      accessibilityLabel="Pets shown"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    >
      {pets.map((pet) => {
        const selected = selectedPetIds.includes(pet.id);
        return (
          <Pressable
            key={pet.id}
            accessibilityLabel={pet.name}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            onPress={() => onTogglePet(pet.id)}
            style={({ pressed }) => [
              styles.toggle,
              selected && styles.selectedToggle,
              !selected && styles.unselected,
              pressed && styles.pressed,
            ]}
          >
            <PetAvatar pet={pet} size={avatarSize} />
            {selected && (
              <View style={styles.check}>
                <Ionicons name="checkmark" size={9} color={colors.ink} />
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (colors: Palette, avatarSize: number) =>
  StyleSheet.create({
    // Room above and to the right for the check badge.
    list: { gap: 8, alignItems: 'center', paddingTop: 4, paddingRight: 4 },
    toggle: {
      padding: 2,
      borderRadius: avatarSize,
      borderWidth: 2.5,
      borderColor: colors.line,
    },
    selectedToggle: { borderColor: colors.kiwi },
    unselected: { opacity: 0.45 },
    pressed: { opacity: 0.7 },
    check: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 15,
      height: 15,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.bg,
      backgroundColor: colors.kiwi,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
