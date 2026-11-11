import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { usePetProfileForms } from '@/modules/pets/state/PetProfileFormsProvider';
import { PetAvatar } from '@/modules/pets/ui/PetAvatar';
import { Palette } from '@/shared/theme/palette';
import { LoadState } from '@/shared/ui/LoadState';
import { PlaceholderCard } from '@/shared/ui/PlaceholderCard';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

export function PetProfileScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { pets, loadStatus, retryLoad } = usePets();
  const { editPet } = usePetProfileForms();
  const pet = pets.find((item) => item.id === petId);
  if (loadStatus !== 'ready')
    return (
      <Screen>
        <ScreenHeader title="Profile" onBack={() => router.back()} />
        <LoadState status={loadStatus} onRetry={retryLoad} />
      </Screen>
    );
  if (!pet)
    return (
      <Screen>
        <ScreenHeader title="Pet not found" onBack={() => router.back()} />
        <PlaceholderCard
          title="This pet is unavailable"
          description="It may have been removed from this device."
        />
      </Screen>
    );
  return (
    <Screen>
      <ScreenHeader
        title={`${pet.name}’s profile`}
        onBack={() => router.back()}
        action={{
          accessibilityLabel: `Edit ${pet.name}`,
          icon: 'create-outline',
          onPress: () => editPet(pet),
        }}
      />
      <View style={styles.card}>
        <PetAvatar pet={pet} size={88} />
        <Text style={styles.name}>{pet.name}</Text>
        <ProfileRow label="Species" value={pet.species} colors={colors} />
        <ProfileRow label="Breed" value={pet.breed || 'Not provided'} colors={colors} />
        <ProfileRow label="Date of birth" value={pet.birthDate || 'Not provided'} colors={colors} />
        <Pressable accessibilityRole="button" onPress={() => editPet(pet)} style={styles.button}>
          <Text style={styles.buttonText}>Edit profile</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function ProfileRow({ label, value, colors }: { label: string; value: string; colors: Palette }) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      alignItems: 'center',
      padding: 22,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 24,
      backgroundColor: colors.surface,
    },
    name: { color: colors.text, fontSize: 25, fontWeight: '800', marginTop: 12, marginBottom: 20 },
    row: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    label: { color: colors.muted, fontSize: 13 },
    value: { color: colors.text, fontSize: 13, fontWeight: '600' },
    button: {
      width: '100%',
      alignItems: 'center',
      marginTop: 16,
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.kiwi,
    },
    buttonText: { color: colors.ink, fontWeight: '800' },
  });
