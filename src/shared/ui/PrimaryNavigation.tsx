import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppearance } from '@/shared/theme/AppearanceProvider';
import { Palette } from '@/shared/theme/palette';
import { AppIdentity } from '@/shared/ui/AppIdentity';

export type PrimaryNavigationItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
};

type PrimaryNavigationProps = {
  items: PrimaryNavigationItem[];
  variant: 'bottom' | 'sidebar';
};

export function PrimaryNavigation({ items, variant }: PrimaryNavigationProps) {
  const { colors } = useAppearance();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sidebar = variant === 'sidebar';

  return (
    <SafeAreaView
      accessibilityLabel="Primary navigation"
      edges={sidebar ? ['top', 'bottom', 'left'] : ['bottom', 'left', 'right']}
      style={sidebar ? styles.sidebar : styles.bottomBar}
    >
      {sidebar && (
        <View style={styles.sidebarIdentity}>
          <AppIdentity />
        </View>
      )}
      <View style={sidebar ? styles.sidebarItems : styles.bottomItems}>
        {items.map((item) => (
          <NavigationItem key={item.key} item={item} sidebar={sidebar} styles={styles} />
        ))}
      </View>
    </SafeAreaView>
  );
}

type NavigationItemProps = {
  item: PrimaryNavigationItem;
  sidebar: boolean;
  styles: ReturnType<typeof makeStyles>;
};

function NavigationItem({ item, sidebar, styles }: NavigationItemProps) {
  const { colors } = useAppearance();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const emphasized = sidebar && (item.selected || hovered || focused);

  return (
    <Pressable
      accessibilityLabel={item.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: item.selected }}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onLongPress={item.onLongPress}
      onPress={item.onPress}
      style={({ pressed }) => [
        sidebar ? styles.sidebarItem : styles.bottomItem,
        emphasized && styles.sidebarItemEmphasized,
        focused && styles.focusedItem,
        pressed && styles.pressedItem,
      ]}
    >
      <Ionicons
        name={item.selected ? item.activeIcon : item.icon}
        size={sidebar ? 22 : 21}
        color={item.selected ? colors.kiwi : colors.muted}
      />
      <Text
        style={[
          sidebar ? styles.sidebarLabel : styles.bottomLabel,
          item.selected && styles.selectedLabel,
        ]}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    sidebar: {
      width: 248,
      backgroundColor: colors.tabBar,
      borderRightWidth: 1,
      borderRightColor: colors.line,
    },
    sidebarIdentity: { paddingHorizontal: 24, paddingTop: 22, paddingBottom: 26 },
    sidebarItems: { gap: 6, paddingHorizontal: 12 },
    sidebarItem: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 14,
      borderRadius: 14,
    },
    sidebarItemEmphasized: { backgroundColor: colors.surface2 },
    sidebarLabel: { color: colors.muted, fontSize: 15, fontWeight: '600' },
    bottomBar: {
      minHeight: 76,
      paddingTop: 8,
      backgroundColor: colors.tabBar,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    bottomItems: { minHeight: 68, flexDirection: 'row', alignItems: 'stretch' },
    bottomItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
    bottomLabel: { color: colors.muted, fontSize: 10, fontWeight: '600', paddingBottom: 4 },
    selectedLabel: { color: colors.kiwi },
    focusedItem: { borderWidth: 2, borderColor: colors.kiwi },
    pressedItem: { opacity: 0.7 },
  });
