import { Ionicons } from '@expo/vector-icons';

import { formatEventTime } from '@/lib/dateUtils';
import {
  DietChangeEvent,
  DietItemSnapshot,
  SymptomKind,
  TimelineEvent,
} from '@/lib/timelineEvents';

export type TimelineEntry = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  meta: string;
  occurredAt: string;
  note?: string;
  color: string;
};

const symptomTitles: Record<SymptomKind, string> = {
  Vomiting: 'Vomiting logged',
  Diarrhea: 'Diarrhea logged',
  Asthma: 'Asthma logged',
  Hairball: 'Hairball logged',
  Nausea: 'Nausea logged',
  'Loss of appetite': 'Loss of appetite logged',
  Other: 'Symptom observation',
};

export function toTimelineEntries(
  events: TimelineEvent[],
  activePetId: string,
  symptomColor: string,
  dietColor: string,
): TimelineEntry[] {
  return events
    .filter((event) => event.petId === activePetId)
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
    .map((event) =>
      event.type === 'symptom'
        ? {
            id: event.id,
            icon: 'pulse-outline',
            title: symptomTitles[event.symptom],
            meta: formatEventTime(event.occurredAt),
            occurredAt: event.occurredAt,
            note: event.note,
            color: symptomColor,
          }
        : toDietChangeEntry(event, dietColor),
    );
}

function toDietChangeEntry(event: DietChangeEvent, color: string): TimelineEntry {
  const common = {
    id: event.id,
    icon: 'restaurant-outline' as const,
    meta: formatEventTime(event.occurredAt),
    occurredAt: event.occurredAt,
    color,
  };

  if (event.change.type === 'replace') {
    return {
      ...common,
      title: `Switched to ${formatDietItem(event.change.nextItem)}`,
      note: joinNote(`Replaced ${formatDietItem(event.change.previousItem)}.`, event.note),
    };
  }

  if (event.change.type === 'add') {
    return {
      ...common,
      title: `Added ${formatDietItem(event.change.item)}`,
      note: event.note,
    };
  }

  return {
    ...common,
    title: `Stopped ${formatDietItem(event.change.item)}`,
    note: event.note,
  };
}

function formatDietItem(item: DietItemSnapshot): string {
  return item.productName;
}

function joinNote(context: string | undefined, note: string | undefined): string | undefined {
  return [context, note].filter(Boolean).join(' ') || undefined;
}
