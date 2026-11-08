import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppearanceProvider, useAppearance } from '@/shared/theme/AppearanceProvider';
import { SessionProvider, useSession } from '@/modules/auth/state/SessionProvider';
import { SignInUnavailableScreen } from '@/modules/auth/ui/SignInUnavailableScreen';
import { HouseholdProvider, useHousehold } from '@/modules/households/state/HouseholdProvider';
import { NoHouseholdScreen } from '@/modules/households/ui/NoHouseholdScreen';
import { PetEventFormsProvider } from '@/modules/pet-events/state/PetEventFormsProvider';
import { PetEventsProvider } from '@/modules/pet-events/state/PetEventsProvider';
import { PetProfileFormsProvider } from '@/modules/pets/state/PetProfileFormsProvider';
import { PetsProvider } from '@/modules/pets/state/PetsProvider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppearanceProvider>
        <SessionProvider>
          <HouseholdProvider>
            <PetsProvider>
              <PetEventsProvider>
                <PetProfileFormsProvider>
                  <PetEventFormsProvider>
                    <RootStack />
                  </PetEventFormsProvider>
                </PetProfileFormsProvider>
              </PetEventsProvider>
            </PetsProvider>
          </HouseholdProvider>
        </SessionProvider>
      </AppearanceProvider>
    </SafeAreaProvider>
  );
}

function RootStack() {
  const { colors, isDark } = useAppearance();
  const { session } = useSession();
  const { household } = useHousehold();
  const signedIn = session.status === 'signed-in';

  let content;
  if (session.status === 'loading') {
    // Reading the stored session takes a moment; a blank screen avoids flashing sign-in.
    content = <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  } else if (session.status === 'unavailable') {
    content = <SignInUnavailableScreen message={session.message} />;
  } else if (signedIn && household.status === 'missing') {
    // Every account should belong to a household; while loading or after a
    // network error the app opens and labels fall back to pet names.
    content = <NoHouseholdScreen />;
  } else {
    content = (
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {content}
    </>
  );
}
