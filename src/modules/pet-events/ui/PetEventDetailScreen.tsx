import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { usePetEventForms } from '@/modules/pet-events/state/PetEventFormsProvider';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { toTimelineEntries } from '@/modules/pet-events/timeline/toTimelineEntries';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { PetAvatar } from '@/modules/pets/ui/PetAvatar';
import { Palette } from '@/shared/theme/palette';
import { PlaceholderCard } from '@/shared/ui/PlaceholderCard';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

export function PetEventDetailScreen() {
  const { petId, recordId } = useLocalSearchParams<{ petId: string; recordId: string }>();
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { pets } = usePets();
  const { events } = usePetEvents();
  const forms = usePetEventForms();
  const pet = pets.find((item) => item.id === petId);
  const entry = toTimelineEntries(
    events,
    petId,
    colors.coral,
    colors.kiwi,
    colors.muted,
    new Date(),
  ).find((item) => item.id === recordId);
  if (!pet || !entry)
    return (
      <Screen>
        <ScreenHeader title="Event not found" onBack={() => router.back()} />
        <PlaceholderCard
          title="This event is unavailable"
          description="It may have been removed from this device."
        />
      </Screen>
    );
  return (
    <Screen>
      <ScreenHeader title="Event detail" subtitle={pet.name} onBack={() => router.back()} />
      <View style={styles.card}>
        <View style={styles.petRow}>
          <PetAvatar pet={pet} />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/pets/[petId]', params: { petId: pet.id } })}
          >
            <Text style={styles.petName}>{pet.name}</Text>
            <Text style={styles.petLink}>View pet overview</Text>
          </Pressable>
        </View>
        <View style={[styles.icon, { backgroundColor: `${entry.color}20` }]}>
          <Ionicons name={entry.icon} size={28} color={entry.color} />
        </View>
        <Text style={styles.title}>{entry.title}</Text>
        <Text style={styles.meta}>{entry.meta}</Text>
        {entry.note && <Text style={styles.note}>{entry.note}</Text>}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => forms.editEvent(entry.id)}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryText}>Edit event</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => forms.requestDeleteEvent(entry, pet.name)}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteText}>Delete event</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      padding: 22,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 24,
      backgroundColor: colors.surface,
    },
    petRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 26 },
    petName: { color: colors.text, fontSize: 16, fontWeight: '800' },
    petLink: { color: colors.kiwi, fontSize: 12, marginTop: 3 },
    icon: {
      width: 56,
      height: 56,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: 16 },
    meta: { color: colors.muted, fontSize: 13, marginTop: 6 },
    note: { color: colors.note, fontSize: 15, lineHeight: 22, marginTop: 18 },
    actions: { gap: 10, marginTop: 28 },
    secondaryButton: {
      alignItems: 'center',
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.surface2,
    },
    secondaryText: { color: colors.text, fontWeight: '700' },
    deleteButton: { alignItems: 'center', padding: 14 },
    deleteText: { color: colors.coral, fontWeight: '700' },
  });
