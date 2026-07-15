import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert as NativeAlert,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
  useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { darkColors, lightColors, Palette } from '@/lib/theme';
import { KiwiMark } from '@/components/KiwiMark';
import { Appearance, AppearanceModal } from '@/components/dashboard/AppearanceModal';
import { BottomNavigation, DashboardTab } from '@/components/dashboard/BottomNavigation';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { HealthEventModal } from '@/components/dashboard/HealthEventModal';
import { PetProfileModal } from '@/components/dashboard/PetProfileModal';
import { PetSelector } from '@/components/dashboard/PetSelector';
import { QuickLog } from '@/components/dashboard/QuickLog';
import { Timeline, TimelineEntry } from '@/components/dashboard/Timeline';
import { TodaySummary } from '@/components/dashboard/TodaySummary';
import { UpcomingCare } from '@/components/dashboard/UpcomingCare';
import {
  HealthEvent,
  HealthEventKind,
  loadHealthEvents,
  saveHealthEvents,
} from '@/lib/healthEvents';
import { DEFAULT_PET, loadPets, Pet, savePets } from '@/lib/pets';
import { deletePersistedPetPhoto, migrateLegacyPetPhotos, SelectedPetPhoto } from '@/lib/petImages';
import { savePetProfile } from '@/lib/petProfileService';
import * as ImagePicker from 'expo-image-picker';

type LoadStatus = 'loading' | 'ready' | 'error';

const eventTitles: Record<HealthEventKind, string> = {
  Vomiting: 'Vomiting logged',
  Diarrhea: 'Diarrhea logged',
  Asthma: 'Asthma logged',
  Hairball: 'Hairball logged',
  Nausea: 'Nausea logged',
  'Loss of appetite': 'Loss of appetite logged',
  Other: 'Health observation',
};
const Alert = {
  alert: (title: string, message: string) =>
    Platform.OS === 'web'
      ? window.alert(`${title}\n\n${message}`)
      : NativeAlert.alert(title, message),
};

function formatEventTime(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
  const day = sameDay(date, today)
    ? 'Today'
    : sameDay(date, yesterday)
      ? 'Yesterday'
      : date.toLocaleDateString([], { day: 'numeric', month: 'short' });
  return `${day} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function isValidBirthDate(value: string) {
  return toStoredBirthDate(value) !== null;
}

function toStoredBirthDate(value: string): string | undefined | null {
  if (!value) return undefined;
  if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) return null;
  const [day, month, year] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getTime() > Date.now()
  )
    return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function toDisplayedBirthDate(value?: string): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
}

export default function Home() {
  const scheme = useColorScheme();
  const [appearance, setAppearance] = useState<Appearance>('system');
  const isDark = appearance === 'dark' || (appearance === 'system' && scheme === 'dark');
  const colors = isDark ? darkColors : lightColors;
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [tab, setTab] = useState<DashboardTab>('Today');
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [addPetOpen, setAddPetOpen] = useState(false);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [pets, setPets] = useState<Pet[]>([DEFAULT_PET]);
  const [activePetId, setActivePetId] = useState(DEFAULT_PET.id);
  const [note, setNote] = useState('');
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState<Pet['species']>('Cat');
  const [petBreed, setPetBreed] = useState('');
  const [petBirthDate, setPetBirthDate] = useState('');
  const [petPhotoUri, setPetPhotoUri] = useState<string>();
  const [selectedPetPhoto, setSelectedPetPhoto] = useState<SelectedPetPhoto>();
  const [editingPetId, setEditingPetId] = useState<string>();
  const [isSavingPet, setIsSavingPet] = useState(false);
  const [kind, setKind] = useState<HealthEventKind>('Vomiting');
  const [isSaving, setIsSaving] = useState(false);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const { width } = useWindowDimensions();
  const wide = width > 780;
  const loadData = useCallback(async () => {
    setLoadStatus('loading');
    try {
      const [events, petState] = await Promise.all([loadHealthEvents(), loadPets()]);
      const migration = await migrateLegacyPetPhotos(petState.pets);
      let resolvedPetState = petState;
      if (migration.didChange) {
        try {
          await savePets(migration.pets, petState.activePetId);
          resolvedPetState = { pets: migration.pets, activePetId: petState.activePetId };
        } catch {
          try {
            resolvedPetState = await loadPets();
            const referencedPhotoUris = new Set(
              resolvedPetState.pets.map((pet) => pet.photoUri).filter(Boolean),
            );
            await Promise.all(
              migration.createdUris
                .filter((uri) => !referencedPhotoUris.has(uri))
                .map((uri) => deletePersistedPetPhoto(uri).catch(() => undefined)),
            );
          } catch {
            resolvedPetState = petState;
          }
          migration.failedPetNames = petState.pets
            .filter((pet) => {
              if (!pet.photoUri) return false;
              const resolvedPet = resolvedPetState.pets.find((item) => item.id === pet.id);
              return (
                !resolvedPet ||
                (resolvedPet.photoUri === pet.photoUri && resolvedPet.photoStorageVersion !== 1)
              );
            })
            .map((pet) => pet.name);
        }
      }
      setHealthEvents(events);
      setPets(resolvedPetState.pets);
      setActivePetId(resolvedPetState.activePetId);
      if (migration.failedPetNames.length > 0) {
        Alert.alert(
          'Some photos need updating',
          `Please choose a new photo for ${migration.failedPetNames.join(', ')} so it can be stored permanently.`,
        );
      }
      setLoadStatus('ready');
    } catch {
      setLoadStatus('error');
    }
  }, []);
  useEffect(() => {
    void loadData();
  }, [loadData]);
  const activePet = pets.find((pet) => pet.id === activePetId) ?? pets[0] ?? DEFAULT_PET;
  const selectPet = async (petId: string) => {
    if (loadStatus !== 'ready') return;
    const previous = activePetId;
    setActivePetId(petId);
    try {
      await savePets(pets, petId);
    } catch {
      try {
        const persistedState = await loadPets();
        if (persistedState.activePetId === petId) {
          setPets(persistedState.pets);
          setActivePetId(petId);
          return;
        }
      } catch {
        // Keep showing the last confirmed in-memory selection until data can be loaded again.
      }
      setActivePetId(previous);
      Alert.alert(
        'Pet not selected',
        'The new selection could not be confirmed. Your previous pet remains displayed.',
      );
    }
  };
  const openPetForm = (pet?: Pet) => {
    setEditingPetId(pet?.id);
    setPetName(pet?.name ?? '');
    setPetSpecies(pet?.species ?? 'Cat');
    setPetBreed(pet?.breed ?? '');
    setPetBirthDate(toDisplayedBirthDate(pet?.birthDate));
    setPetPhotoUri(pet?.photoUri);
    setSelectedPetPhoto(undefined);
    setAddPetOpen(true);
  };
  const pickPetPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Photo access needed',
        'Allow photo library access to choose a picture for your pet.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setPetPhotoUri(asset.uri);
      setSelectedPetPhoto({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType });
    }
  };
  const savePet = async () => {
    const name = petName.trim();
    const storedBirthDate = toStoredBirthDate(petBirthDate);
    if (loadStatus !== 'ready' || !name || isSavingPet || storedBirthDate === null) return;
    const existing = pets.find((pet) => pet.id === editingPetId);
    setIsSavingPet(true);
    try {
      const result = await savePetProfile({
        pets,
        editingPetId,
        name,
        species: petSpecies,
        breed: petBreed,
        birthDate: storedBirthDate,
        selectedPhoto: selectedPetPhoto,
      });
      setPets(result.pets);
      setActivePetId(result.activePetId);
      setAddPetOpen(false);
      if (result.previousPhotoCleanupFailed) {
        Alert.alert(
          'Pet saved',
          'The profile was saved, but its previous photo could not be removed from device storage.',
        );
      }
    } catch {
      Alert.alert(
        existing ? 'Pet not updated' : 'Pet not added',
        'The profile could not be confirmed as saved. Reopen the app before trying again so your local data can be checked safely.',
      );
    } finally {
      setIsSavingPet(false);
    }
  };
  const add = async () => {
    if (loadStatus !== 'ready' || isSaving || !activePet) return;
    const newEvent: HealthEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      petId: activePet.id,
      kind,
      occurredAt: new Date().toISOString(),
      note: note.trim() || 'No additional notes.',
    };
    const next = [newEvent, ...healthEvents];
    setIsSaving(true);
    try {
      await saveHealthEvents(next);
      setHealthEvents(next);
      setNote('');
      setKind('Vomiting');
      setOpen(false);
    } catch {
      Alert.alert('Event not saved', 'Please try again. Your event has not been added.');
    } finally {
      setIsSaving(false);
    }
  };
  const timeline = useMemo<TimelineEntry[]>(
    () =>
      healthEvents
        .filter((event) => event.petId === activePetId)
        .map((event) => ({
          id: event.id,
          icon: 'pulse-outline' as const,
          title: eventTitles[event.kind],
          meta: formatEventTime(event.occurredAt),
          note: event.note,
          color: colors.coral,
        })),
    [healthEvents, activePetId, colors.coral],
  );
  if (loadStatus !== 'ready') {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={s.loadState}>
          <KiwiMark size={64} />
          {loadStatus === 'loading' ? (
            <>
              <ActivityIndicator color={colors.kiwi} size="large" />
              <Text style={s.loadTitle}>Loading your data…</Text>
              <Text style={s.loadBody}>Your saved pets and health events are being prepared.</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-offline-outline" size={34} color={colors.coral} />
              <Text style={s.loadTitle}>Could not load your data</Text>
              <Text style={s.loadBody}>
                Your saved data has not been changed. Check your device storage and try again.
              </Text>
              <Pressable accessibilityRole="button" onPress={loadData} style={s.retryButton}>
                <Text style={s.retryText}>Retry</Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[s.shell, wide && s.shellWide]}>
        <DashboardHeader
          isDark={isDark}
          colors={colors}
          onOpenAppearance={() => setThemeOpen(true)}
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          <PetSelector
            pets={pets}
            activePetId={activePetId}
            colors={colors}
            onSelectPet={selectPet}
            onAddPet={() => openPetForm()}
          />
          <TodaySummary
            pet={activePet}
            hasEvents={timeline.length > 0}
            wide={wide}
            colors={colors}
          />
          <UpcomingCare colors={colors} />
          <QuickLog colors={colors} onLog={() => setOpen(true)} />
          <Timeline
            entries={timeline}
            petName={activePet.name}
            colors={colors}
            onExport={() => {
              if (Platform.OS === 'web') window.print();
            }}
          />
        </ScrollView>
        <BottomNavigation
          activeTab={tab}
          colors={colors}
          onSelect={(nextTab) => {
            setTab(nextTab);
            if (nextTab === 'Pet') openPetForm(activePet);
          }}
        />
        <Pressable style={s.fab} onPress={() => setOpen(true)}>
          <Ionicons name="add" size={28} color={colors.ink} />
        </Pressable>
        <HealthEventModal
          visible={open}
          kind={kind}
          note={note}
          isSaving={isSaving}
          colors={colors}
          onKindChange={setKind}
          onNoteChange={setNote}
          onSave={add}
          onClose={() => setOpen(false)}
        />
        <AppearanceModal
          visible={themeOpen}
          appearance={appearance}
          colors={colors}
          onSelect={(option) => {
            setAppearance(option);
            setThemeOpen(false);
          }}
          onClose={() => setThemeOpen(false)}
        />
        <PetProfileModal
          visible={addPetOpen}
          editing={Boolean(editingPetId)}
          name={petName}
          species={petSpecies}
          breed={petBreed}
          birthDate={petBirthDate}
          photoUri={petPhotoUri}
          birthDateIsValid={isValidBirthDate(petBirthDate)}
          isSaving={isSavingPet}
          colors={colors}
          onNameChange={setPetName}
          onSpeciesChange={setPetSpecies}
          onBreedChange={setPetBreed}
          onBirthDateChange={setPetBirthDate}
          onPickPhoto={pickPetPhoto}
          onSave={savePet}
          onClose={() => setAddPetOpen(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    loadState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 16,
    },
    loadTitle: { color: colors.text, fontSize: 21, fontWeight: '700', textAlign: 'center' },
    loadBody: {
      maxWidth: 420,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
    },
    retryButton: {
      minWidth: 140,
      backgroundColor: colors.kiwi,
      borderRadius: 14,
      paddingHorizontal: 22,
      paddingVertical: 14,
      alignItems: 'center',
    },
    retryText: { color: colors.ink, fontSize: 15, fontWeight: '800' },
    shell: { flex: 1, width: '100%', maxWidth: 920, alignSelf: 'center' },
    shellWide: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.line },
    content: { padding: 20, paddingBottom: 120 },
    fab: {
      position: 'absolute',
      right: 22,
      bottom: 91,
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: colors.kiwi,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
