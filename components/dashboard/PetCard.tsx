import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/lib/theme';
import { Pet } from '@/lib/pets';

type PetCardProps = {
  pet: Pet;
  active: boolean;
  colors: Palette;
  onPress: () => void;
};

export function PetCard({ pet, active, colors, onPress }: PetCardProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityLabel={`${pet.name}${active ? ', active pet' : ''}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.card, active && styles.activeCard]}
    >
      {pet.photoUri ? (
        <Image source={{ uri: pet.photoUri }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoFallback]}>
          <Ionicons name="paw" size={22} color={colors.kiwi} />
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.name}>
            {pet.name}
          </Text>
          {active && <Ionicons name="checkmark-circle" size={17} color={colors.kiwi} />}
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
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface2,
      padding: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    activeCard: {
      borderColor: colors.kiwi,
      borderWidth: 2,
      backgroundColor: colors.surface,
    },
    photo: { width: 58, height: 58, borderRadius: 13 },
    photoFallback: {
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: { flex: 1, minWidth: 0 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    name: { flexShrink: 1, color: colors.text, fontSize: 15, fontWeight: '800' },
    meta: { color: colors.muted, fontSize: 10, marginTop: 3 },
  });
