import { Ionicons } from '@expo/vector-icons';

import { formatEventTime } from '@/lib/dateUtils';
import { HealthEvent, HealthEventKind } from '@/lib/healthEvents';

export type TimelineEntry = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  meta: string;
  note: string;
  color: string;
};

const eventTitles: Record<HealthEventKind, string> = {
  Vomiting: 'Vomiting logged',
  Diarrhea: 'Diarrhea logged',
  Asthma: 'Asthma logged',
  Hairball: 'Hairball logged',
  Nausea: 'Nausea logged',
  'Loss of appetite': 'Loss of appetite logged',
  Other: 'Health observation',
};

export function toTimelineEntries(
  events: HealthEvent[],
  activePetId: string,
  accentColor: string,
): TimelineEntry[] {
  return events
    .filter((event) => event.petId === activePetId)
    .map((event) => ({
      id: event.id,
      icon: 'pulse-outline',
      title: eventTitles[event.kind],
      meta: formatEventTime(event.occurredAt),
      note: event.note,
      color: accentColor,
    }));
}
