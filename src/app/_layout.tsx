import { QueryClientProvider } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/global.css';

import { httpClient } from '@/core/api/client';
import { authService } from '@/core/services/auth-service';
import { queryClient } from '@/core/query/client';
import { useAuthStore } from '@/stores/auth-store';
import { brandColors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    httpClient.setAuthTokenProvider(() => authService.getStoredToken());
    httpClient.setOnUnauthorized(async () => {
      await authService.handleUnauthorized();
      router.replace('/(auth)/login');
    });
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated) SplashScreen.hideAsync().catch(() => undefined);
  }, [isHydrated]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: brandColors.primary },
            headerTintColor: brandColors.white,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: brandColors.medium },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
