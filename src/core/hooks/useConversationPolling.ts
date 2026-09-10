import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  chatErrorMessage,
  isValidMessageBody,
  mergeMessages,
} from '@/core/models/chat.model';
import { chatService } from '@/core/services/chat-service';

import type { ChatMessage, ConversationDetail, SentChatMessage } from '@/core/models/chat.model';

/** Poll cadence while the conversation screen is focused (AC2). */
export const CHAT_POLL_INTERVAL_MS = 8000;

const LOAD_FALLBACK = 'No pudimos cargar la conversación. Intenta de nuevo.';
const SEND_FALLBACK = 'No pudimos enviar tu mensaje. Intenta de nuevo.';

interface PollingState {
  detail: ConversationDetail | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  fatalError: string | null;
  sendError: string | null;
}

const INITIAL_STATE: PollingState = {
  detail: null,
  messages: [],
  isLoading: true,
  isSending: false,
  fatalError: null,
  sendError: null,
};

let optimisticCounter = 0;

function toConfirmedMessage(message: SentChatMessage): ChatMessage {
  return {
    id: message.id,
    body: message.body,
    senderRole: message.senderRole,
    senderName: 'Tú',
    isMine: true,
    createdAt: message.createdAt,
    type: message.type,
    metadata: message.metadata,
    attachments: [],
  };
}

export interface ConversationPollingResult {
  detail: ConversationDetail | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  /** Set only when the first load fails; transient poll errors keep last data (AC5). */
  fatalError: string | null;
  sendError: string | null;
  sendMessage: (body: string) => Promise<boolean>;
  retry: () => void;
}

/**
 * AC2–AC5: polls `GET /orders/{orderNumber}/messages` every 8s while the
 * screen is focused, cancels on blur **and** unmount (no residual timers),
 * merges messages by `id` (AC3), guards against overlapping requests, keeps
 * the last good data on transient errors (AC5) and exposes an optimistic
 * `sendMessage` (AC4).
 *
 * @see .spec/2026-09-11-m5-1-chat.md §Arquitectura
 */
export function useConversationPolling(orderNumber?: string): ConversationPollingResult {
  const [state, setState] = useState<PollingState>(INITIAL_STATE);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollInFlightRef = useRef(false);
  const sendInFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const orderNumberRef = useRef(orderNumber);

  orderNumberRef.current = orderNumber;

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const load = useCallback(async (): Promise<void> => {
    const current = orderNumberRef.current;
    if (!current || pollInFlightRef.current) return;

    pollInFlightRef.current = true;
    try {
      const detail = await chatService.getConversation(current);
      if (!mountedRef.current) return;
      setState((prev) => ({
        ...prev,
        detail,
        messages: mergeMessages(prev.messages, detail.messages),
        isLoading: false,
        fatalError: null,
      }));
    } catch (err) {
      if (!mountedRef.current) return;
      setState((prev) => {
        // AC5: keep the last good conversation; only surface a fatal error
        // before the first successful load (avoid error spam on each tick).
        if (prev.detail) return { ...prev, isLoading: false };
        return { ...prev, isLoading: false, fatalError: chatErrorMessage(err, LOAD_FALLBACK) };
      });
    } finally {
      pollInFlightRef.current = false;
    }
  }, []);

  const stopPolling = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const startPolling = useCallback(() => {
    if (!orderNumberRef.current) return;
    clearTimer();
    void load();
    intervalRef.current = setInterval(() => {
      void load();
    }, CHAT_POLL_INTERVAL_MS);
  }, [clearTimer, load]);

  useFocusEffect(
    useCallback(() => {
      startPolling();
      return () => stopPolling();
    }, [startPolling, stopPolling]),
  );

  // `useFocusEffect` cleanup only runs on blur, not on unmount. This second
  // cleanup guarantees no interval survives the screen unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  const sendMessage = useCallback(async (body: string): Promise<boolean> => {
    const current = orderNumberRef.current;
    if (!current || !isValidMessageBody(body) || sendInFlightRef.current) return false;

    sendInFlightRef.current = true;
    const trimmed = body.trim();
    optimisticCounter += 1;
    const optimisticId = -1000000 - optimisticCounter;
    const optimistic: ChatMessage = {
      id: optimisticId,
      body: trimmed,
      senderRole: 'customer',
      senderName: 'Tú',
      isMine: true,
      createdAt: new Date().toISOString(),
      type: 'text',
      metadata: null,
      attachments: [],
      pending: true,
    };

    setState((prev) => ({
      ...prev,
      isSending: true,
      sendError: null,
      messages: mergeMessages(prev.messages, [optimistic]),
    }));

    try {
      const response = await chatService.sendMessage(current, trimmed);
      if (!mountedRef.current) return true;
      const confirmed = toConfirmedMessage(response.data);
      setState((prev) => ({
        ...prev,
        isSending: false,
        messages: mergeMessages(
          prev.messages.filter((m) => m.id !== optimisticId),
          [confirmed],
        ),
      }));
      return true;
    } catch (err) {
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          isSending: false,
          messages: prev.messages.filter((m) => m.id !== optimisticId),
          sendError: chatErrorMessage(err, SEND_FALLBACK),
        }));
      }
      return false;
    } finally {
      sendInFlightRef.current = false;
    }
  }, []);

  return {
    detail: state.detail,
    messages: state.messages,
    isLoading: state.isLoading,
    isSending: state.isSending,
    fatalError: state.fatalError,
    sendError: state.sendError,
    sendMessage,
    retry: load,
  };
}
