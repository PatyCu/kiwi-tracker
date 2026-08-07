import { router } from 'expo-router';

import { PlaceholderScreen } from '@/shared/ui/PlaceholderScreen';

export default function PetCareRoute() {
  return (
    <PlaceholderScreen
      title="Care"
      description="Care tracking is part of the MVP roadmap but is not implemented yet."
      onBack={() => router.back()}
    />
  );
}
