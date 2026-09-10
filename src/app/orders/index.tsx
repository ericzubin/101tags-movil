import { useInfiniteQuery } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { authGuard } from '@/core/navigation/guards';
import { orderKeys } from '@/core/query/keys';
import { orderService } from '@/core/services/order-service';
import { formatMXN } from '@/core/utils/format-currency';
import { isAuthenticated, useAuthStore } from '@/stores/auth-store';
import { brandColors } from '@/theme/tokens';

import type { OrderSummary } from '@/core/models/order.model';

function ListSkeleton() {
  return (
    <View className="flex-1 bg-brand-medium p-brand-4" testID="orders-skeleton">
      {[0, 1, 2].map((i) => (
        <View key={i} className="mb-brand-3 rounded-brand-lg bg-brand-white p-brand-4">
          <Skeleton width="50%" height={16} />
          <View className="mt-brand-2">
            <Skeleton width="30%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function formatOrderDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function OrderRow({ order }: { order: OrderSummary }) {
  return (
    <Pressable
      testID={`order-item-${order.orderNumber}`}
      accessibilityRole="button"
      onPress={() => router.push(`/orders/${order.orderNumber}`)}
      className="mb-brand-3 rounded-brand-lg bg-brand-white p-brand-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-brand-bold text-base text-brand-dark">{order.orderNumber}</Text>
        <Text
          testID={`order-total-${order.orderNumber}`}
          className="font-brand-bold text-base text-brand-primary"
        >
          {formatMXN(order.total)}
        </Text>
      </View>
      <View className="mt-brand-1 flex-row items-center justify-between">
        <Text testID={`order-status-${order.orderNumber}`} className="font-brand text-sm text-brand-dark/70">
          {order.status}
        </Text>
        <Text testID={`order-date-${order.orderNumber}`} className="font-brand text-sm text-brand-dark/60">
          {formatOrderDate(order.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const authed = isAuthenticated({ token, user });
  const guard = authGuard({ isAuthenticated: authed, isHydrated });

  const query = useInfiniteQuery({
    queryKey: orderKeys.list(),
    queryFn: ({ pageParam }) => orderService.getOrders(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.currentPage < lastPage.lastPage ? lastPage.currentPage + 1 : undefined,
    enabled: authed,
  });

  if (!isHydrated) return null;
  if (guard !== true) return <Redirect href={guard.redirect} />;

  if (query.isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <ListSkeleton />
      </SafeAreaView>
    );
  }

  if (query.isError && !query.data) {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <ErrorState
          testID="orders-error"
          title="No pudimos cargar tus pedidos"
          onRetry={() => query.refetch()}
        />
      </SafeAreaView>
    );
  }

  const orders = query.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      <FlatList
        testID="orders-list"
        data={orders}
        keyExtractor={(order) => order.orderNumber}
        contentContainerClassName="p-brand-4"
        refreshControl={
          <RefreshControl
            testID="orders-refresh"
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={brandColors.primary}
            colors={[brandColors.primary]}
          />
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        renderItem={({ item }) => <OrderRow order={item} />}
        ListEmptyComponent={
          <EmptyState
            testID="orders-empty"
            title="Sin pedidos"
            subtitle="Cuando realices una compra verás aquí tus pedidos."
          />
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator
              testID="orders-loading-more"
              color={brandColors.primary}
              className="py-brand-4"
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
