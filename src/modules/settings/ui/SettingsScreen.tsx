import { StyleSheet, View } from 'react-native';

import { AppearanceSection } from '@/modules/appearance/ui/AppearanceSection';
import { AccountSection } from '@/modules/auth/ui/AccountSection';
import { HouseholdSection } from '@/modules/households/ui/HouseholdSection';
import { Screen } from '@/shared/ui/Screen';

export function SettingsScreen() {
  return (
    <Screen>
      <View style={styles.sections}>
        <AppearanceSection />
        <HouseholdSection />
        <AccountSection />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ sections: { gap: 32 } });
