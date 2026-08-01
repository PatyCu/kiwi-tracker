import { PetEvent } from '@/modules/pet-events/model/PetEvent';
import { Pet } from '@/modules/pets/model/Pet';
import {
  evaluatePetStatus,
  PetStatus,
  PetStatusLevel,
} from '@/modules/pet-status/calculatePetStatus';
import { formatPetNames } from '@/modules/today/formatPetNames';

const LAST_DAY_MS = 24 * 60 * 60 * 1000;

export type PetAttention = { pet: Pet; status: PetStatus; eventId: string };
export type TodayStatusSummary = {
  indicatorLabel: string;
  kicker: string;
  status: PetStatus;
};

export type TodayViewModel = {
  statusSummary: TodayStatusSummary;
  attention: PetAttention[];
  recentEvents: PetEvent[];
  updatesInLastDay: number;
};

export function buildTodayViewModel(
  pets: readonly Pet[],
  events: readonly PetEvent[],
  now: Date,
): TodayViewModel {
  const evaluations = pets.map((pet) => {
    const evaluation = evaluatePetStatus(
      events.filter((event) => event.petId === pet.id),
      now,
    );
    return {
      pet,
      status: evaluation.status,
      eventId: evaluation.triggeringEventIds[0] ?? '',
    };
  });
  const statusSummary = buildStatusSummary(evaluations);
  const attention = [...evaluations]
    .filter(({ status, eventId }) => status.status !== PetStatusLevel.Green && eventId !== '')
    .map(({ pet, status, eventId }) => ({ pet, status, eventId }))
    .sort((left, right) => statusPriority(right.status) - statusPriority(left.status));
  const recentEvents = [...events]
    .filter((event) => Date.parse(event.occurredAt) <= now.getTime())
    .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
    .slice(0, 5);
  const threshold = now.getTime() - LAST_DAY_MS;
  const updatesInLastDay = events.filter(
    (event) => Date.parse(event.recordedAt) >= threshold,
  ).length;

  return { statusSummary, attention, recentEvents, updatesInLastDay };
}

function buildStatusSummary(
  evaluations: { pet: Pet; status: PetStatus; eventId: string }[],
): TodayStatusSummary {
  const highestPriorityEvaluation = evaluations.reduce((highest, current) =>
    statusPriority(current.status) > statusPriority(highest.status) ? current : highest,
  );
  const highestPriorityStatus = highestPriorityEvaluation.status;
  const isSinglePet = evaluations.length === 1;
  const names = formatPetNames(evaluations.map(({ pet }) => pet.name));

  if (isSinglePet) {
    return {
      indicatorLabel: evaluations[0].pet.species,
      kicker: `Today with ${names}`,
      status: highestPriorityStatus,
    };
  }

  const relevantEvaluations = evaluations.filter(
    ({ status }) => status.status === highestPriorityStatus.status,
  );
  const description =
    highestPriorityStatus.status === PetStatusLevel.Green
      ? highestPriorityStatus.description
      : relevantEvaluations
          .flatMap(({ pet, status }) =>
            status.description
              .split('\n')
              .map((line) => `- ${pet.name}: ${line.replace(/^- /, '')}`),
          )
          .join('\n');

  return {
    indicatorLabel: 'Pets',
    kicker: `Today with ${names}`,
    status: { ...highestPriorityStatus, description },
  };
}

function statusPriority(status: PetStatus): number {
  if (status.status === PetStatusLevel.Red) return 2;
  if (status.status === PetStatusLevel.Amber) return 1;
  return 0;
}
