import { Pet } from '@/modules/pets/model/Pet';
import { PetStatus } from '@/modules/pet-status/calculatePetStatus';
import { StatusSummaryCard } from '@/modules/pet-status/ui/StatusSummaryCard';
import { Palette } from '@/shared/theme/palette';

type PetStatusCardProps = {
  pet: Pet;
  status: PetStatus;
  wide: boolean;
  colors: Palette;
};

export function PetStatusCard({ pet, status, wide, colors }: PetStatusCardProps) {
  return (
    <StatusSummaryCard
      indicatorLabel={pet.species}
      kicker={`Today with ${pet.name}`}
      status={status}
      wide={wide}
      colors={colors}
    />
  );
}
