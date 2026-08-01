import { Link } from 'expo-router';
import { Text } from 'react-native';

import { Screen } from '@/shared/ui/Screen';
import { ScreenHeader } from '@/shared/ui/ScreenHeader';

export default function NotFoundRoute() {
  return (
    <Screen>
      <ScreenHeader title="Page not found" />
      <Link href="/">
        <Text>Return to Today</Text>
      </Link>
    </Screen>
  );
}
