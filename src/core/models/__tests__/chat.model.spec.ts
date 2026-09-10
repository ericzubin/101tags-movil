import {
  CHAT_MESSAGE_MAX,
  chatErrorMessage,
  isValidMessageBody,
  mergeMessages,
  type ChatMessage,
  type Conversation,
  type ConversationDetail,
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
