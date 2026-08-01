import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Pet } from '@/modules/pets/model/Pet';
import { PetAvatar } from '@/modules/pets/ui/PetAvatar';
import { PetStatusLevel } from '@/modules/pet-status/calculatePetStatus';
import { PetStatusIndicator } from '@/modules/pet-status/ui/PetStatusIndicator';
import { PetAttention, TodayStatusSummary } from '@/modules/today/buildTodayViewModel';
import { formatPetNames } from '@/modules/today/formatPetNames';
import { Palette } from '@/shared/theme/palette';

type TodayCardProps = {
  pets: readonly Pet[];
  summary: TodayStatusSummary;
  attention: readonly PetAttention[];
  colors: Palette;
  onOpenRadarItem: (item: PetAttention) => void;
};

const MAX_VISIBLE_AVATARS = 4;

export function TodayCard({ pets, summary, attention, colors, onOpenRadarItem }: TodayCardProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const allClear = summary.status.status === PetStatusLevel.Green;

  return (
    <View testID="today-summary-card" style={styles.container}>
      <View style={styles.summary}>
        <PetStatusIndicator
          label={summary.indicatorLabel}
          status={summary.status.status}
          colors={colors}
        />
        <View style={styles.copy}>
          <Text style={styles.kicker}>{summary.kicker}</Text>
          <Text style={styles.title}>{summary.status.headline}</Text>
          <Text testID="today-status-description" style={styles.body}>
            {allClear ? summary.status.description : 'Recent activity needs to stay on your radar.'}
          </Text>
        </View>
      </View>

      <View style={styles.radarArea}>
        {allClear ? (
          <AllClearPets pets={pets} styles={styles} />
        ) : (
          attention.map((item, index) => (
            <RadarItem
              key={item.pet.id}
              item={item}
              colors={colors}
              showDivider={index > 0}
              styles={styles}
              onPress={() => onOpenRadarItem(item)}
            />
          ))
        )}
      </View>
    </View>
  );
}

function AllClearPets({
  pets,
  styles,
}: {
  pets: readonly Pet[];
  styles: ReturnType<typeof makeStyles>;
}) {
  const visiblePets = pets.slice(0, MAX_VISIBLE_AVATARS);
  const remainingCount = pets.length - visiblePets.length;
  const names = formatPetNames(pets.map((pet) => pet.name));
  const message =
    pets.length === 1 ? `${names} is in the green.` : `${names} are all in the green.`;

  return (
    <View accessibilityLabel={message} style={styles.allClearRow}>
      <View style={styles.avatarStack}>
        {visiblePets.map((pet, index) => (
          <View key={pet.id} style={[styles.avatarFrame, index > 0 && styles.overlappingAvatar]}>
            <PetAvatar pet={pet} size={44} />
          </View>
        ))}
        {remainingCount > 0 && (
          <View style={[styles.morePets, styles.overlappingAvatar]}>
            <Text style={styles.morePetsText}>+{remainingCount}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.body, styles.calmText]}>{message}</Text>
    </View>
  );
}

function RadarItem({
  item,
  colors,
  showDivider,
  styles,
  onPress,
}: {
  item: PetAttention;
  colors: Palette;
  showDivider: boolean;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
}) {
  const descriptionLines = item.status.description
    .split('\n')
    .map((line) => line.replace(/^- /, ''));

  return (
    <Pressable
      accessibilityLabel={`${item.pet.name}: ${descriptionLines.join(' ')}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.radarRow, showDivider && styles.radarDivider]}
    >
      <View style={styles.avatarFrame}>
        <PetAvatar pet={item.pet} size={46} />
      </View>
      <View style={styles.radarCopy}>
        <Text style={styles.petName}>{item.pet.name}</Text>
        {descriptionLines.map((line) => (
          <Text key={line} style={styles.radarDescription}>
            {line}
          </Text>
        ))}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 24,
      padding: 22,
    },
    summary: { flexDirection: 'row', alignItems: 'center', gap: 22 },
    copy: { flex: 1 },
    kicker: {
      fontSize: 11,
      color: colors.kiwi,
      fontWeight: '800',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    title: { fontSize: 27, color: colors.text, fontWeight: '700', marginTop: 8 },
    body: { fontSize: 14, color: colors.muted, lineHeight: 20, marginTop: 8 },
    radarArea: { marginTop: 18, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.line },
    allClearRow: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingLeft: 41,
    },
    calmText: { flexShrink: 1, marginTop: 0 },
    avatarStack: { flexDirection: 'row', alignItems: 'center' },
    avatarFrame: {
      borderWidth: 2,
      borderColor: colors.surface,
      borderRadius: 25,
      backgroundColor: colors.surface,
    },
    overlappingAvatar: { marginLeft: -10 },
    morePets: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
      borderRadius: 22,
      backgroundColor: colors.surface2,
    },
    morePetsText: { color: colors.text, fontSize: 12, fontWeight: '800' },
    radarRow: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 10,
    },
    radarDivider: { borderTopWidth: 1, borderTopColor: colors.line },
    radarCopy: { flex: 1 },
    petName: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 4 },
    radarDescription: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  });
