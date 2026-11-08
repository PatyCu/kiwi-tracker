import { PetEvent } from '@/modules/pet-events/model/PetEvent';
import { Pet } from '@/modules/pets/model/Pet';
import {
  evaluatePetStatus,
  PetStatus,
  PetStatusLevel,
} from '@/modules/pet-status/calculatePetStatus';
import { formatPetNames } from '@/modules/today/formatPetNames';

export type PetInsight = { pet: Pet; status: PetStatus };
export type TodayStatusSummary = {
  indicatorLabel: string;
  kicker: string;
  status: PetStatus;
};

type TodayViewModel = {
  statusSummary: TodayStatusSummary;
  insights: PetInsight[];
};

export function buildTodayViewModel(
  pets: readonly Pet[],
  events: readonly PetEvent[],
  now: Date,
  /** Labels the summary; without one it names the pets instead. */
  householdAlias: string | null,
): TodayViewModel {
  const evaluations = pets.map((pet) => {
    const evaluation = evaluatePetStatus(
      events.filter((event) => event.petId === pet.id),
      now,
    );
    return {
      pet,
      status: evaluation.status,
    };
  });
  const statusSummary = buildStatusSummary(evaluations, householdAlias);
  const insights = [...evaluations].sort(
    (left, right) => statusPriority(right.status) - statusPriority(left.status),
  );
  return { statusSummary, insights };
}

function buildStatusSummary(
  evaluations: { pet: Pet; status: PetStatus }[],
  householdAlias: string | null,
): TodayStatusSummary {
  const highestPriorityEvaluation = evaluations.reduce((highest, current) =>
    statusPriority(current.status) > statusPriority(highest.status) ? current : highest,
  );
  const highestPriorityStatus = highestPriorityEvaluation.status;
  const isSinglePet = evaluations.length === 1;
  const kicker = householdAlias
    ? `Today in ${householdAlias}`
    : `Today with ${formatPetNames(evaluations.map(({ pet }) => pet.name))}`;

  if (isSinglePet) {
    return {
      indicatorLabel: evaluations[0].pet.species,
      kicker,
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
    kicker,
    status: { ...highestPriorityStatus, description },
  };
}

function statusPriority(status: PetStatus): number {
  if (status.status === PetStatusLevel.Red) return 2;
  if (status.status === PetStatusLevel.Amber) return 1;
  return 0;
}
