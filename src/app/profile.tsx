import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/stores/auth-store';
import { brandColors } from '@/theme/tokens';

const ROLE_LABELS: Record<string, string> = {
  customer: 'Cliente',
  admin: 'Administrador',
};

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

function formatPhone(phone?: string | null): string {
  return phone && phone.length > 0 ? phone : 'Teléfono no registrado';
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const logout = useAuthStore((s) => s.logout);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [refreshFailed, setRefreshFailed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const refreshed = await refreshUser();
      if (active) setRefreshFailed(!refreshed);
    })();
    return () => {
      active = false;
    };
  }, [refreshUser]);

  const performLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      if (__DEV__) console.warn('[profile] logout failed', err);
      await clearSession();
    } finally {
      setLoggingOut(false);
      router.replace('/(auth)/login');
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void performLogout() },
    ]);
  };

  const appVersion = Constants.expoConfig?.version ?? '—';

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['left', 'right']}>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        <View
          testID="profile-screen"
          className="bg-brand-white rounded-brand-lg p-brand-4 mb-brand-4"
        >
          {user ? (
            <>
              <Text testID="profile-name" className="font-brand-bold text-xl text-brand-dark">
                {user.name}
              </Text>
              <Text testID="profile-email" className="font-brand text-sm text-brand-dark/70 mt-brand-1">
                {user.email}
              </Text>
              <Text testID="profile-phone" className="font-brand text-sm text-brand-dark/70 mt-brand-1">
                {formatPhone(user.phone)}
              </Text>
              <Text testID="profile-role" className="font-brand text-sm text-brand-dark/70 mt-brand-1">
                {roleLabel(user.role)}
              </Text>
            </>
          ) : (
            <Text className="font-brand text-sm text-brand-dark/70">Sesión no disponible</Text>
          )}
        </View>

        {refreshFailed ? (
          <View
            testID="profile-refresh-error"
            className="bg-brand-white rounded-brand-lg p-brand-3 mb-brand-4"
          >
            <Text className="font-brand text-sm text-brand-dark/70">
              No se pudo actualizar el perfil. Mostrando los últimos datos guardados.
            </Text>
          </View>
        ) : null}

        <Text className="font-brand-bold text-sm text-brand-dark/60 mb-brand-2">Ajustes</Text>

        <View className="bg-brand-white rounded-brand-lg mb-brand-4">
          <View className="flex-row items-center justify-between p-brand-4">
            <Text className="font-brand text-base text-brand-dark">Aplicación</Text>
            <Text testID="profile-version" className="font-brand text-sm text-brand-dark/70">
              {appVersion}
            </Text>
          </View>
        </View>

        <Text className="font-brand-bold text-sm text-brand-dark/60 mb-brand-2">Legal y ayuda</Text>

        <View className="bg-brand-white rounded-brand-lg mb-brand-4">
          <Pressable
            testID="profile-legal-terms"
            onPress={() => router.push('/legal/terms')}
            className="flex-row items-center justify-between p-brand-4 active:opacity-80"
          >
            <Text className="font-brand text-base text-brand-dark">Términos y condiciones</Text>
            <Ionicons name="chevron-forward" size={18} color={brandColors.dark} />
          </Pressable>
          <View className="h-px bg-brand-medium mx-brand-4" />
          <Pressable
            testID="profile-legal-privacy"
            onPress={() => router.push('/legal/privacy')}
            className="flex-row items-center justify-between p-brand-4 active:opacity-80"
          >
            <Text className="font-brand text-base text-brand-dark">Aviso de privacidad</Text>
            <Ionicons name="chevron-forward" size={18} color={brandColors.dark} />
          </Pressable>
          <View className="h-px bg-brand-medium mx-brand-4" />
          <Pressable
            testID="profile-legal-help"
            onPress={() => router.push('/legal/help')}
            className="flex-row items-center justify-between p-brand-4 active:opacity-80"
          >
            <Text className="font-brand text-base text-brand-dark">Ayuda</Text>
            <Ionicons name="chevron-forward" size={18} color={brandColors.dark} />
          </Pressable>
        </View>

        <Pressable
          testID="profile-logout"
          onPress={handleLogout}
          disabled={loggingOut}
          className="bg-brand-primary rounded-brand-lg px-brand-6 py-3 active:opacity-80 flex-row justify-center items-center"
        >
          {loggingOut ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-brand-bold text-white text-base">Cerrar sesión</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
