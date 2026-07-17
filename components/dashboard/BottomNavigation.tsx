import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/lib/theme';

export type DashboardTab = 'Today' | 'Timeline' | 'Care' | 'Pet';

type BottomNavigationProps = {
  activeTab: DashboardTab;
  colors: Palette;
  onSelect: (tab: DashboardTab) => void;
};

const tabs: { label: DashboardTab; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Today', icon: 'home' },
  { label: 'Timeline', icon: 'time' },
  { label: 'Care', icon: 'calendar' },
  { label: 'Pet', icon: 'paw' },
];

export function BottomNavigation({ activeTab, colors, onSelect }: BottomNavigationProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {tabs.map(({ label, icon }) => {
        const active = label === activeTab;
        const iconName = active ? icon : (`${icon}-outline` as keyof typeof Ionicons.glyphMap);
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={label}
            onPress={() => onSelect(label)}
            style={styles.tab}
          >
            <Ionicons name={iconName} size={21} color={active ? colors.kiwi : colors.muted} />
            <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 76,
      backgroundColor: colors.tabBar,
      borderTopWidth: 1,
      borderColor: colors.line,
      flexDirection: 'row',
      paddingTop: 10,
    },
    tab: { flex: 1, alignItems: 'center', gap: 4 },
    label: { fontSize: 10, color: colors.muted, fontWeight: '600' },
    activeLabel: { color: colors.kiwi },
  });
