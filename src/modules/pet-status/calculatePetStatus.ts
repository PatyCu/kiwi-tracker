import { PetEvent } from '@/modules/pet-events/model/PetEvent';

const DAYS_IN_RED_WINDOW = 3;
const DAYS_IN_AMBER_WINDOW = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export enum PetStatusLevel {
  Green = 'green',
  Amber = 'amber',
  Red = 'red',
}

enum PetStatusCause {
  Symptom = 'symptom',
  DietChange = 'diet-change',
}

export type PetStatus = {
  status: PetStatusLevel;
  headline: string;
  description: string;
};

export type PetStatusEvaluation = {
  status: PetStatus;
  triggeringEventIds: string[];
};

type StatusEventBase = {
  id: string;
  occurredAt: string;
  daysAgo: number;
};

type StatusEvent =
  | (StatusEventBase & {
      cause: PetStatusCause.Symptom;
      symptomName: string;
    })
  | (StatusEventBase & {
      cause: PetStatusCause.DietChange;
    });

/** Returns the highest-priority recent-activity status for one pet's events. */
export function getPetStatus(events: readonly PetEvent[], now: Date): PetStatus {
  return evaluatePetStatus(events, now).status;
}

export function evaluatePetStatus(events: readonly PetEvent[], now: Date): PetStatusEvaluation {
  const recentEvents = uniqueEventsById(events)
    .map((event) => toStatusEvent(event, now))
    .filter((event): event is StatusEvent => event !== null)
    .sort(byMostRecent);

  const redEvents = recentEvents.filter(isRedTrigger);
  if (redEvents.length > 0) {
    return {
      status: statusFromEvents(PetStatusLevel.Red, redEvents),
      triggeringEventIds: redEvents.map((event) => event.id),
    };
  }

  const amberEvents = recentEvents.filter(isAmberTrigger);
  if (amberEvents.length > 0) {
    return {
      status: statusFromEvents(PetStatusLevel.Amber, amberEvents),
      triggeringEventIds: amberEvents.map((event) => event.id),
    };
  }

  return {
    status: {
      status: PetStatusLevel.Green,
      headline: 'Everything looks calm.',
      description: 'No recent symptoms or changes to review.',
    },
    triggeringEventIds: [],
  };
}

function uniqueEventsById(events: readonly PetEvent[]): PetEvent[] {
  const seenIds = new Set<string>();

  return events.filter((event) => {
    if (seenIds.has(event.id)) return false;
    seenIds.add(event.id);
    return true;
  });
}

function toStatusEvent(event: PetEvent, now: Date): StatusEvent | null {
  const daysAgo = getCalendarDaysAgo(event.occurredAt, now);
  if (daysAgo === null || daysAgo < 0 || daysAgo > DAYS_IN_AMBER_WINDOW) return null;

  switch (event.type) {
    case 'symptom':
      return {
        id: event.id,
        cause: PetStatusCause.Symptom,
        symptomName: event.symptom,
        occurredAt: event.occurredAt,
        daysAgo,
      };
    case 'diet-change':
      return {
        id: event.id,
        cause: PetStatusCause.DietChange,
        occurredAt: event.occurredAt,
        daysAgo,
      };
    case 'other':
      return null;
    // Add treatment handling when it becomes a persisted PetEvent type.
  }
}

function isRedTrigger(event: StatusEvent): boolean {
  return event.cause === PetStatusCause.Symptom && event.daysAgo <= DAYS_IN_RED_WINDOW;
}

function isAmberTrigger(event: StatusEvent): boolean {
  if (event.cause === PetStatusCause.DietChange) return true;
  return event.daysAgo > DAYS_IN_RED_WINDOW;
}

function statusFromEvents(
  status: PetStatusLevel.Red | PetStatusLevel.Amber,
  events: StatusEvent[],
): PetStatus {
  return {
    status,
    headline:
      status === PetStatusLevel.Red
        ? 'Something needs your attention.'
        : 'Something to keep an eye on.',
    description: events.map((event) => `- ${describeEvent(event)}`).join('\n'),
  };
}

function describeEvent(event: StatusEvent): string {
  const relativeTime = formatDaysAgo(event.daysAgo);

  if (event.cause === PetStatusCause.Symptom) {
    return `${event.symptomName} was logged ${relativeTime}.`;
  }

  return `Diet changed ${relativeTime}. Keep an eye out for new symptoms.`;
}

function getCalendarDaysAgo(occurredAt: string, now: Date): number | null {
  const occurred = new Date(occurredAt);
  if (
    Number.isNaN(occurred.getTime()) ||
    Number.isNaN(now.getTime()) ||
    occurred.getTime() > now.getTime()
  ) {
    return null;
  }

  const occurredDay = Date.UTC(occurred.getFullYear(), occurred.getMonth(), occurred.getDate());
  const currentDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  return Math.round((currentDay - occurredDay) / MILLISECONDS_PER_DAY);
}

function formatDaysAgo(daysAgo: number): string {
  if (daysAgo === 0) return 'today';
  if (daysAgo === 1) return '1 day ago';
  return `${daysAgo} days ago`;
}

function byMostRecent(left: StatusEvent, right: StatusEvent): number {
  return (
    Date.parse(right.occurredAt) - Date.parse(left.occurredAt) || right.id.localeCompare(left.id)
  );
}
