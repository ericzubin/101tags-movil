import { Redirect } from 'expo-router';

import { isAuthenticated, useAuthStore } from '@/stores/auth-store';

export default function Index() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isAuth = isAuthenticated({ token, user });

  if (!isHydrated) {
    return null;
  }
  if (isAuth) {
    return <Redirect href="/(tabs)" />;
  }
  return <Redirect href="/(auth)/login" />;
}
