import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Pet } from '@/modules/pets/model/Pet';
import { PetPicker } from '@/modules/pets/ui/PetPicker';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type PetEventPetFieldProps = {
  pets: readonly Pet[];
  selectedPetId: string;
  onSelectPet: (petId: string) => void;
};

export function PetEventPetField({ pets, selectedPetId, onSelectPet }: PetEventPetFieldProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>PET</Text>
      <PetPicker pets={pets} selectedPetId={selectedPetId} onSelectPet={onSelectPet} />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    field: { marginBottom: 20 },
    label: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.1,
      marginBottom: 9,
    },
  });
