import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native';

import { AppHeader } from '@/shared/ui/AppHeader';
import { PrimaryNavigation, PrimaryNavigationItem } from '@/shared/ui/PrimaryNavigation';
import { DESKTOP_NAV_BREAKPOINT } from '@/shared/ui/breakpoints';

const primaryRoutes = [
  { name: 'index', label: 'Today', icon: 'home-outline', activeIcon: 'home' },
  { name: 'pets', label: 'Pets', icon: 'paw-outline', activeIcon: 'paw' },
  { name: 'timeline', label: 'Timeline', icon: 'time-outline', activeIcon: 'time' },
  {
    name: 'settings',
    label: 'Settings',
    icon: 'settings-outline',
    activeIcon: 'settings',
  },
] as const satisfies readonly {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}[];

export default function TabLayout() {
  const desktop = useWindowDimensions().width >= DESKTOP_NAV_BREAKPOINT;

  return (
    <Tabs
      tabBar={({ state, navigation }) => {
        const items: PrimaryNavigationItem[] = state.routes.map((route, index) => {
          const config = primaryRoutes.find((item) => item.name === route.name);

          if (!config) {
            throw new Error(`Missing primary navigation configuration for ${route.name}`);
          }

          return {
            key: route.key,
            label: config.label,
            icon: config.icon,
            activeIcon: config.activeIcon,
            selected: state.index === index,
            onPress: () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (state.index !== index && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            },
            onLongPress: () => navigation.emit({ type: 'tabLongPress', target: route.key }),
          };
        });

        return <PrimaryNavigation items={items} variant={desktop ? 'sidebar' : 'bottom'} />;
      }}
      screenOptions={{
        header: () => <AppHeader />,
        headerShown: !desktop,
        tabBarPosition: desktop ? 'left' : 'bottom',
      }}
    >
      {primaryRoutes.map((route) => (
        <Tabs.Screen key={route.name} name={route.name} options={{ title: route.label }} />
      ))}
    </Tabs>
  );
}
