import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Pet } from '@/modules/pets/model/Pet';
import { PetSelectorCard } from '@/modules/pets/ui/PetSelectorCard';
import { Palette } from '@/shared/theme/palette';

type PetSelectorProps = {
  pets: readonly Pet[];
  selectedPetId: string;
  colors: Palette;
  onSelectPet: (petId: string) => void;
  onAddPet: () => void;
};

export function PetSelector({
  pets,
  selectedPetId,
  colors,
  onSelectPet,
  onAddPet,
}: PetSelectorProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Your pets</Text>
        <Text style={styles.help}>Choose the profile you want to manage.</Text>
      </View>
      <ScrollView
        horizontal
        accessibilityRole="tablist"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {pets.map((pet) => (
          <PetSelectorCard
            key={pet.id}
            pet={pet}
            selected={pet.id === selectedPetId}
            colors={colors}
            onPress={() => onSelectPet(pet.id)}
          />
        ))}
        <Pressable
          accessibilityLabel="Add another pet"
          accessibilityRole="button"
          onPress={onAddPet}
          style={styles.addCard}
        >
          <View style={styles.addPhoto}>
            <Ionicons name="add" size={22} color={colors.kiwi} />
          </View>
          <View style={styles.addCopy}>
            <Text style={styles.addTitle}>Add pet</Text>
            <Text style={styles.addMeta}>Create profile</Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    header: { marginBottom: 10 },
    title: { color: colors.text, fontSize: 19, fontWeight: '700' },
    help: { color: colors.muted, fontSize: 12, marginTop: 3 },
    list: { gap: 10, paddingBottom: 24 },
    addCard: {
      width: 172,
      height: 78,
      padding: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.kiwi,
      borderRadius: 17,
      backgroundColor: colors.surface2,
    },
    addPhoto: {
      width: 58,
      height: 58,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.kiwi,
      borderRadius: 13,
      backgroundColor: `${colors.kiwi}18`,
    },
    addCopy: { flex: 1, minWidth: 0 },
    addTitle: { color: colors.kiwi, fontSize: 13, fontWeight: '800' },
    addMeta: { color: colors.muted, fontSize: 10, marginTop: 3 },
  });
