import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { guestGuard } from '@/core/navigation/guards';
import { useAuthStore } from '@/stores/auth-store';
import { brandColors } from '@/theme/tokens';

export default function AuthLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const isAuthenticated = !!token && !!user;
  const guard = guestGuard({ isAuthenticated, isHydrated });

  return (
    <>
      <StatusBar style="light" />
      {guard !== true ? <Redirect href={guard.redirect} /> : null}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: brandColors.primary },
          headerTintColor: brandColors.white,
          contentStyle: { backgroundColor: brandColors.medium },
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </>
  );
}
