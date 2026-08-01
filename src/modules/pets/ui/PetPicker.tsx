import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Pet } from '@/modules/pets/model/Pet';
import { PetAvatar } from '@/modules/pets/ui/PetAvatar';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type PetPickerProps = {
  pets: readonly Pet[];
  selectedPetId: string;
  onSelectPet: (petId: string) => void;
};

export function PetPicker({ pets, selectedPetId, onSelectPet }: PetPickerProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View accessibilityRole="radiogroup" style={styles.options}>
      {pets.map((pet) => {
        const selected = pet.id === selectedPetId;
        return (
          <Pressable
            key={pet.id}
            accessibilityLabel={`Select ${pet.name}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onSelectPet(pet.id)}
            style={[styles.option, selected && styles.selectedOption]}
          >
            <PetAvatar pet={pet} size={34} />
            <Text style={styles.name}>{pet.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      padding: 5,
      paddingRight: 11,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.line,
    },
    selectedOption: { borderColor: colors.kiwi, backgroundColor: `${colors.kiwi}12` },
    name: { color: colors.text, fontSize: 13, fontWeight: '700' },
  });
