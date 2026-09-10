import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useConversationPolling } from '@/core/hooks/useConversationPolling';
import {
  CHAT_MESSAGE_MAX,
  canSendPaymentProof,
  formatAttachmentSize,
} from '@/core/models/chat.model';
import { authGuard } from '@/core/navigation/guards';
import { pickDocument, pickImageFromCamera } from '@/core/utils/media-picker';
import { isAuthenticated, useAuthStore } from '@/stores/auth-store';
import { brandColors } from '@/theme/tokens';

import type { ChatAttachment, ChatAttachmentAsset, ChatMessage } from '@/core/models/chat.model';
import type { PickedFile } from '@/core/utils/media-picker';

const PROOF_TYPE = 'proof_of_payment';

function AttachmentRow({ attachment }: { attachment: ChatAttachment }) {
  const size = formatAttachmentSize(attachment.size);
  return (
    <Pressable
      testID={`chat-attachment-${attachment.id}`}
      accessibilityRole="link"
      accessibilityLabel={attachment.originalName}
      onPress={() => void Linking.openURL(attachment.downloadUrl)}
      className="mt-brand-2 flex-row items-center rounded-brand-md bg-black/10 px-brand-3 py-brand-2 active:opacity-80"
    >
      <View className="flex-1">
        <Text
          testID={`chat-attachment-name-${attachment.id}`}
          numberOfLines={1}
          className="font-brand text-sm text-brand-dark"
        >
          {attachment.originalName}
        </Text>
        {size ? (
          <Text
            testID={`chat-attachment-size-${attachment.id}`}
            className="font-brand text-xs text-brand-dark/60"
          >
            {size}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

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
        {message.attachments.map((attachment) => (
          <AttachmentRow key={attachment.id} attachment={attachment} />
        ))}
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

  const {
    detail,
    messages,
    isLoading,
    isSending,
    fatalError,
    sendError,
    sendMessage,
    sendAttachment,
    retry,
  } = useConversationPolling(orderNumber);

  const [draft, setDraft] = useState('');
  const [asset, setAsset] = useState<ChatAttachmentAsset | null>(null);
  const [pendingProof, setPendingProof] = useState(false);

  const handleSend = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || isSending) return;
    void sendMessage(trimmed).then((ok) => {
      if (ok) setDraft('');
    });
  }, [draft, isSending, sendMessage]);

  const applyAttachment = useCallback((picked: PickedFile | null, asProof: boolean) => {
    // Cancel / denied permission is a no-op: keep the previous selection.
    if (!picked) return;
    setAsset({ uri: picked.uri, name: picked.name, type: picked.type, size: picked.size });
    setPendingProof(asProof);
  }, []);

  const pickAttachment = useCallback(
    async (asProof: boolean) => {
      applyAttachment(await pickDocument(), asProof);
    },
    [applyAttachment],
  );

  const pickAttachmentFromCamera = useCallback(
    async (asProof: boolean) => {
      applyAttachment(await pickImageFromCamera(), asProof);
    },
    [applyAttachment],
  );

  const clearAsset = useCallback(() => {
    setAsset(null);
    setPendingProof(false);
  }, []);

  const handleSendAttachment = useCallback(() => {
    if (!asset || isSending) return;
    const options = pendingProof ? { type: PROOF_TYPE } : undefined;
    void sendAttachment(asset, options).then((ok) => {
      if (ok) clearAsset();
    });
  }, [asset, isSending, pendingProof, sendAttachment, clearAsset]);

  // AC3: the manual-proof option is only offered for supplier_* orders whose
  // payment is pending/rejected. The backend remains the authority (422).
  const proofEligible = canSendPaymentProof(detail?.paymentMethod, detail?.paymentStatus);

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

        {asset ? (
          <View
            testID="chat-attachment-preview"
            className="border-t border-brand-dark/10 bg-brand-white px-brand-4 py-brand-3"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-brand-2">
                <Text
                  testID="chat-attachment-name"
                  numberOfLines={1}
                  className="font-brand text-sm text-brand-dark"
                >
                  {asset.name}
                </Text>
                {formatAttachmentSize(asset.size) ? (
                  <Text testID="chat-attachment-size" className="font-brand text-xs text-brand-dark/60">
                    {formatAttachmentSize(asset.size)}
                  </Text>
                ) : null}
                {pendingProof ? (
                  <Text testID="chat-attachment-proof-note" className="mt-1 font-brand text-xs text-brand-primary">
                    Se enviará como comprobante de pago.
                  </Text>
                ) : null}
              </View>
              <Button
                testID="chat-attachment-remove"
                label="Quitar"
                variant="ghost"
                onPress={clearAsset}
              />
            </View>
            <Button
              testID="chat-attachment-send"
              label={pendingProof ? 'Enviar comprobante de pago' : 'Enviar adjunto'}
              loading={isSending}
              onPress={handleSendAttachment}
              className="mt-brand-2"
            />
          </View>
        ) : null}

        <View className="flex-row flex-wrap items-center border-t border-brand-dark/10 bg-brand-white px-brand-3 pt-brand-2">
          <Button
            testID="chat-attach-camera"
            label="Cámara"
            variant="secondary"
            disabled={isSending}
            onPress={() => void pickAttachmentFromCamera(false)}
            className="mr-brand-2 mb-brand-1 px-3 py-2"
          />
          <Button
            testID="chat-attach"
            label="Adjuntar"
            variant="secondary"
            disabled={isSending}
            onPress={() => void pickAttachment(false)}
            className="mr-brand-2 mb-brand-1 px-3 py-2"
          />
          {proofEligible ? (
            <>
              <Button
                testID="chat-proof-camera"
                label="Foto comprobante"
                variant="secondary"
                disabled={isSending}
                onPress={() => void pickAttachmentFromCamera(true)}
                className="mr-brand-2 mb-brand-1 px-3 py-2"
              />
              <Button
                testID="chat-proof"
                label="Enviar comprobante de pago"
                variant="secondary"
                disabled={isSending}
                onPress={() => void pickAttachment(true)}
                className="mb-brand-1 px-3 py-2"
              />
            </>
          ) : null}
        </View>

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
