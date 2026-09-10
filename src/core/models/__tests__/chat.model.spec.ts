import {
  CHAT_ATTACHMENT_MAX_BYTES,
  CHAT_MESSAGE_MAX,
  canSendPaymentProof,
  chatErrorMessage,
  formatAttachmentSize,
  isAllowedAttachment,
  isAllowedAttachmentSize,
  isValidMessageBody,
  mergeMessages,
  validateChatAttachment,
  type ChatAttachmentAsset,
  type ChatMessage,
  type Conversation,
  type ConversationDetail,
  type SendAttachmentResponse,
} from '@/core/models/chat.model';
import { toCamel } from '@/core/utils/snake-camel';

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 1,
    body: 'Hola',
    senderRole: 'customer',
    senderName: 'Cliente',
    isMine: true,
    createdAt: '2026-09-11T10:00:00Z',
    type: 'text',
    metadata: null,
    attachments: [],
    ...overrides,
  };
}

const rawConversation = {
  order_number: 'ORD-0001',
  order_status: 'shipped',
  order_total: 1250.5,
  order_created_at: '2026-09-10T18:00:00Z',
  last_message: {
    body: '¿Cuándo llega?',
    sender_role: 'customer',
    created_at: '2026-09-11T10:00:00Z',
    is_mine: true,
  },
};

const rawDetail = {
  order_number: 'ORD-0001',
  order_id: 10,
  status: 'open',
  order_status: 'shipped',
  payment_status: 'paid',
  payment_method: 'card',
  viewer_role: 'customer',
  can_confirm_payment: false,
  can_reject_payment: false,
  policy: 'No se comparten correos ni teléfonos.',
  messages: [
    {
      id: 1,
      body: 'Hola',
      sender_role: 'customer',
      sender_name: 'Cliente',
      is_mine: true,
      created_at: '2026-09-11T10:00:00Z',
      type: 'text',
      metadata: null,
      attachments: [
        {
          id: 5,
          original_name: 'nota.pdf',
          mime_type: 'application/pdf',
          size: 2048,
          download_url: 'https://tags.test/private/5',
        },
      ],
    },
  ],
};

describe('chat.model — contratos (M5.1)', () => {
  it('Conversation mapea el resumen de GET /conversations', () => {
    const conversation = toCamel<Conversation>(rawConversation);

    expect(conversation.orderNumber).toBe('ORD-0001');
    expect(conversation.orderStatus).toBe('shipped');
    expect(conversation.orderTotal).toBe(1250.5);
    expect(conversation.orderCreatedAt).toBe('2026-09-10T18:00:00Z');
    expect(conversation.lastMessage).toMatchObject({
      body: '¿Cuándo llega?',
      senderRole: 'customer',
      createdAt: '2026-09-11T10:00:00Z',
      isMine: true,
    });
  });

  it('ConversationDetail y ChatMessage mapean snake_case → camelCase', () => {
    const detail = toCamel<ConversationDetail>(rawDetail);

    expect(detail.orderNumber).toBe('ORD-0001');
    expect(detail.orderId).toBe(10);
    expect(detail.status).toBe('open');
    expect(detail.orderStatus).toBe('shipped');
    expect(detail.paymentStatus).toBe('paid');
    expect(detail.paymentMethod).toBe('card');
    expect(detail.viewerRole).toBe('customer');
    expect(detail.canConfirmPayment).toBe(false);
    expect(detail.canRejectPayment).toBe(false);
    expect(detail.policy).toBe('No se comparten correos ni teléfonos.');
    expect(detail.messages).toHaveLength(1);
    expect(detail.messages[0]).toMatchObject({
      id: 1,
      body: 'Hola',
      senderRole: 'customer',
      senderName: 'Cliente',
      isMine: true,
      type: 'text',
      metadata: null,
    });
    expect(detail.messages[0].attachments[0]).toEqual({
      id: 5,
      originalName: 'nota.pdf',
      mimeType: 'application/pdf',
      size: 2048,
      downloadUrl: 'https://tags.test/private/5',
    });
  });

  it('AC3: mergeMessages deduce por id sin duplicados y ordena por createdAt', () => {
    const existing = [
      makeMessage({ id: 1, createdAt: '2026-09-11T10:00:00Z', body: 'primero' }),
      makeMessage({ id: 2, createdAt: '2026-09-11T10:02:00Z', body: 'tercero' }),
    ];
    const incoming = [
      makeMessage({ id: 2, createdAt: '2026-09-11T10:02:00Z', body: 'tercero editado' }),
      makeMessage({ id: 3, createdAt: '2026-09-11T10:01:00Z', body: 'segundo' }),
      makeMessage({ id: 4, createdAt: '2026-09-11T10:03:00Z', body: 'cuarto' }),
    ];

    const merged = mergeMessages(existing, incoming);

    expect(merged.map((m) => m.id)).toEqual([1, 3, 2, 4]);
    expect(merged).toHaveLength(4);
    expect(merged.find((m) => m.id === 2)?.body).toBe('tercero editado');
  });

  it('AC3: mergeMessages no duplica cuando el polling repite los mismos mensajes', () => {
    const first = [makeMessage({ id: 1 }), makeMessage({ id: 2 })];
    const second = [makeMessage({ id: 2 }), makeMessage({ id: 1 })];

    const merged = mergeMessages(first, second);

    expect(merged).toHaveLength(2);
  });

  it('AC4: isValidMessageBody exige 1..CHAT_MESSAGE_MAX caracteres tras trim', () => {
    expect(CHAT_MESSAGE_MAX).toBe(2000);
    expect(isValidMessageBody('Hola')).toBe(true);
    expect(isValidMessageBody('  Hola  ')).toBe(true);
    expect(isValidMessageBody('a'.repeat(CHAT_MESSAGE_MAX))).toBe(true);

    expect(isValidMessageBody('')).toBe(false);
    expect(isValidMessageBody('   ')).toBe(false);
    expect(isValidMessageBody('a'.repeat(CHAT_MESSAGE_MAX + 1))).toBe(false);
  });

  it('chatErrorMessage prioriza el message del HttpError.body', () => {
    const err = {
      name: 'HttpError',
      message: 'HTTP 422 Unprocessable Entity',
      body: { message: 'Por seguridad no puedes compartir correos.' },
    };

    expect(chatErrorMessage(err, 'fallback')).toBe(
      'Por seguridad no puedes compartir correos.',
    );
    expect(chatErrorMessage(new Error('boom'), 'fallback')).toBe('boom');
    expect(chatErrorMessage(null, 'fallback')).toBe('fallback');
  });
});

function makeAsset(overrides: Partial<ChatAttachmentAsset> = {}): ChatAttachmentAsset {
  return {
    uri: 'file:///tmp/foto.jpg',
    name: 'foto.jpg',
    type: 'image/jpeg',
    size: 1024,
    ...overrides,
  };
}

describe('chat.model — adjuntos (M5.2)', () => {
  it('AC2: expone el máximo del backend (max:8192 KB) como 8 MiB', () => {
    expect(CHAT_ATTACHMENT_MAX_BYTES).toBe(8 * 1024 * 1024);
  });

  it('AC2: isAllowedAttachment acepta jpg/jpeg/png/webp/pdf por MIME', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']) {
      expect(isAllowedAttachment(makeAsset({ type }))).toBe(true);
    }
  });

  it('AC2: isAllowedAttachment acepta por extensión cuando el picker omite el MIME', () => {
    for (const name of ['a.JPG', 'b.jpeg', 'c.png', 'd.webp', 'e.PDF']) {
      expect(isAllowedAttachment(makeAsset({ name, type: null }))).toBe(true);
    }
  });

  it('AC2: isAllowedAttachment rechaza tipos no permitidos', () => {
    expect(isAllowedAttachment(makeAsset({ name: 'nota.txt', type: 'text/plain' }))).toBe(false);
    expect(isAllowedAttachment(makeAsset({ name: 'anim.gif', type: 'image/gif' }))).toBe(false);
    expect(isAllowedAttachment(makeAsset({ name: 'script.exe', type: null }))).toBe(false);
  });

  it('AC2 (#27): MIME presente pero inválido gana sobre una extensión válida', () => {
    expect(isAllowedAttachment(makeAsset({ name: 'nota.pdf', type: 'text/plain' }))).toBe(false);
    expect(isAllowedAttachment(makeAsset({ name: 'foto.jpg', type: 'application/zip' }))).toBe(
      false,
    );
  });

  it('AC2: isAllowedAttachmentSize rechaza >8MB y tolera size desconocido', () => {
    expect(isAllowedAttachmentSize(CHAT_ATTACHMENT_MAX_BYTES)).toBe(true);
    expect(isAllowedAttachmentSize(CHAT_ATTACHMENT_MAX_BYTES + 1)).toBe(false);
    expect(isAllowedAttachmentSize(null)).toBe(true);
    expect(isAllowedAttachmentSize(undefined)).toBe(true);
  });

  it('AC2: validateChatAttachment devuelve el error inline o null', () => {
    expect(validateChatAttachment(makeAsset())).toBeNull();
    expect(validateChatAttachment(makeAsset({ name: 'x.gif', type: 'image/gif' }))).toMatch(
      /formato/i,
    );
    expect(
      validateChatAttachment(makeAsset({ size: CHAT_ATTACHMENT_MAX_BYTES + 1 })),
    ).toMatch(/8 MB/i);
  });

  it('formatAttachmentSize muestra B/KB/MB', () => {
    expect(formatAttachmentSize(512)).toBe('512 B');
    expect(formatAttachmentSize(2048)).toBe('2.0 KB');
    expect(formatAttachmentSize(2 * 1024 * 1024)).toBe('2.0 MB');
    expect(formatAttachmentSize(null)).toBeNull();
  });

  it('AC3: canSendPaymentProof solo para supplier_* con pago pendiente/rechazado', () => {
    expect(canSendPaymentProof('supplier_oxxo', 'pending')).toBe(true);
    expect(canSendPaymentProof('supplier_spei', 'rejected')).toBe(true);

    expect(canSendPaymentProof('supplier_oxxo', 'paid')).toBe(false);
    expect(canSendPaymentProof('supplier_oxxo', 'proof_submitted')).toBe(false);
    expect(canSendPaymentProof('card', 'pending')).toBe(false);
    expect(canSendPaymentProof(null, 'pending')).toBe(false);
    expect(canSendPaymentProof('supplier_oxxo', null)).toBe(false);
  });

  it('#27: storeAttachment data mapea el shape real (sin sender_role/metadata)', () => {
    const raw = {
      message: 'Archivo enviado',
      data: {
        id: 12,
        type: 'proof_of_payment',
        body: 'Comprobante de pago',
        attachment: {
          id: 5,
          original_name: 'comprobante.pdf',
          mime_type: 'application/pdf',
          size: 4096,
          download_url: 'https://tags.test/private/5',
        },
        created_at: '2026-09-11T10:05:00Z',
      },
    };

    const response = toCamel<SendAttachmentResponse>(raw);

    expect(response.data).toEqual({
      id: 12,
      type: 'proof_of_payment',
      body: 'Comprobante de pago',
      attachment: {
        id: 5,
        originalName: 'comprobante.pdf',
        mimeType: 'application/pdf',
        size: 4096,
        downloadUrl: 'https://tags.test/private/5',
      },
      createdAt: '2026-09-11T10:05:00Z',
    });
    expect(response.data).not.toHaveProperty('senderRole');
    expect(response.data).not.toHaveProperty('metadata');
  });
});
