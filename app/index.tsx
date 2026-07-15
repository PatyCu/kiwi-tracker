import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert as NativeAlert,
  Image,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
  useWindowDimensions,
  useColorScheme,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { darkColors, lightColors, Palette } from '@/lib/theme';
import { KiwiMark } from '@/components/KiwiMark';
import {
  HEALTH_EVENT_KINDS,
  HealthEvent,
  HealthEventKind,
  loadHealthEvents,
  saveHealthEvents,
} from '@/lib/healthEvents';
import { DEFAULT_PET, loadPets, Pet, savePets } from '@/lib/pets';
import { deletePersistedPetPhoto, migrateLegacyPetPhotos, SelectedPetPhoto } from '@/lib/petImages';
import { savePetProfile } from '@/lib/petProfileService';
import * as ImagePicker from 'expo-image-picker';

type Event = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  meta: string;
  note: string;
  color: string;
};
type Appearance = 'system' | 'light' | 'dark';
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
  const [tab, setTab] = useState('Today');
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
  const activePet = pets.find((pet) => pet.id === activePetId) ?? pets[0];
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
  const timeline = useMemo<Event[]>(
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
        <View style={s.header}>
          <View style={s.brand}>
            <KiwiMark size={52} />
            <View>
              <Text style={s.eyebrow}>KIWI TRACKER</Text>
              <Text style={s.greeting}>Good morning, Alex</Text>
            </View>
          </View>
          <Pressable
            accessibilityLabel="Appearance settings"
            onPress={() => setThemeOpen(true)}
            style={s.avatar}
          >
            <Ionicons
              name={isDark ? 'moon-outline' : 'sunny-outline'}
              size={19}
              color={colors.text}
            />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          <View style={s.petSelectorHeader}>
            <Text style={s.sectionTitle}>Your pets</Text>
            <Text style={s.petSelectorHelp}>Choose the profile you want to manage</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.petSelector}
          >
            {pets.map((pet) => {
              const active = pet.id === activePetId;
              return (
                <Pressable
                  accessibilityLabel={`${pet.name}${active ? ', active pet' : ''}`}
                  accessibilityState={{ selected: active }}
                  key={pet.id}
                  onPress={() => selectPet(pet.id)}
                  style={[s.compactPetCard, active && s.compactPetCardActive]}
                >
                  {pet.photoUri ? (
                    <Image source={{ uri: pet.photoUri }} style={s.compactPetPhoto} />
                  ) : (
                    <View style={[s.compactPetPhoto, s.petPhotoFallback]}>
                      <Ionicons name="paw" size={22} color={colors.kiwi} />
                    </View>
                  )}
                  <View style={s.compactPetInfo}>
                    <View style={s.compactPetNameRow}>
                      <Text numberOfLines={1} style={s.compactPetName}>
                        {pet.name}
                      </Text>
                      {active && <Ionicons name="checkmark-circle" size={17} color={colors.kiwi} />}
                    </View>
                    <Text numberOfLines={1} style={s.compactPetMeta}>
                      {pet.breed || pet.species}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            <Pressable
              accessibilityLabel="Add another pet"
              onPress={() => openPetForm()}
              style={s.compactAddCard}
            >
              <View style={[s.compactPetPhoto, s.compactAddPhoto]}>
                <Ionicons name="add" size={22} color={colors.kiwi} />
              </View>
              <View style={s.compactPetInfo}>
                <Text style={s.compactAddText}>Add pet</Text>
                <Text style={s.compactAddMeta}>Create profile</Text>
              </View>
            </Pressable>
          </ScrollView>
          <View style={[s.hero, wide && s.heroWide]}>
            <View style={{ flex: 1 }}>
              <Text style={s.kicker}>TODAY WITH {activePet?.name.toUpperCase()}</Text>
              <Text style={s.heroTitle}>Everything looks calm.</Text>
              <Text style={s.heroBody}>
                {timeline.length === 0
                  ? 'No health events logged yet.'
                  : 'Your latest observations are ready to review.'}
              </Text>
            </View>
            <View style={s.score}>
              <Ionicons
                name={activePet?.species === 'Dog' ? 'paw' : 'heart'}
                size={29}
                color={colors.kiwi}
              />
              <Text style={s.scoreLabel}>{activePet?.species.toUpperCase()}</Text>
            </View>
          </View>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Up next</Text>
            <Text style={s.link}>See all</Text>
          </View>
          <View style={s.reminder}>
            <View style={[s.iconBox, { backgroundColor: '#2C271D' }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Annual vaccines</Text>
              <Text style={s.meta}>Vet appointment · 18 July, 10:30</Text>
            </View>
            <Text style={s.badge}>7 DAYS</Text>
          </View>
          <Text style={[s.sectionTitle, { marginTop: 28 }]}>Quick log</Text>
          <View style={s.quick}>
            {[
              ['medical', 'Symptom', colors.coral],
              ['restaurant', 'Meal', colors.kiwi],
              ['walk', 'Activity', colors.blue],
              ['water', 'Medicine', colors.amber],
            ].map(([icon, label, color]) => (
              <Pressable key={label} onPress={() => setOpen(true)} style={s.quickItem}>
                <View style={[s.quickIcon, { backgroundColor: `${color}22` }]}>
                  <Ionicons name={`${icon}-outline` as any} size={23} color={color} />
                </View>
                <Text style={s.quickText}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Recent timeline</Text>
            <Pressable onPress={() => (Platform.OS === 'web' ? window.print() : null)}>
              <Text style={s.link}>Export for vet</Text>
            </Pressable>
          </View>
          {timeline.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="journal-outline" size={25} color={colors.muted} />
              <Text style={s.emptyTitle}>No events for {activePet?.name}</Text>
              <Text style={s.emptyBody}>
                Use Quick log or the + button to add the first observation.
              </Text>
            </View>
          ) : (
            timeline.map((e, i) => (
              <View key={e.id} style={s.event}>
                <View style={s.rail}>
                  <View style={[s.dot, { borderColor: e.color }]}>
                    <Ionicons name={e.icon} size={17} color={e.color} />
                  </View>
                  {i < timeline.length - 1 && <View style={s.line} />}
                </View>
                <View style={s.eventBody}>
                  <Text style={s.cardTitle}>{e.title}</Text>
                  <Text style={s.meta}>{e.meta}</Text>
                  <Text style={s.note}>{e.note}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
        <View style={s.tabs}>
          {['Today', 'Timeline', 'Care', 'Pet'].map((x) => (
            <Pressable
              key={x}
              onPress={() => {
                setTab(x);
                if (x === 'Pet' && activePet) openPetForm(activePet);
              }}
              style={s.tab}
            >
              <Ionicons
                name={
                  (({ Today: 'home', Timeline: 'time', Care: 'calendar', Pet: 'paw' } as any)[x] +
                    (tab === x ? '' : '-outline')) as keyof typeof Ionicons.glyphMap
                }
                size={21}
                color={tab === x ? colors.kiwi : colors.muted}
              />
              <Text style={[s.tabText, tab === x && { color: colors.kiwi }]}>{x}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={s.fab} onPress={() => setOpen(true)}>
          <Ionicons name="add" size={28} color={colors.ink} />
        </Pressable>
        <Modal
          visible={open}
          transparent
          animationType="slide"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable style={s.overlay} onPress={() => setOpen(false)}>
            <Pressable style={s.sheet}>
              <View style={s.handle} />
              <Text style={s.sheetTitle}>Log a health event</Text>
              <Text style={s.label}>WHAT HAPPENED?</Text>
              <View style={s.choiceRow}>
                {HEALTH_EVENT_KINDS.map((x) => (
                  <Pressable
                    key={x}
                    onPress={() => setKind(x)}
                    style={[s.choice, kind === x && s.choiceSelected]}
                  >
                    <Text style={[s.choiceText, kind === x && s.choiceTextSelected]}>{x}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={s.label}>NOTES</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add useful context for your vet…"
                placeholderTextColor={colors.muted}
                multiline
                style={s.input}
              />
              <Pressable
                disabled={isSaving}
                style={[s.save, isSaving && s.saveDisabled]}
                onPress={add}
              >
                <Text style={s.saveText}>{isSaving ? 'Saving…' : 'Save event'}</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
        <Modal
          visible={themeOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setThemeOpen(false)}
        >
          <Pressable style={s.centerOverlay} onPress={() => setThemeOpen(false)}>
            <Pressable style={s.appearanceCard}>
              <Text style={s.sheetTitle}>Appearance</Text>
              <Text style={s.appearanceHelp}>Use your device setting or choose a theme.</Text>
              {(['system', 'light', 'dark'] as Appearance[]).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    setAppearance(option);
                    setThemeOpen(false);
                  }}
                  style={s.appearanceRow}
                >
                  <Ionicons
                    name={
                      option === 'system'
                        ? 'phone-portrait-outline'
                        : option === 'light'
                          ? 'sunny-outline'
                          : 'moon-outline'
                    }
                    size={21}
                    color={colors.text}
                  />
                  <Text style={s.appearanceText}>{option[0].toUpperCase() + option.slice(1)}</Text>
                  {appearance === option && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.kiwi} />
                  )}
                </Pressable>
              ))}
            </Pressable>
          </Pressable>
        </Modal>
        <Modal
          visible={addPetOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setAddPetOpen(false)}
        >
          <Pressable style={s.overlay} onPress={() => setAddPetOpen(false)}>
            <Pressable style={s.sheet}>
              <View style={s.handle} />
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={s.sheetTitle}>{editingPetId ? 'Edit pet' : 'Add a pet'}</Text>
                <Pressable onPress={pickPetPhoto} style={s.photoPicker}>
                  {petPhotoUri ? (
                    <Image source={{ uri: petPhotoUri }} style={s.photoPreview} />
                  ) : (
                    <View style={[s.photoPreview, s.petPhotoFallback]}>
                      <Ionicons name="camera-outline" size={29} color={colors.kiwi} />
                    </View>
                  )}
                  <Text style={s.photoPickerText}>
                    {petPhotoUri ? 'Change photo' : 'Add photo'}
                  </Text>
                </Pressable>
                <Text style={s.label}>NAME</Text>
                <TextInput
                  value={petName}
                  onChangeText={setPetName}
                  autoFocus
                  placeholder="e.g. Miso"
                  placeholderTextColor={colors.muted}
                  style={[s.input, s.nameInput]}
                />
                <Text style={s.label}>SPECIES</Text>
                <View style={s.choiceRow}>
                  {(['Cat', 'Dog', 'Other'] as Pet['species'][]).map((species) => (
                    <Pressable
                      key={species}
                      onPress={() => setPetSpecies(species)}
                      style={[s.choice, petSpecies === species && s.choiceSelected]}
                    >
                      <Text style={[s.choiceText, petSpecies === species && s.choiceTextSelected]}>
                        {species}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={s.label}>BREED</Text>
                <TextInput
                  value={petBreed}
                  onChangeText={setPetBreed}
                  placeholder="e.g. European shorthair"
                  placeholderTextColor={colors.muted}
                  style={[s.input, s.nameInput]}
                />
                <Text style={s.label}>DATE OF BIRTH</Text>
                <TextInput
                  value={petBirthDate}
                  onChangeText={setPetBirthDate}
                  placeholder="DD-MM-YYYY"
                  placeholderTextColor={colors.muted}
                  keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
                  maxLength={10}
                  style={[s.input, s.nameInput, !isValidBirthDate(petBirthDate) && s.inputError]}
                />
                {!isValidBirthDate(petBirthDate) && (
                  <Text style={s.errorText}>
                    Use DD-MM-YYYY and choose today or an earlier date.
                  </Text>
                )}
                <Pressable
                  disabled={!petName.trim() || isSavingPet || !isValidBirthDate(petBirthDate)}
                  style={[
                    s.save,
                    (!petName.trim() || isSavingPet || !isValidBirthDate(petBirthDate)) &&
                      s.saveDisabled,
                  ]}
                  onPress={savePet}
                >
                  <Text style={s.saveText}>
                    {isSavingPet ? 'Saving…' : editingPetId ? 'Save changes' : 'Add pet'}
                  </Text>
                </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    petSelectorHeader: { marginBottom: 10 },
    petSelectorHelp: { fontSize: 12, color: colors.muted, marginTop: 3 },
    petSelector: { gap: 10, paddingBottom: 18 },
    compactPetCard: {
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
    compactPetCardActive: {
      borderColor: colors.kiwi,
      borderWidth: 2,
      backgroundColor: colors.surface,
    },
    compactPetPhoto: { width: 58, height: 58, borderRadius: 13 },
    compactPetInfo: { flex: 1, minWidth: 0 },
    compactPetNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    compactPetName: { flexShrink: 1, color: colors.text, fontSize: 15, fontWeight: '800' },
    compactPetMeta: { color: colors.muted, fontSize: 10, marginTop: 3 },
    compactAddCard: {
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
    compactAddPhoto: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.kiwi,
      backgroundColor: `${colors.kiwi}18`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    compactAddText: { color: colors.kiwi, fontSize: 13, fontWeight: '800' },
    compactAddMeta: { color: colors.muted, fontSize: 10, marginTop: 3 },
    inputError: { borderColor: colors.coral },
    errorText: { color: colors.coral, fontSize: 12, marginTop: 7 },
    photoPicker: { alignItems: 'center', alignSelf: 'center', marginTop: 18, gap: 8 },
    photoPreview: { width: 92, height: 92, borderRadius: 28 },
    photoPickerText: { color: colors.kiwi, fontSize: 13, fontWeight: '700' },
    petGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    petCard: {
      width: '48%',
      minHeight: 205,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface2,
      padding: 12,
      position: 'relative',
    },
    petCardActive: {
      borderColor: colors.kiwi,
      borderWidth: 2,
      backgroundColor: `${colors.kiwi}18`,
    },
    petPhoto: { width: '100%', height: 104, borderRadius: 14 },
    petPhotoFallback: {
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    petCardName: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 10 },
    petCardMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
    activeBadge: {
      position: 'absolute',
      zIndex: 1,
      top: 18,
      right: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.kiwi,
      borderRadius: 9,
      paddingVertical: 4,
      paddingHorizontal: 6,
    },
    activeBadgeText: { color: colors.ink, fontSize: 8, fontWeight: '900' },
    editPetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      marginTop: 9,
      paddingVertical: 3,
    },
    editPetText: { color: colors.text, fontSize: 11, fontWeight: '700' },
    addPetCard: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', gap: 8 },
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
    header: {
      height: 82,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    petNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    eyebrow: { fontSize: 10, letterSpacing: 2, color: colors.kiwi, fontWeight: '800' },
    greeting: { fontSize: 17, color: colors.text, fontWeight: '700', marginTop: 3 },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: colors.text, fontWeight: '700' },
    content: { padding: 20, paddingBottom: 120 },
    hero: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 24,
      padding: 22,
      flexDirection: 'row',
      gap: 16,
      alignItems: 'center',
    },
    heroWide: { padding: 30 },
    kicker: { fontSize: 11, color: colors.kiwi, fontWeight: '800', letterSpacing: 1.5 },
    heroTitle: { fontSize: 27, color: colors.text, fontWeight: '700', marginTop: 8 },
    heroBody: { fontSize: 14, color: colors.muted, marginTop: 8, lineHeight: 20 },
    score: {
      width: 82,
      height: 82,
      borderRadius: 41,
      borderWidth: 6,
      borderColor: colors.kiwi,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    scoreNum: { color: colors.text, fontSize: 25, fontWeight: '800' },
    scoreLabel: { color: colors.muted, fontSize: 7, fontWeight: '700' },
    sectionHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 28,
      marginBottom: 12,
    },
    sectionTitle: { fontSize: 19, color: colors.text, fontWeight: '700' },
    link: { fontSize: 13, color: colors.kiwi, fontWeight: '700' },
    reminder: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      borderWidth: 1,
      borderColor: colors.line,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: { fontSize: 15, color: colors.text, fontWeight: '700' },
    meta: { fontSize: 12, color: colors.muted, marginTop: 5 },
    badge: {
      color: colors.amber,
      fontSize: 9,
      fontWeight: '800',
      backgroundColor: colors.amberWash,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    quick: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
    quickItem: { alignItems: 'center', gap: 8, width: '23%' },
    quickIcon: {
      width: 56,
      height: 56,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
    event: { flexDirection: 'row', minHeight: 94 },
    rail: { width: 45, alignItems: 'center' },
    dot: {
      width: 37,
      height: 37,
      borderRadius: 19,
      borderWidth: 1.5,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    line: { width: 1, backgroundColor: colors.line, flex: 1 },
    eventBody: { flex: 1, paddingLeft: 10, paddingBottom: 23 },
    note: { fontSize: 13, color: colors.note, marginTop: 8, lineHeight: 18 },
    empty: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.line,
      borderRadius: 18,
      padding: 22,
      alignItems: 'center',
      gap: 7,
    },
    emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
    emptyBody: { color: colors.muted, fontSize: 13, textAlign: 'center' },
    tabs: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 76,
      backgroundColor: colors.tabBar,
      borderTopWidth: 1,
      borderColor: colors.line,
      flexDirection: 'row',
      paddingTop: 10,
    },
    tab: { flex: 1, alignItems: 'center', gap: 4 },
    tabText: { fontSize: 10, color: colors.muted, fontWeight: '600' },
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
    overlay: { flex: 1, backgroundColor: '#000A', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 22,
      paddingBottom: 36,
    },
    handle: {
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.line,
      alignSelf: 'center',
    },
    sheetTitle: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 20 },
    label: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.3,
      marginTop: 24,
      marginBottom: 10,
    },
    choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    choice: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    choiceSelected: { borderColor: colors.kiwi, backgroundColor: colors.surface2 },
    choiceText: { color: colors.text, fontSize: 13 },
    choiceTextSelected: { color: colors.kiwi, fontWeight: '700' },
    input: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 14,
      minHeight: 88,
      padding: 14,
      color: colors.text,
      textAlignVertical: 'top',
    },
    nameInput: { minHeight: 50, textAlignVertical: 'center' },
    save: {
      backgroundColor: colors.kiwi,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      marginTop: 18,
    },
    saveDisabled: { opacity: 0.5 },
    saveText: { color: colors.ink, fontWeight: '800' },
    petRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      marginTop: 9,
    },
    petRowActive: { borderColor: colors.kiwi, backgroundColor: colors.surface2 },
    petAvatar: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: colors.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addPetButton: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
    },
    addPetText: { color: colors.kiwi, fontSize: 15, fontWeight: '700' },
    centerOverlay: {
      flex: 1,
      backgroundColor: '#0008',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    appearanceCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 22,
      borderWidth: 1,
      borderColor: colors.line,
    },
    appearanceHelp: { color: colors.muted, fontSize: 14, marginTop: 8, marginBottom: 12 },
    appearanceRow: {
      height: 54,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    appearanceText: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '600' },
  });
