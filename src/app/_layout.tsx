import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppearanceProvider, useAppearance } from '@/shared/theme/AppearanceProvider';
import { PetEventFormsProvider } from '@/modules/pet-events/state/PetEventFormsProvider';
import { PetEventsProvider } from '@/modules/pet-events/state/PetEventsProvider';
import { PetProfileFormsProvider } from '@/modules/pets/state/PetProfileFormsProvider';
import { PetsProvider } from '@/modules/pets/state/PetsProvider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppearanceProvider>
        <PetsProvider>
          <PetEventsProvider>
            <PetProfileFormsProvider>
              <PetEventFormsProvider>
                <RootStack />
              </PetEventFormsProvider>
            </PetProfileFormsProvider>
          </PetEventsProvider>
        </PetsProvider>
      </AppearanceProvider>
    </SafeAreaProvider>
  );
}

function RootStack() {
  const { colors, isDark } = useAppearance();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
