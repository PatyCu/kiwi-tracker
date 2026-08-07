import { Ionicons } from '@expo/vector-icons';

import { formatEventTime } from '@/shared/dates/dateTime';
import {
  DietChangeEvent,
  DietItemSnapshot,
  SymptomKind,
  PetEvent,
} from '@/modules/pet-events/model/PetEvent';
import { Pet } from '@/modules/pets/model/Pet';

export type TimelineEntry = {
  id: string;
  petId: string;
  petName?: string;
  petPhotoUri?: string;
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
  events: readonly PetEvent[],
  petId: string,
  symptomColor: string,
  dietColor: string,
  otherColor: string,
  now: Date,
): TimelineEntry[] {
  return events
    .filter((event) => event.petId === petId)
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
    .map((event) => toTimelineEntry(event, symptomColor, dietColor, otherColor, now));
}

export function toGlobalTimelineEntries(
  events: readonly PetEvent[],
  pets: readonly Pet[],
  symptomColor: string,
  dietColor: string,
  otherColor: string,
  now: Date,
): TimelineEntry[] {
  return [...events]
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
    .map((event) => {
      const pet = pets.find((item) => item.id === event.petId);
      return {
        ...toTimelineEntry(event, symptomColor, dietColor, otherColor, now),
        petName: pet?.name ?? 'Unknown pet',
        petPhotoUri: pet?.photoUri,
      };
    });
}

function toTimelineEntry(
  event: PetEvent,
  symptomColor: string,
  dietColor: string,
  otherColor: string,
  now: Date,
): TimelineEntry {
  if (event.type === 'symptom') {
    return {
      id: event.id,
      petId: event.petId,
      icon: 'pulse-outline',
      title: symptomTitles[event.symptom],
      meta: formatEventTime(event.occurredAt, now),
      occurredAt: event.occurredAt,
      note: event.note,
      color: symptomColor,
    };
  }
  if (event.type === 'diet-change') return toDietChangeEntry(event, dietColor, now);
  return {
    id: event.id,
    petId: event.petId,
    icon: 'ellipsis-horizontal-circle-outline',
    title: event.title,
    meta: formatEventTime(event.occurredAt, now),
    occurredAt: event.occurredAt,
    note: event.note,
    color: otherColor,
  };
}

function toDietChangeEntry(event: DietChangeEvent, color: string, now: Date): TimelineEntry {
  const common = {
    id: event.id,
    petId: event.petId,
    icon: 'restaurant-outline' as const,
    meta: formatEventTime(event.occurredAt, now),
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
