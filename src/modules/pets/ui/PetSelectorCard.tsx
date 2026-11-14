import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { petPhotoSource } from '@/modules/pets/media/petPhotoCache';
import { Pet } from '@/modules/pets/model/Pet';
import { Palette } from '@/shared/theme/palette';

type PetSelectorCardProps = {
  pet: Pet;
  selected: boolean;
  colors: Palette;
  onPress: () => void;
  onEditProfile: () => void;
};

export function PetSelectorCard({
  pet,
  selected,
  colors,
  onPress,
  onEditProfile,
}: PetSelectorCardProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const photoSource = petPhotoSource(pet);
  const [editActive, setEditActive] = useState(false);

  return (
    <View style={[styles.card, selected && styles.selectedCard]}>
      <Pressable
        accessibilityLabel={`${pet.name}${selected ? ', selected pet' : ''}`}
        accessibilityRole="tab"
        aria-selected={selected}
        onPress={onPress}
        style={styles.selectPet}
      >
        {photoSource ? (
          <Image
            accessibilityLabel={`${pet.name} photo`}
            source={photoSource}
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
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel={`Edit profile for ${pet.name}`}
        accessibilityRole="button"
        hitSlop={8}
        onBlur={() => setEditActive(false)}
        onFocus={() => setEditActive(true)}
        onHoverIn={() => setEditActive(true)}
        onHoverOut={() => setEditActive(false)}
        onPress={onEditProfile}
        style={styles.editProfile}
      >
        <Text testID={`pet-edit-profile-text-${pet.id}`} style={styles.editProfileText}>
          Edit
        </Text>
        <View
          testID={`pet-edit-profile-icon-${pet.id}`}
          style={[styles.editIcon, !editActive && styles.hiddenEditIcon]}
        >
          <Ionicons name="pencil-outline" size={11} color={colors.muted} />
        </View>
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      width: 172,
      height: 78,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 17,
      backgroundColor: colors.surface2,
      overflow: 'hidden',
    },
    selectedCard: {
      borderWidth: 2,
      borderColor: colors.kiwi,
      backgroundColor: colors.surface,
    },
    selectPet: {
      flex: 1,
      padding: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    photo: { width: 58, height: 58, borderRadius: 13 },
    fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
    copy: { flex: 1, minWidth: 0, alignSelf: 'flex-start', paddingTop: 9 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    name: { flexShrink: 1, color: colors.text, fontSize: 15, fontWeight: '800' },
    editProfile: {
      position: 'absolute',
      left: 73,
      bottom: 15,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    editProfileText: { color: colors.muted, fontSize: 10, textDecorationLine: 'underline' },
    editIcon: { width: 16, marginLeft: 3, alignItems: 'center' },
    hiddenEditIcon: { opacity: 0 },
  });
