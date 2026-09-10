import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import { loadAsync as loadFontsAsync } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';

import '@/global.css';

import { httpClient } from '@/core/api/client';
import { authService } from '@/core/services/auth-service';
import { queryClient } from '@/core/query/client';
import { useAuthStore } from '@/stores/auth-store';
import { brandColors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // M1.5 AC8 — httpClient reads the bearer token from the single source
      // of truth (Zustand), not from SecureStore directly. This eliminates
      // the dual-source divergence that caused the 401 bounce loop.
      httpClient.setAuthTokenProvider(() => useAuthStore.getState().token);
      // M1.5 AC11 — register the Zustand clearSession handler so that
      // authService.handleUnauthorized() can synchronously wipe both
      // SecureStore (its own job) and the in-memory store.
      authService.setUnauthorizedHandler(async () => {
        await useAuthStore.getState().clearSession();
      });
      // M1.5 AC1 — httpClient onUnauthorized delegates to authService
      // (which clears SecureStore + invokes the registered Zustand handler),
      // then routes to login. Single transaction from the UI's perspective.
      httpClient.setOnUnauthorized(async () => {
        await authService.handleUnauthorized();
        router.replace('/(auth)/login');
      });
      // M1.8 AC4 — bundle Montserrat Regular+Bold so brand font is real
      // on device, not system-ui fallback. Failures must NOT block the
      // app: we log and continue so the UI keeps working with fallback.
      try {
        await loadFontsAsync({
          'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
          'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
        });
      } catch (err) {
        if (__DEV__) console.warn('[font] loadAsync failed', err);
      }
      if (cancelled) return;
      setFontsLoaded(true);
      await useAuthStore.getState().hydrate();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isHydrated) SplashScreen.hideAsync().catch(() => undefined);
  }, [isHydrated]);

  if (!isHydrated || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <View
            style={{
              flex: 1,
              backgroundColor: brandColors.medium,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            testID="splash-placeholder"
          >
            <ActivityIndicator color={brandColors.primary} />
          </View>
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <View testID="root-stack" style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: brandColors.primary },
              headerTintColor: brandColors.white,
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: brandColors.medium },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="product/[slug]" />
            <Stack.Screen name="checkout/address" options={{ title: 'Dirección de envío' }} />
            <Stack.Screen name="checkout/review" options={{ title: 'Revisar pedido' }} />
            <Stack.Screen name="checkout/confirmation" options={{ title: 'Pedido confirmado' }} />
            <Stack.Screen
              name="checkout/payment-instructions"
              options={{ title: 'Instrucciones de pago' }}
            />
          </Stack>
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
