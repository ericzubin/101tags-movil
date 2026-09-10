import { httpClient } from '@/core/api/client';

import type {
  ChatAttachmentAsset,
  ConversationDetail,
  ConversationListResponse,
  SendAttachmentResponse,
  SendMessageResponse,
} from '@/core/models/chat.model';

function messagesPath(orderNumber: string): string {
  return `/orders/${encodeURIComponent(orderNumber)}/messages`;
}

export interface SendAttachmentOptions {
  /** `proof_of_payment` triggers the backend payment-status update (AC6). */
  readonly type?: string;
  readonly body?: string;
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

  /**
   * `POST /orders/{orderNumber}/messages/attachments` → `201 { message, data }`.
   *
   * The backend expects `multipart/form-data`, so we build a `FormData` with
   * `attachment` (+ optional `type`/`body`) and let the runtime set the
   * multipart boundary (no manual `Content-Type`, no `JSON.stringify`).
   *
   * @see 101tags.com- OrderMessageController::storeAttachment
   */
  async sendAttachment(
    orderNumber: string,
    asset: ChatAttachmentAsset,
    options: SendAttachmentOptions = {},
  ): Promise<SendAttachmentResponse> {
    const formData = new FormData();
    formData.append('attachment', {
      uri: asset.uri,
      name: asset.name,
      type: asset.type || 'application/octet-stream',
    } as unknown as Blob);
    if (options.type) formData.append('type', options.type);
    if (options.body) formData.append('body', options.body);

    return httpClient.request<SendAttachmentResponse>(`${messagesPath(orderNumber)}/attachments`, {
      method: 'POST',
      body: formData,
    });
  },
};
