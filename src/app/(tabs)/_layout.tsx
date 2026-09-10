import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { authGuard } from '@/core/navigation/guards';
import { isAuthenticated, useAuthStore } from '@/stores/auth-store';
import { brandColors } from '@/theme/tokens';

export default function TabsLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const authed = isAuthenticated({ token, user });
  const guard = authGuard({ isAuthenticated: authed, isHydrated });

  if (!isHydrated) return null;
  if (guard !== true) {
    return <Redirect href={guard.redirect} />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: brandColors.primary,
        tabBarInactiveTintColor: brandColors.dark,
        tabBarStyle: { backgroundColor: brandColors.medium },
        headerStyle: { backgroundColor: brandColors.primary },
        headerTintColor: brandColors.white,
        headerTitleStyle: { fontFamily: 'Montserrat-Bold', fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Carrito',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Cuenta',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
