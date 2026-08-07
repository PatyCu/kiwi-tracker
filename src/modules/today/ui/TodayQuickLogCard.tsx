import { usePetEventForms } from '@/modules/pet-events/state/PetEventFormsProvider';
import { QuickLogCard } from '@/modules/pet-events/ui/QuickLogCard';
import { Pet } from '@/modules/pets/model/Pet';
import { useAppearance } from '@/shared/theme/AppearanceProvider';

type TodayQuickLogCardProps = { pets: readonly Pet[] };

export function TodayQuickLogCard({ pets }: TodayQuickLogCardProps) {
  const { colors } = useAppearance();
  const forms = usePetEventForms();

  return (
    <QuickLogCard
      colors={colors}
      onLogSymptom={() => forms.openSymptom(pets.length === 1 ? pets[0].id : undefined)}
      onLogDietChange={() => forms.openDietChange(pets.length === 1 ? pets[0].id : undefined)}
      onLogOther={() => forms.openOtherEvent(pets.length === 1 ? pets[0].id : undefined)}
    />
  );
}
