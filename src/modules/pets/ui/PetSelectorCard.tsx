import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Pet } from '@/modules/pets/model/Pet';
import { Palette } from '@/shared/theme/palette';

type PetSelectorCardProps = {
  pet: Pet;
  selected: boolean;
  colors: Palette;
  onPress: () => void;
};

export function PetSelectorCard({ pet, selected, colors, onPress }: PetSelectorCardProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityLabel={`${pet.name}${selected ? ', selected pet' : ''}`}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.card, selected && styles.selectedCard]}
    >
      {pet.photoUri ? (
        <Image
          accessibilityLabel={`${pet.name} photo`}
          source={{ uri: pet.photoUri }}
          style={styles.photo}
        />
      ) : (
        <View accessibilityLabel={`${pet.name} avatar`} style={[styles.photo, styles.fallback]}>
          <Ionicons name="paw" size={22} color={colors.kiwi} />
        </View>
      )}
      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.name}>
            {pet.name}
          </Text>
          {selected && <Ionicons name="checkmark-circle" size={17} color={colors.kiwi} />}
        </View>
        <Text numberOfLines={1} style={styles.meta}>
          {pet.breed || pet.species}
        </Text>
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      width: 172,
      height: 78,
      padding: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 17,
      backgroundColor: colors.surface2,
    },
    selectedCard: {
      borderWidth: 2,
      borderColor: colors.kiwi,
      backgroundColor: colors.surface,
    },
    photo: { width: 58, height: 58, borderRadius: 13 },
    fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
    copy: { flex: 1, minWidth: 0 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    name: { flexShrink: 1, color: colors.text, fontSize: 15, fontWeight: '800' },
    meta: { color: colors.muted, fontSize: 10, marginTop: 3 },
  });
