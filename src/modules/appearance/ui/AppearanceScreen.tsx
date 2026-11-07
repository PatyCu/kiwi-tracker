import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Appearance } from '@/shared/theme/Appearance';
import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';
import { Screen } from '@/shared/ui/Screen';

const options: Appearance[] = ['system', 'light', 'dark'];

export function AppearanceScreen() {
  const { appearance, colors, setAppearance } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Screen>
      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.card}>
        {options.map((option, index) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: appearance === option }}
            onPress={() => setAppearance(option)}
            style={[styles.option, index > 0 && styles.divider]}
          >
            <Text style={styles.optionText}>{option[0].toUpperCase() + option.slice(1)}</Text>
            <View style={[styles.radio, appearance === option && styles.radioSelected]} />
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 12 },
    card: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 20,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    option: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 18,
    },
    divider: { borderTopWidth: 1, borderTopColor: colors.line },
    optionText: { color: colors.text, fontSize: 15, fontWeight: '600' },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.muted },
    radioSelected: { borderWidth: 6, borderColor: colors.kiwi },
  });
