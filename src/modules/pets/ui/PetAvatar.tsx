import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Pet } from '@/modules/pets/model/Pet';
import { Palette } from '@/shared/theme/palette';

type PetAvatarProps = { pet: Pet; size?: number };

export function PetAvatar({ pet, size = 48 }: PetAvatarProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors, size), [colors, size]);
  if (pet.photoUri)
    return (
      <Image
        accessibilityLabel={`${pet.name} photo`}
        source={{ uri: pet.photoUri }}
        style={styles.avatar}
      />
    );
  return (
    <View accessibilityLabel={`${pet.name} avatar`} style={[styles.avatar, styles.fallback]}>
      <Ionicons name="paw" size={size * 0.42} color={colors.kiwi} />
    </View>
  );
}

const makeStyles = (colors: Palette, size: number) =>
  StyleSheet.create({
    avatar: { width: size, height: size, borderRadius: size / 2 },
    fallback: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  });
