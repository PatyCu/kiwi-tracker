import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Pet } from '@/modules/pets/model/Pet';
import { PetAvatar } from '@/modules/pets/ui/PetAvatar';
import { PetStatusLevel } from '@/modules/pet-status/calculatePetStatus';
import { PetStatusIndicator } from '@/modules/pet-status/ui/PetStatusIndicator';
import { PetInsight, TodayStatusSummary } from '@/modules/today/buildTodayViewModel';
import { Palette } from '@/shared/theme/palette';

type TodayCardProps = {
  summary: TodayStatusSummary;
  insights: readonly PetInsight[];
  colors: Palette;
  onOpenPet: (pet: Pet) => void;
};

export function TodayCard({ summary, insights, colors, onOpenPet }: TodayCardProps) {
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
        {insights.map((item, index) => (
          <InsightItem
            key={item.pet.id}
            item={item}
            colors={colors}
            showDivider={index > 0}
            styles={styles}
            onPress={() => onOpenPet(item.pet)}
          />
        ))}
      </View>
    </View>
  );
}

function InsightItem({
  item,
  colors,
  showDivider,
  styles,
  onPress,
}: {
  item: PetInsight;
  colors: Palette;
  showDivider: boolean;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
}) {
  const descriptionLines =
    item.status.status === PetStatusLevel.Green
      ? ['All good, nothing to see here.']
      : item.status.description.split('\n').map((line) => line.replace(/^- /, ''));

  return (
    <Pressable
      accessibilityLabel={`${item.pet.name}: ${descriptionLines.join(' ')}`}
      accessibilityHint={`Opens ${item.pet.name} in Pets.`}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.radarRow, showDivider && styles.radarDivider]}
    >
      <View style={styles.avatarFrame}>
        <PetAvatar pet={item.pet} size={46} />
      </View>
      <View style={styles.radarCopy}>
        <Text style={styles.petName}>{item.pet.name}</Text>
        {descriptionLines.map((line, index) => (
          // Lines can repeat (two matching events on one day), so the index keeps keys unique.
          <Text key={`${index}-${line}`} style={styles.radarDescription}>
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
    avatarFrame: {
      borderWidth: 2,
      borderColor: colors.surface,
      borderRadius: 25,
      backgroundColor: colors.surface,
    },
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
