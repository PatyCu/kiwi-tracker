import { PlaceholderCard } from '@/shared/ui/PlaceholderCard';
import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

type PlaceholderScreenProps = {
  title: string;
  description: string;
  onBack: () => void;
};

export function PlaceholderScreen({ title, description, onBack }: PlaceholderScreenProps) {
  return (
    <Screen>
      <ScreenHeader title={title} onBack={onBack} />
      <PlaceholderCard title="Not implemented yet" description={description} />
    </Screen>
  );
}
