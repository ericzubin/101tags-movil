import { Redirect } from 'expo-router';

import { useAuthStore } from '@/stores/auth-store';

export default function Index() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuth = useAuthStore((s) => s.token !== null);

  if (!isHydrated) {
    return null;
  }
  if (isAuth) {
    return <Redirect href="/(tabs)" />;
  }
  return <Redirect href="/(auth)/login" />;
}
