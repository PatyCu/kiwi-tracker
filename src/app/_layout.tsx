import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppearanceProvider, useAppearance } from '@/shared/theme/AppearanceProvider';
import { SessionProvider, useSession } from '@/modules/auth/state/SessionProvider';
import { SignInUnavailableScreen } from '@/modules/auth/ui/SignInUnavailableScreen';
import { HouseholdProvider, useHousehold } from '@/modules/households/state/HouseholdProvider';
import { NoHouseholdScreen } from '@/modules/households/ui/NoHouseholdScreen';
import { PetEventFormsProvider } from '@/modules/pet-events/state/PetEventFormsProvider';
import { PetEventsProvider } from '@/modules/pet-events/state/PetEventsProvider';
import { usePetsAndEventsLoad } from '@/modules/pet-events/state/usePetsAndEventsLoad';
import { PetProfileFormsProvider } from '@/modules/pets/state/PetProfileFormsProvider';
import { PetsProvider } from '@/modules/pets/state/PetsProvider';
import { LoadError, Loading } from '@/shared/ui/LoadState';

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
  const { household, retryLoad: retryHousehold } = useHousehold();
  const { retryLoad: retryPetsAndEvents } = usePetsAndEventsLoad();
  const signedIn = session.status === 'signed-in';

  let content;
  if (session.status === 'loading') {
    // Reading the stored session takes a moment; a blank screen avoids flashing sign-in.
    content = <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  } else if (session.status === 'unavailable') {
    content = <SignInUnavailableScreen message={session.message} />;
  } else if (signedIn && household.status === 'loading') {
    // Saving pets and the screen titles need the household, so wait for it.
    content = (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <Loading />
      </View>
    );
  } else if (signedIn && household.status === 'error') {
    content = (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <LoadError
          onRetry={() => {
            // Whatever failed alongside the household loads again too, so one
            // Retry is enough to open the app.
            retryHousehold();
            retryPetsAndEvents();
          }}
        />
      </View>
    );
  } else if (signedIn && household.status === 'missing') {
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

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', padding: 24 },
});
