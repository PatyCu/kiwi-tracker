import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePetProfileForms } from '@/modules/pets/state/PetProfileFormsProvider';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';

type NoPetsCardProps = {
  /** What adding a pet unlocks on this screen. */
  description: string;
};

/** Shown in place of a screen's content while the household has no pets, with a way to add the first one. */
export function NoPetsCard({ description }: NoPetsCardProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { addPet } = usePetProfileForms();

  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="paw-outline" size={26} color={colors.muted} />
      </View>
      <Text style={styles.title}>No pets yet</Text>
      <Text style={styles.description}>{description}</Text>
      <Pressable accessibilityRole="button" onPress={addPet} style={styles.button}>
        <Text style={styles.buttonText}>Add your first pet</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 22,
      paddingVertical: 28,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    icon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
      backgroundColor: colors.surface2,
    },
    title: { color: colors.text, fontSize: 18, fontWeight: '800' },
    description: { color: colors.muted, fontSize: 14, textAlign: 'center' },
    button: {
      marginTop: 10,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.kiwi,
    },
    buttonText: { color: colors.ink, fontWeight: '800' },
  });
