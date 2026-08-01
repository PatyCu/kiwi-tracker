import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useAppearance } from '@/shared/theme/AppearanceProvider';

export default function TabLayout() {
  const { colors } = useAppearance();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.kiwi,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.line,
          height: 76,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', paddingBottom: 8 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: 'Pets',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'paw' : 'paw-outline'} size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={21} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={21} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
