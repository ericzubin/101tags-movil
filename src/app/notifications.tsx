import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { authGuard } from '@/core/navigation/guards';
import { resolveNotificationLink } from '@/core/utils/notification-link';
import { isAuthenticated, useAuthStore } from '@/stores/auth-store';
import { useNotificationStore } from '@/stores/notification-store';
import { brandColors } from '@/theme/tokens';

import type { AppNotification } from '@/core/models/notification.model';

function formatNotificationDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function ListSkeleton() {
  return (
    <View className="flex-1 bg-brand-medium p-brand-4" testID="notifications-skeleton">
      {[0, 1, 2].map((i) => (
        <View key={i} className="mb-brand-3 rounded-brand-lg bg-brand-white p-brand-4">
          <Skeleton width="55%" height={16} />
          <View className="mt-brand-2">
            <Skeleton width="80%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

function NotificationRow({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
}) {
  const unread = !notification.read;
  return (
    <Pressable
      testID={`notification-item-${notification.id}`}
      accessibilityRole="button"
      onPress={() => onPress(notification)}
      className={`mb-brand-3 rounded-brand-lg p-brand-4 active:opacity-80 ${
        unread ? 'bg-brand-white' : 'bg-brand-white/60'
      }`}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 flex-row items-center">
          {unread ? (
            <View
              testID={`notification-unread-${notification.id}`}
              className="mr-brand-2 h-2 w-2 rounded-full bg-brand-primary"
            />
          ) : null}
          <Text
            className={`flex-1 font-brand-bold text-base ${
              unread ? 'text-brand-dark' : 'text-brand-dark/70'
            }`}
          >
            {notification.title}
          </Text>
        </View>
        <Text className="ml-brand-2 font-brand text-xs text-brand-dark/50">
          {formatNotificationDate(notification.createdAt)}
        </Text>
      </View>
      {notification.body ? (
        <Text className="mt-brand-1 font-brand text-sm text-brand-dark/70">{notification.body}</Text>
      ) : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const status = useNotificationStore((s) => s.status);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const authed = isAuthenticated({ token, user });
  const guard = authGuard({ isAuthenticated: authed, isHydrated });

  useEffect(() => {
    if (authed && isHydrated) void fetchNotifications();
  }, [authed, isHydrated, fetchNotifications]);

  const handlePress = (notification: AppNotification) => {
    void markRead(notification.id);
    const href = resolveNotificationLink(notification.link);
    if (href) router.push(href);
  };

  if (!isHydrated) return null;
  if (guard !== true) return <Redirect href={guard.redirect} />;

  if (status === 'loading' && notifications.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <ListSkeleton />
      </SafeAreaView>
    );
  }

  if (status === 'error' && notifications.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <ErrorState
          testID="notifications-error"
          title="No pudimos cargar tus notificaciones"
          onRetry={() => void fetchNotifications()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center justify-between px-brand-4 pb-brand-2 pt-brand-3">
        <Text className="font-brand-bold text-lg text-brand-dark">
          {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo leído'}
        </Text>
        <Pressable
          testID="notifications-mark-all"
          accessibilityRole="button"
          disabled={unreadCount === 0}
          onPress={() => void markAllRead()}
          className={`flex-row items-center rounded-brand-md px-brand-3 py-brand-2 active:opacity-80 ${
            unreadCount === 0 ? 'opacity-40' : 'bg-brand-primary'
          }`}
        >
          <Ionicons name="checkmark-done-outline" size={16} color="white" />
          <Text className="ml-brand-1 font-brand-bold text-sm text-white">Marcar todas</Text>
        </Pressable>
      </View>
      <FlatList
        testID="notifications-list"
        data={notifications}
        keyExtractor={(notification) => String(notification.id)}
        contentContainerClassName="p-brand-4"
        refreshControl={
          <RefreshControl
            testID="notifications-refresh"
            refreshing={status === 'loading' && notifications.length > 0}
            onRefresh={() => void fetchNotifications()}
            tintColor={brandColors.primary}
            colors={[brandColors.primary]}
          />
        }
        renderItem={({ item }) => <NotificationRow notification={item} onPress={handlePress} />}
        ListEmptyComponent={
          <EmptyState
            testID="notifications-empty"
            title="Sin notificaciones"
            subtitle="Cuando tengas avisos de tus pedidos aparecerán aquí."
          />
        }
      />
    </SafeAreaView>
  );
}
