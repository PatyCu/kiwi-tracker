import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { CalendarItem } from '@/modules/calendar/calendarItems';
import { UPCOMING_CARE_DAYS } from '@/modules/calendar/upcomingCare';
import { CalendarItemRow } from '@/modules/calendar/ui/CalendarItemRow';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';
import { PlaceholderCard } from '@/shared/ui/PlaceholderCard';

type UpcomingCareListProps = {
  items: CalendarItem[];
  now: Date;
  /** Adds the pet's name to each event, for the household's list. */
  showPetNames: boolean;
  /** Names who the empty list is for, such as a pet; the household's otherwise. */
  emptyFor?: string;
};

/** The calendar events of the next days, soonest first, or an empty state. */
export function UpcomingCareList({ items, now, showPetNames, emptyFor }: UpcomingCareListProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (items.length === 0) {
    return (
      <PlaceholderCard
        title={`Nothing scheduled${emptyFor ? ` for ${emptyFor}` : ''} in the next ${UPCOMING_CARE_DAYS} days`}
        description="Use Schedule to add a vet visit, vaccine or medicine."
      />
    );
  }

  return (
    <View style={styles.card}>
      {items.map((item, index) => (
        <CalendarItemRow
          key={item.id}
          item={item}
          showPetName={showPetNames}
          dayRelativeTo={now}
          divider={index > 0}
        />
      ))}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 20,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
  });
