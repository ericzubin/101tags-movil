import { useInfiniteQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { authGuard } from '@/core/navigation/guards';
import { orderKeys } from '@/core/query/keys';
import { orderService } from '@/core/services/order-service';
import { returnStatusLabel, returnTypeLabel } from '@/core/models/order.model';
import { isAuthenticated, useAuthStore } from '@/stores/auth-store';
import { brandColors } from '@/theme/tokens';

import type { ReturnRequest } from '@/core/models/order.model';

function ListSkeleton() {
  return (
    <View className="flex-1 bg-brand-medium p-brand-4" testID="returns-skeleton">
      {[0, 1, 2].map((i) => (
        <View key={i} className="mb-brand-3 rounded-brand-lg bg-brand-white p-brand-4">
          <Skeleton width="40%" height={16} />
          <View className="mt-brand-2">
            <Skeleton width="60%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

function ReturnRow({ request }: { request: ReturnRequest }) {
  return (
    <View
      testID={`return-item-${request.folio}`}
      className="mb-brand-3 rounded-brand-lg bg-brand-white p-brand-4"
    >
      <View className="flex-row items-center justify-between">
        <Text
          testID={`return-folio-${request.folio}`}
          className="font-brand-bold text-base text-brand-dark"
        >
          {request.folio}
        </Text>
        <Text
          testID={`return-status-${request.folio}`}
          className="font-brand text-sm text-brand-dark/70"
        >
          {returnStatusLabel(request.status)}
        </Text>
      </View>
      <View className="mt-brand-1 flex-row items-center justify-between">
        <Text
          testID={`return-type-${request.folio}`}
          className="font-brand text-sm text-brand-dark/70"
        >
          {returnTypeLabel(request.type)}
        </Text>
        {request.orderNumber ? (
          <Text className="font-brand text-sm text-brand-dark/60">{request.orderNumber}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function ReturnsScreen() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const authed = isAuthenticated({ token, user });
  const guard = authGuard({ isAuthenticated: authed, isHydrated });

  const query = useInfiniteQuery({
    queryKey: orderKeys.returns(),
    queryFn: ({ pageParam }) => orderService.getReturnRequests(pageParam),
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
          testID="returns-error"
          title="No pudimos cargar tus devoluciones"
          onRetry={() => query.refetch()}
        />
      </SafeAreaView>
    );
  }

  const requests = query.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      <FlatList
        testID="returns-list"
        data={requests}
        keyExtractor={(item) => item.folio}
        contentContainerClassName="p-brand-4"
        refreshControl={
          <RefreshControl
            testID="returns-refresh"
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
        renderItem={({ item }) => <ReturnRow request={item} />}
        ListEmptyComponent={
          <EmptyState
            testID="returns-empty"
            title="Sin devoluciones"
            subtitle="Aquí verás tus solicitudes de cancelación y devolución."
          />
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator
              testID="returns-loading-more"
              color={brandColors.primary}
              className="py-brand-4"
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
