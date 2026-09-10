import { Tabs } from 'expo-router';

import { brandColors } from '@/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: brandColors.primary,
        tabBarInactiveTintColor: brandColors.dark,
        tabBarStyle: { backgroundColor: brandColors.medium },
        headerStyle: { backgroundColor: brandColors.primary },
        headerTintColor: brandColors.white,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
    </Tabs>
  );
}
