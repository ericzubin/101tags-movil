import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { brandColors } from '@/theme/tokens';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="light" />
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
