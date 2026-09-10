import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/core/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationStore } from '@/stores/notification-store';
import { brandColors } from '@/theme/tokens';

export default function AccountTab() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.logout();
      await clearSession();
      router.replace('/(auth)/login');
    } catch (err) {
      if (__DEV__) console.warn('[account] logout failed', err);
      await clearSession();
      router.replace('/(auth)/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      <View className="flex-1 p-brand-6">
        <Text className="font-brand-bold text-2xl text-brand-dark mb-brand-4">Mi cuenta</Text>
        {user ? (
          <View className="bg-brand-white rounded-brand-lg p-brand-4 mb-brand-6">
            <Text className="font-brand-bold text-base text-brand-dark">{user.name}</Text>
            <Text className="font-brand text-sm text-brand-dark/70">{user.email}</Text>
          </View>
        ) : null}
        <Pressable
          onPress={() => router.push('/profile')}
          className="flex-row items-center justify-between rounded-brand-lg bg-brand-white p-brand-4 mb-brand-4 active:opacity-80"
          testID="account-profile"
        >
          <View className="flex-row items-center">
            <Ionicons name="person-outline" size={20} color={brandColors.dark} />
            <Text className="font-brand-bold text-base text-brand-dark ml-brand-3">Mi perfil</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={brandColors.dark} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/orders')}
          className="flex-row items-center justify-between rounded-brand-lg bg-brand-white p-brand-4 mb-brand-4 active:opacity-80"
          testID="account-orders"
        >
          <View className="flex-row items-center">
            <Ionicons name="receipt-outline" size={20} color={brandColors.dark} />
            <Text className="font-brand-bold text-base text-brand-dark ml-brand-3">
              Mis pedidos
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={brandColors.dark} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/returns')}
          className="flex-row items-center justify-between rounded-brand-lg bg-brand-white p-brand-4 mb-brand-4 active:opacity-80"
          testID="account-returns"
        >
          <View className="flex-row items-center">
            <Ionicons name="swap-horizontal-outline" size={20} color={brandColors.dark} />
            <Text className="font-brand-bold text-base text-brand-dark ml-brand-3">
              Mis devoluciones
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={brandColors.dark} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/chat')}
          className="flex-row items-center justify-between rounded-brand-lg bg-brand-white p-brand-4 mb-brand-4 active:opacity-80"
          testID="account-chat"
        >
          <View className="flex-row items-center">
            <Ionicons name="chatbubbles-outline" size={20} color={brandColors.dark} />
            <Text className="font-brand-bold text-base text-brand-dark ml-brand-3">Mensajes</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={brandColors.dark} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/coupons')}
          className="flex-row items-center justify-between rounded-brand-lg bg-brand-white p-brand-4 mb-brand-4 active:opacity-80"
          testID="account-coupons"
        >
          <View className="flex-row items-center">
            <Ionicons name="pricetags-outline" size={20} color={brandColors.dark} />
            <Text className="font-brand-bold text-base text-brand-dark ml-brand-3">
              Mis cupones
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={brandColors.dark} />
        </Pressable>
        <Pressable
          onPress={() => router.push('/notifications')}
          className="flex-row items-center justify-between rounded-brand-lg bg-brand-white p-brand-4 mb-brand-4 active:opacity-80"
          testID="account-notifications"
        >
          <View className="flex-row items-center">
            <Ionicons name="notifications-outline" size={20} color={brandColors.dark} />
            <Text className="font-brand-bold text-base text-brand-dark ml-brand-3">
              Notificaciones
            </Text>
          </View>
          <View className="flex-row items-center">
            {unreadCount > 0 ? (
              <View
                testID="account-notifications-badge"
                className="bg-brand-primary rounded-full min-w-6 h-6 px-brand-2 items-center justify-center mr-brand-2"
              >
                <Text className="font-brand-bold text-xs text-white">{unreadCount}</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color={brandColors.dark} />
          </View>
        </Pressable>
        <Pressable
          onPress={handleLogout}
          disabled={loggingOut}
          className="bg-brand-primary rounded-brand-lg px-brand-6 py-3 active:opacity-80 mt-auto flex-row justify-center items-center"
          testID="account-logout"
        >
          {loggingOut ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-brand-bold text-white text-base">Cerrar sesión</Text>
          )}
        </Pressable>
        <Text className="font-brand text-xs text-brand-dark/50 text-center mt-brand-4">
          Próximamente — ayuda y configuración avanzada
        </Text>
      </View>
    </SafeAreaView>
  );
}
