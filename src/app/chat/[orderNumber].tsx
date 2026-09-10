import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useConversationPolling } from '@/core/hooks/useConversationPolling';
import { CHAT_MESSAGE_MAX } from '@/core/models/chat.model';
import { authGuard } from '@/core/navigation/guards';
import { isAuthenticated, useAuthStore } from '@/stores/auth-store';
import { brandColors } from '@/theme/tokens';

import type { ChatMessage } from '@/core/models/chat.model';

function ConversationSkeleton() {
  return (
    <View className="flex-1 bg-brand-medium p-brand-4" testID="chat-skeleton">
      <View className="mb-brand-4 items-start">
        <Skeleton width="60%" height={44} />
      </View>
      <View className="mb-brand-4 items-end">
        <Skeleton width="50%" height={44} />
      </View>
      <View className="items-start">
        <Skeleton width="70%" height={44} />
      </View>
    </View>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.isMine;

  return (
    <View
      testID={mine ? `chat-message-mine-${message.id}` : `chat-message-other-${message.id}`}
      className={mine ? 'mb-brand-2 items-end' : 'mb-brand-2 items-start'}
    >
      <View
        className={
          mine
            ? 'max-w-[80%] rounded-brand-lg bg-brand-primary px-brand-4 py-brand-2'
            : 'max-w-[80%] rounded-brand-lg bg-brand-white px-brand-4 py-brand-2'
        }
      >
        {!mine ? (
          <Text className="mb-1 font-brand text-xs text-brand-dark/50">{message.senderName}</Text>
        ) : null}
        <Text
          testID={`chat-message-body-${message.id}`}
          className={mine ? 'font-brand text-base text-white' : 'font-brand text-base text-brand-dark'}
        >
          {message.body}
        </Text>
      </View>
    </View>
  );
}

export default function ConversationScreen() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const authed = isAuthenticated({ token, user });
  const guard = authGuard({ isAuthenticated: authed, isHydrated });

  const { detail, messages, isLoading, isSending, fatalError, sendError, sendMessage, retry } =
    useConversationPolling(orderNumber);

  const [draft, setDraft] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || isSending) return;
    void sendMessage(trimmed).then((ok) => {
      if (ok) setDraft('');
    });
  }, [draft, isSending, sendMessage]);

  if (!isHydrated) return null;
  if (guard !== true) return <Redirect href={guard.redirect} />;

  const header = <Stack.Screen options={{ title: orderNumber ?? 'Conversación' }} />;

  if (isLoading && !detail) {
    return (
      <>
        {header}
        <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
          <ConversationSkeleton />
        </SafeAreaView>
      </>
    );
  }

  if (fatalError && !detail) {
    return (
      <>
        {header}
        <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
          <ErrorState testID="chat-error" title={fatalError} onRetry={retry} />
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      {header}
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        {detail?.policy ? (
          <View className="border-b border-brand-dark/10 bg-brand-white px-brand-4 py-brand-2">
            <Text testID="chat-policy" className="font-brand text-xs text-brand-dark/60">
              {detail.policy}
            </Text>
          </View>
        ) : null}

        <FlatList
          testID="chat-messages"
          data={messages}
          keyExtractor={(message) => String(message.id)}
          contentContainerClassName="p-brand-4"
          renderItem={({ item }) => <MessageBubble message={item} />}
        />

        {sendError ? (
          <Text
            testID="chat-send-error"
            accessibilityRole="alert"
            className="px-brand-4 pb-brand-1 font-brand text-sm text-brand-danger"
          >
            {sendError}
          </Text>
        ) : null}

        <View className="flex-row items-end border-t border-brand-dark/10 bg-brand-white p-brand-3">
          <TextInput
            testID="chat-input"
            className="mr-brand-2 flex-1 rounded-brand-md border border-neutral-300 bg-brand-white px-3 py-2.5 text-base text-brand-dark"
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe un mensaje"
            placeholderTextColor={brandColors.dark}
            maxLength={CHAT_MESSAGE_MAX}
            multiline
          />
          <Button
            testID="chat-send"
            label="Enviar"
            disabled={!draft.trim()}
            loading={isSending}
            onPress={handleSend}
          />
        </View>
      </SafeAreaView>
    </>
  );
}
