import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PetCard } from '@/components/dashboard/PetCard';
import { Pet } from '@/lib/pets';
import { Palette } from '@/lib/theme';

type PetSelectorProps = {
  pets: Pet[];
  activePetId: string;
  colors: Palette;
  onSelectPet: (petId: string) => void;
  onAddPet: () => void;
};

export function PetSelector({
  pets,
  activePetId,
  colors,
  onSelectPet,
  onAddPet,
}: PetSelectorProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Your pets</Text>
        <Text style={styles.help}>Choose the profile you want to manage</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {pets.map((pet) => (
          <PetCard
            key={pet.id}
            pet={pet}
            active={pet.id === activePetId}
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
          <View style={styles.info}>
            <Text style={styles.addText}>Add pet</Text>
            <Text style={styles.addMeta}>Create profile</Text>
          </View>
        </Pressable>
      </ScrollView>
    </>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    header: { marginBottom: 10 },
    title: { fontSize: 19, color: colors.text, fontWeight: '700' },
    help: { fontSize: 12, color: colors.muted, marginTop: 3 },
    list: { gap: 10, paddingBottom: 18 },
    addCard: {
      width: 172,
      height: 78,
      borderRadius: 17,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.kiwi,
      backgroundColor: colors.surface2,
      padding: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    addPhoto: {
      width: 58,
      height: 58,
      borderRadius: 13,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.kiwi,
      backgroundColor: `${colors.kiwi}18`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: { flex: 1, minWidth: 0 },
    addText: { color: colors.kiwi, fontSize: 13, fontWeight: '800' },
    addMeta: { color: colors.muted, fontSize: 10, marginTop: 3 },
  });
