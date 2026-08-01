import { PetStatusLevel } from '@/modules/pet-status/calculatePetStatus';
import { Palette } from '@/shared/theme/palette';

export function getPetStatusColor(status: PetStatusLevel, colors: Palette): string {
  if (status === PetStatusLevel.Red) return colors.coral;
  if (status === PetStatusLevel.Amber) return colors.statusAmber;
  return colors.kiwi;
}
