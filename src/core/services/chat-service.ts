import { httpClient } from '@/core/api/client';

import type {
  ConversationDetail,
  ConversationListResponse,
  SendMessageResponse,
} from '@/core/models/chat.model';

function messagesPath(orderNumber: string): string {
  return `/orders/${encodeURIComponent(orderNumber)}/messages`;
}

/**
 * Authenticated chat API. `httpClient` injects the Sanctum bearer token and
 * normalizes the controller's snake_case response to camelCase. The backend
 * scopes conversations to the authenticated user and answers 403/404 for
 * foreign/missing order numbers.
 *
 * @see .spec/2026-09-11-m5-1-chat.md §Contratos
 */
export const chatService = {
  /** `GET /conversations` → `{ data: Conversation[] }` (máx 50, por último mensaje). */
  async getConversations(): Promise<ConversationListResponse> {
    return httpClient.request<ConversationListResponse>('/conversations', { method: 'GET' });
  },

  /** `GET /orders/{orderNumber}/messages` → `ConversationDetail`. */
  async getConversation(orderNumber: string): Promise<ConversationDetail> {
    return httpClient.request<ConversationDetail>(messagesPath(orderNumber), { method: 'GET' });
  },

  /** `POST /orders/{orderNumber}/messages` `{ body ≤2000 }` → `201 { message, data }`. */
  async sendMessage(orderNumber: string, body: string): Promise<SendMessageResponse> {
    return httpClient.request<SendMessageResponse>(messagesPath(orderNumber), {
      method: 'POST',
      body: { body },
    });
  },
};
