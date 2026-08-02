import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { usePetEvents } from '@/modules/pet-events/state/PetEventsProvider';
import { toGlobalTimelineEntries } from '@/modules/pet-events/timeline/toTimelineEntries';
import { usePets } from '@/modules/pets/state/PetsProvider';
import { buildTodayViewModel } from '@/modules/today/buildTodayViewModel';
import { GlobalQuickLogModal } from '@/modules/today/ui/GlobalQuickLogModal';
import { TodayCard } from '@/modules/today/ui/TodayCard';
import { TodayMetrics } from '@/modules/today/ui/TodayMetrics';
import { TodayQuickLogCard } from '@/modules/today/ui/TodayQuickLogCard';
import { Palette } from '@/shared/theme/palette';
import { LoadError } from '@/shared/ui/LoadState';
import { PlaceholderCard } from '@/shared/ui/PlaceholderCard';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';
import { SectionHeader } from '@/shared/ui/SectionHeader';

export function TodayScreen() {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { pets, loadStatus: petsStatus, retryLoad: retryPets } = usePets();
  const { events, loadStatus: eventsStatus, retryLoad: retryEvents } = usePetEvents();
  const [quickLogVisible, setQuickLogVisible] = useState(false);
  const now = new Date();
  const viewModel = buildTodayViewModel(pets, events, now);
  const recentEntries = toGlobalTimelineEntries(
    viewModel.recentEvents,
    pets,
    colors.coral,
    colors.kiwi,
    colors.muted,
    now,
  );

  if (petsStatus === 'error' || eventsStatus === 'error') {
    return (
      <Screen>
        <LoadError onRetry={() => void Promise.all([retryPets(), retryEvents()])} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        showLogo
        title="Today"
        subtitle="Here’s what’s happening with your pets."
        action={{
          accessibilityLabel: 'Quick log',
          icon: 'add',
          onPress: () => setQuickLogVisible(true),
        }}
      />
      <View style={styles.contentStack}>
        <TodayCard
          pets={pets}
          summary={viewModel.statusSummary}
          attention={viewModel.attention}
          colors={colors}
          onOpenPet={(pet) =>
            router.push({
              pathname: '/pets',
              params: { petId: pet.id },
            })
          }
        />
        <TodayMetrics attention={viewModel.attention.length} updates={viewModel.updatesInLastDay} />
        <View style={styles.section}>
          <SectionHeader compact title="Upcoming (next 7 days)" />
          <PlaceholderCard
            title="No calendar events yet"
            description="Upcoming care will appear here when calendar events are implemented."
          />
        </View>

        <View style={styles.section}>
          <SectionHeader compact title="Overdue" />
          <PlaceholderCard
            title="No overdue items"
            description="Overdue care will appear here when calendar events are implemented."
          />
        </View>

        <View style={styles.section}>
          <SectionHeader
            compact
            title="Recent updates"
            actionLabel="See all"
            onAction={() => router.push('/timeline')}
          />
          {recentEntries.length === 0 ? (
            <PlaceholderCard
              title="No updates yet"
              description="Log the first event to start building your pets’ history."
              icon="journal-outline"
            />
          ) : (
            <View style={styles.listCard}>
              {recentEntries.map((entry, index) => (
                <Pressable
                  key={entry.id}
                  accessibilityLabel={`${entry.petName}: ${entry.title}, ${entry.meta}`}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/pets/[petId]/records/[recordId]',
                      params: { petId: entry.petId, recordId: entry.id },
                    })
                  }
                  style={[styles.updateRow, index > 0 && styles.divider]}
                >
                  <View style={[styles.eventIcon, { backgroundColor: `${entry.color}20` }]}>
                    <Ionicons name={entry.icon} size={21} color={entry.color} />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.petName}>{entry.petName}</Text>
                    <Text style={styles.rowTitle}>
                      {entry.title} · <Text style={styles.rowMeta}>{entry.meta}</Text>
                    </Text>
                    {entry.note && (
                      <Text numberOfLines={1} style={styles.rowBody}>
                        {entry.note}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
        <View style={styles.section}>
          <SectionHeader compact title="Add event" />
          <TodayQuickLogCard pets={pets} />
        </View>
      </View>
      <GlobalQuickLogModal
        visible={quickLogVisible}
        pets={pets}
        onClose={() => setQuickLogVisible(false)}
      />
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    contentStack: { gap: 24 },
    section: { gap: 12 },
    listCard: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 20,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    updateRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16 },
    divider: { borderTopWidth: 1, borderTopColor: colors.line },
    rowCopy: { flex: 1 },
    petName: { color: colors.text, fontSize: 15, fontWeight: '800' },
    rowTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
    rowMeta: { color: colors.muted, fontWeight: '500' },
    rowBody: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
    eventIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
