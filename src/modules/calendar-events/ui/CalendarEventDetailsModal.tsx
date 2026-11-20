import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CalendarEvent } from '@/modules/calendar-events/model/CalendarEvent';
import { Pet } from '@/modules/pets/model/Pet';
import { PetAvatar } from '@/modules/pets/ui/PetAvatar';
import { formatClockTime } from '@/shared/dates/dateTime';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';
import { ModalSheet } from '@/shared/ui/modal/ModalSheet';

type CalendarEventDetailsModalProps = {
  /** Hidden while there is no event to show. */
  event: CalendarEvent | undefined;
  pet: Pet | undefined;
  onClose: () => void;
};

/** Everything saved for one calendar event, read-only. */
export function CalendarEventDetailsModal({ event, pet, onClose }: CalendarEventDetailsModalProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ModalSheet
      visible={event !== undefined}
      title={event?.title ?? ''}
      testID="calendar-event-details"
      onClose={onClose}
    >
      {event && (
        <>
          {pet && (
            <>
              <Text style={styles.label}>PET</Text>
              <View style={styles.petRow}>
                <PetAvatar pet={pet} size={36} />
                <Text style={styles.value}>{pet.name}</Text>
              </View>
            </>
          )}
          <Text style={styles.label}>DATE</Text>
          <Text style={styles.value}>
            {new Date(event.startsAt).toLocaleDateString([], {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.label}>TIME</Text>
          <Text style={styles.value}>
            {formatClockTime(event.startsAt)} – {formatClockTime(event.endsAt)}
          </Text>
          {event.location && (
            <>
              <Text style={styles.label}>LOCATION</Text>
              <Text style={styles.value}>{event.location}</Text>
            </>
          )}
          {event.description && (
            <>
              <Text style={styles.label}>DESCRIPTION</Text>
              <Text style={styles.description}>{event.description}</Text>
            </>
          )}
        </>
      )}
    </ModalSheet>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    label: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.3,
      marginTop: 24,
      marginBottom: 8,
    },
    petRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    value: { color: colors.text, fontSize: 16, fontWeight: '600' },
    description: { color: colors.note, fontSize: 15, lineHeight: 22 },
  });
