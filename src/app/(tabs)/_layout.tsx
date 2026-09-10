import { Redirect, Tabs } from 'expo-router';

import { authGuard } from '@/core/navigation/guards';
import { useAuthStore } from '@/stores/auth-store';
import { brandColors } from '@/theme/tokens';

export default function TabsLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const isAuthenticated = !!token && !!user;
  const guard = authGuard({ isAuthenticated, isHydrated });

  return (
    <>
      {guard !== true ? <Redirect href={guard.redirect} /> : null}
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
    </>
  );
}
