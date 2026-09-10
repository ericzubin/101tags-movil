import type { ISODateString } from './common.model';

/**
 * Chat contracts — mirror of the authenticated Laravel endpoint:
 *   GET  /api/conversations                 → { data: Conversation[] }
 *   GET  /api/orders/{orderNumber}/messages → ConversationDetail
 *   POST /api/orders/{orderNumber}/messages → 201 { message, data }
 *
 * `httpClient` applies `toCamel`, so the controller's snake_case keys
 * (`order_number`, `sender_role`, `is_mine`, `created_at`, …) arrive here as
 * camelCase. Every route is behind `auth:sanctum` and the server scopes the
 * conversation to the authenticated user.
 *
 * @see .spec/2026-09-11-m5-1-chat.md §Contratos
 * @see 101tags.com- app/Services/OrderConversationService.php
 */

/** Backend validates `body` as `required|string|min:1|max:2000`. */
export const CHAT_MESSAGE_MAX = 2000;

/** Attachment as exposed inside a message (M5.2 adds upload). */
export interface ChatAttachment {
  readonly id: number;
  readonly originalName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly downloadUrl: string;
}

/** `OrderConversationService::getConversation` message entry after `toCamel`. */
export interface ChatMessage {
  readonly id: number;
  readonly body: string;
  readonly senderRole: string;
  readonly senderName: string;
  readonly isMine: boolean;
  readonly createdAt: ISODateString;
  readonly type: string;
  readonly metadata: Record<string, unknown> | null;
  readonly attachments: ChatAttachment[];
  /** Client-only flag for an optimistic message awaiting server confirmation. */
  readonly pending?: boolean;
}

/** `listForUser` `last_message` block. */
export interface ConversationLastMessage {
  readonly body: string;
  readonly senderRole: string;
  readonly createdAt: ISODateString;
  readonly isMine: boolean;
}

/** `GET /conversations` list item (máx 50, orden por último mensaje). */
export interface Conversation {
  readonly orderNumber: string;
  readonly orderStatus: string;
  readonly orderTotal: number;
  readonly orderCreatedAt: ISODateString;
  readonly lastMessage: ConversationLastMessage | null;
}

export interface ConversationListResponse {
  readonly data: Conversation[];
}

/** `GET /orders/{orderNumber}/messages` full payload. */
export interface ConversationDetail {
  readonly orderNumber: string;
  readonly orderId: number;
  readonly status: string;
  readonly orderStatus: string;
  readonly paymentStatus: string;
  readonly paymentMethod: string | null;
  readonly viewerRole: string;
  readonly canConfirmPayment: boolean;
  readonly canRejectPayment: boolean;
  readonly policy: string;
  readonly messages: ChatMessage[];
}

/** `OrderMessageController::store` 201 `data` block. */
export interface SentChatMessage {
  readonly id: number;
  readonly body: string;
  readonly senderRole: string;
  readonly type: string;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: ISODateString;
}

export interface SendMessageResponse {
  readonly message: string;
  readonly data: SentChatMessage;
}

/**
 * Client-side UX guard (AC4). The backend remains the authority
 * (`body` required, min:1, max:2000). Whitespace-only is rejected.
 */
export function isValidMessageBody(body: string): boolean {
  const trimmed = body.trim();
  return trimmed.length >= 1 && trimmed.length <= CHAT_MESSAGE_MAX;
}

function messageTime(message: ChatMessage): number {
  const parsed = Date.parse(message.createdAt);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

/**
 * AC3: merges server/optimistic messages by `id` (last write wins, so a
 * server-confirmed message replaces the local copy) and returns them ordered
 * by `createdAt` ascending, breaking ties by `id`. Duplicated polls are a
 * no-op.
 */
export function mergeMessages(
  existing: readonly ChatMessage[],
  incoming: readonly ChatMessage[],
): ChatMessage[] {
  const byId = new Map<number, ChatMessage>();
  for (const message of existing) byId.set(message.id, message);
  for (const message of incoming) byId.set(message.id, message);

  return Array.from(byId.values()).sort((a, b) => {
    const timeDiff = messageTime(a) - messageTime(b);
    return timeDiff !== 0 ? timeDiff : a.id - b.id;
  });
}

/**
 * Extracts the human message the backend sends in the error body
 * (`HttpError.body.message`) and falls back to `Error.message` / `fallback`.
 * Duck-typed to keep this model free of an api-client import.
 */
export function chatErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'body' in err) {
    const body = (err as { body?: unknown }).body;
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message;
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
