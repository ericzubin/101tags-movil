import { useQuery } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { authGuard } from '@/core/navigation/guards';
import { chatKeys } from '@/core/query/keys';
import { chatService } from '@/core/services/chat-service';
import { isAuthenticated, useAuthStore } from '@/stores/auth-store';
import { brandColors } from '@/theme/tokens';

import type { Conversation } from '@/core/models/chat.model';

function formatChatDate(value: string): string {
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
    <View className="flex-1 bg-brand-medium p-brand-4" testID="chat-skeleton">
      {[0, 1, 2].map((i) => (
        <View key={i} className="mb-brand-3 rounded-brand-lg bg-brand-white p-brand-4">
          <Skeleton width="45%" height={16} />
          <View className="mt-brand-2">
            <Skeleton width="70%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  return (
    <Pressable
      testID={`conversation-item-${conversation.orderNumber}`}
      accessibilityRole="button"
      onPress={() => router.push(`/chat/${conversation.orderNumber}`)}
      className="mb-brand-3 rounded-brand-lg bg-brand-white p-brand-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-brand-bold text-base text-brand-dark">
          {conversation.orderNumber}
        </Text>
        <Text className="font-brand text-sm text-brand-dark/70">{conversation.orderStatus}</Text>
      </View>
      <View className="mt-brand-1 flex-row items-center justify-between">
        <Text
          testID={`conversation-last-${conversation.orderNumber}`}
          numberOfLines={1}
          className="mr-brand-2 flex-1 font-brand text-sm text-brand-dark/70"
        >
          {conversation.lastMessage?.body ?? 'Sin mensajes'}
        </Text>
        <Text className="font-brand text-xs text-brand-dark/50">
          {conversation.lastMessage ? formatChatDate(conversation.lastMessage.createdAt) : ''}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ChatListScreen() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const authed = isAuthenticated({ token, user });
  const guard = authGuard({ isAuthenticated: authed, isHydrated });

  const query = useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: () => chatService.getConversations(),
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
          testID="chat-error"
          title="No pudimos cargar tus conversaciones"
          onRetry={() => query.refetch()}
        />
      </SafeAreaView>
    );
  }

  const conversations = query.data?.data ?? [];

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
      <FlatList
        testID="chat-list"
        data={conversations}
        keyExtractor={(conversation) => conversation.orderNumber}
        contentContainerClassName="p-brand-4"
        refreshControl={
          <RefreshControl
            testID="chat-refresh"
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={brandColors.primary}
            colors={[brandColors.primary]}
          />
        }
        renderItem={({ item }) => <ConversationRow conversation={item} />}
        ListEmptyComponent={
          <EmptyState
            testID="chat-empty"
            title="Sin conversaciones"
            subtitle="Cuando escribas sobre un pedido, la conversación aparecerá aquí."
          />
        }
      />
    </SafeAreaView>
  );
}
