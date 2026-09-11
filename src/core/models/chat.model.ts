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

/** Backend validates the file with `max:8192` (KB) → 8 MiB. */
export const CHAT_ATTACHMENT_MAX_BYTES = 8 * 1024 * 1024;

/** Backend `mimes:jpg,jpeg,png,webp,pdf` — primary MIME signal. */
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

/** Same rule by extension, for pickers that omit the MIME type. */
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf']);

export const CHAT_ATTACHMENT_TYPE_ERROR = 'Formato no permitido. Usa JPG, PNG, WEBP o PDF.';
export const CHAT_ATTACHMENT_SIZE_ERROR = 'El archivo supera el máximo de 8 MB.';

/** A locally-picked file ready to upload as multipart form data. */
export interface ChatAttachmentAsset {
  readonly uri: string;
  readonly name: string;
  readonly type?: string | null;
  readonly size?: number | null;
}

function attachmentExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/** AC2: client UX guard — backend remains authority (`mimes` + `max:8192`). */
export function isAllowedAttachment(asset: ChatAttachmentAsset): boolean {
  const mime = (asset.type ?? '').trim().toLowerCase();
  // A present-but-invalid MIME must win over a coincidentally valid extension
  // (`nota.pdf` + `text/plain`); the extension is the fallback only when the
  // picker omits the MIME entirely.
  if (mime) return ALLOWED_ATTACHMENT_MIME_TYPES.has(mime);
  return ALLOWED_ATTACHMENT_EXTENSIONS.has(attachmentExtension(asset.name));
}

/** AC2: >8 MiB is rejected; unknown size is deferred to the backend. */
export function isAllowedAttachmentSize(size: number | null | undefined): boolean {
  if (typeof size !== 'number' || Number.isNaN(size)) return true;
  return size <= CHAT_ATTACHMENT_MAX_BYTES;
}

/** AC2: inline error message, or `null` when the asset passes client validation. */
export function validateChatAttachment(asset: ChatAttachmentAsset): string | null {
  if (!isAllowedAttachment(asset)) return CHAT_ATTACHMENT_TYPE_ERROR;
  if (!isAllowedAttachmentSize(asset.size)) return CHAT_ATTACHMENT_SIZE_ERROR;
  return null;
}

/** Human size for the upload preview / attachment row (AC4). */
export function formatAttachmentSize(bytes: number | null | undefined): string | null {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return null;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

/** AC3: the manual-proof option is offered only while payment is pending/rejected. */
export const PAYMENT_PROOF_PENDING_STATUSES = ['pending', 'rejected'] as const;

export function canSendPaymentProof(
  paymentMethod: string | null | undefined,
  paymentStatus: string | null | undefined,
): boolean {
  if (!paymentMethod || !paymentMethod.startsWith('supplier_')) return false;
  return (PAYMENT_PROOF_PENDING_STATUSES as readonly string[]).includes(paymentStatus ?? '');
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
 * `OrderMessageController::storeAttachment` 201 `data` block.
 *
 * Unlike `store`, the backend omits `sender_role` and `metadata` here and
 * returns the created `attachment` inline. The client fills `senderRole` /
 * `isMine` locally when building the optimistic-confirmed message.
 */
export interface SentAttachmentMessage {
  readonly id: number;
  readonly type: string;
  readonly body: string;
  readonly attachment: ChatAttachment;
  readonly createdAt: ISODateString;
}

/** `POST /orders/{orderNumber}/messages/attachments` 201 `{ message, data }`. */
export interface SendAttachmentResponse {
  readonly message: string;
  readonly data: SentAttachmentMessage;
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
