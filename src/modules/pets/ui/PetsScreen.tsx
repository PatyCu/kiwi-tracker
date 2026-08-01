import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { usePetProfileForms } from '@/modules/pets/state/PetProfileFormsProvider';
import { PetAvatar } from '@/modules/pets/ui/PetAvatar';
import { getPetStatus, PetStatusLevel } from '@/modules/pet-status/calculatePetStatus';
import { getPetStatusColor } from '@/modules/pet-status/getPetStatusColor';
import { Palette } from '@/shared/theme/palette';
import { LoadError } from '@/shared/ui/LoadState';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

export function PetsScreen() {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { pets, loadStatus, retryLoad } = usePets();
  const { events } = usePetEvents();
  const { addPet, editPet } = usePetProfileForms();
  const now = new Date();

  if (loadStatus === 'error') {
    return (
      <Screen>
        <LoadError onRetry={() => void retryLoad()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        showLogo
        title="Pets"
        subtitle="Choose a pet to see their full history."
        action={{ accessibilityLabel: 'Add pet', icon: 'add', onPress: addPet }}
      />
      <View style={styles.list}>
        {pets.map((pet) => {
          const status = getPetStatus(
            events.filter((event) => event.petId === pet.id),
            now,
          );
          return (
            <View key={pet.id} style={styles.card}>
              <Pressable
                accessibilityLabel={`View ${pet.name}`}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/pets/[petId]', params: { petId: pet.id } })
                }
                style={styles.petLink}
              >
                <PetAvatar pet={pet} size={62} />
                <View style={styles.copy}>
                  <Text style={styles.name}>{pet.name}</Text>
                  <Text style={styles.meta}>{pet.breed || pet.species}</Text>
                  <View style={styles.status}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: getPetStatusColor(status.status, colors) },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {status.status === PetStatusLevel.Green ? 'All calm' : status.headline}
                    </Text>
                  </View>
                </View>
              </Pressable>
              <Pressable
                accessibilityLabel={`Edit ${pet.name}`}
                accessibilityRole="button"
                onPress={() => editPet(pet)}
                style={styles.editButton}
              >
                <Ionicons name="create-outline" size={21} color={colors.text} />
              </Pressable>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    list: { gap: 12 },
    card: {
      minHeight: 102,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 20,
      backgroundColor: colors.surface,
    },
    petLink: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 16,
    },
    editButton: {
      width: 44,
      height: 44,
      marginRight: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
      backgroundColor: colors.surface2,
    },
    copy: { flex: 1 },
    name: { color: colors.text, fontSize: 19, fontWeight: '800' },
    meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
    status: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 9 },
    dot: { width: 9, height: 9, borderRadius: 5 },
    statusText: { color: colors.note, fontSize: 12, fontWeight: '600' },
  });
