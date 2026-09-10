import { act, renderHook } from '@testing-library/react-native';

import {
  CHAT_POLL_INTERVAL_MS,
  useConversationPolling,
} from '@/core/hooks/useConversationPolling';
import type { ChatMessage, ConversationDetail } from '@/core/models/chat.model';

const mockGetConversation = jest.fn();
const mockSendMessage = jest.fn();

jest.mock('@/core/services/chat-service', () => ({
  chatService: {
    getConversation: (...args: unknown[]) => mockGetConversation(...args),
    sendMessage: (...args: unknown[]) => mockSendMessage(...args),
  },
}));

const mockFocus = { cleanup: null as (() => void) | null };

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react');
  return {
    useFocusEffect: (cb: () => void | (() => void)) => {
      ReactLib.useEffect(() => {
        const cleanup = cb();
        mockFocus.cleanup = typeof cleanup === 'function' ? cleanup : null;
        return () => {
          if (mockFocus.cleanup) mockFocus.cleanup();
        };
      }, [cb]);
    },
  };
});

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

function makeDetail(messages: ChatMessage[] = []): ConversationDetail {
  return {
    orderNumber: 'ORD-0001',
    orderId: 10,
    status: 'open',
    orderStatus: 'shipped',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    viewerRole: 'customer',
    canConfirmPayment: false,
    canRejectPayment: false,
    policy: 'No se comparten correos ni teléfonos.',
    messages,
  };
}

async function flushMicrotasks(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function advance(ms: number): Promise<void> {
  await act(async () => {
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useConversationPolling (M5.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFocus.cleanup = null;
    mockGetConversation.mockResolvedValue(makeDetail([]));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('AC2: fetch inicial al enfocar y polling cada 8s', async () => {
    jest.useFakeTimers();
    const { unmount } = renderHook(() => useConversationPolling('ORD-0001'));
    await flushMicrotasks();

    expect(CHAT_POLL_INTERVAL_MS).toBe(8000);
    expect(mockGetConversation).toHaveBeenCalledTimes(1);
    expect(mockGetConversation).toHaveBeenCalledWith('ORD-0001');

    await advance(CHAT_POLL_INTERVAL_MS);
    expect(mockGetConversation).toHaveBeenCalledTimes(2);

    await advance(CHAT_POLL_INTERVAL_MS);
    expect(mockGetConversation).toHaveBeenCalledTimes(3);

    unmount();
  });

  it('AC2: al desenfocar se cancela el intervalo (clearInterval) y no hay timers residuales', async () => {
    jest.useFakeTimers();
    renderHook(() => useConversationPolling('ORD-0001'));
    await flushMicrotasks();

    expect(mockGetConversation).toHaveBeenCalledTimes(1);

    await advance(CHAT_POLL_INTERVAL_MS);
    expect(mockGetConversation).toHaveBeenCalledTimes(2);

    act(() => {
      mockFocus.cleanup?.();
    });

    await advance(CHAT_POLL_INTERVAL_MS * 3);
    expect(mockGetConversation).toHaveBeenCalledTimes(2);
  });

  it('AC2: al desmontar se cancela el intervalo y no hay timers residuales', async () => {
    jest.useFakeTimers();
    const { unmount } = renderHook(() => useConversationPolling('ORD-0001'));
    await flushMicrotasks();
    expect(mockGetConversation).toHaveBeenCalledTimes(1);

    unmount();
    await advance(CHAT_POLL_INTERVAL_MS * 3);

    expect(mockGetConversation).toHaveBeenCalledTimes(1);
  });

  it('AC2: evita requests solapadas con un guard inFlight', async () => {
    jest.useFakeTimers();
    let resolveFirst!: (value: ConversationDetail) => void;
    mockGetConversation.mockReturnValueOnce(
      new Promise<ConversationDetail>((resolve) => {
        resolveFirst = resolve;
      }),
    );

    renderHook(() => useConversationPolling('ORD-0001'));
    await flushMicrotasks();
    expect(mockGetConversation).toHaveBeenCalledTimes(1);

    await advance(CHAT_POLL_INTERVAL_MS);
    expect(mockGetConversation).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst(makeDetail([]));
      await Promise.resolve();
      await Promise.resolve();
    });

    await advance(CHAT_POLL_INTERVAL_MS);
    expect(mockGetConversation).toHaveBeenCalledTimes(2);
  });

  it('AC3: fusiona mensajes por id sin duplicados y ordenados', async () => {
    jest.useFakeTimers();
    mockGetConversation.mockResolvedValueOnce(
      makeDetail([
        makeMessage({ id: 2, createdAt: '2026-09-11T10:02:00Z' }),
        makeMessage({ id: 1, createdAt: '2026-09-11T10:01:00Z' }),
      ]),
    );
    const { result } = renderHook(() => useConversationPolling('ORD-0001'));
    await flushMicrotasks();

    expect(result.current.messages.map((m) => m.id)).toEqual([1, 2]);

    mockGetConversation.mockResolvedValueOnce(
      makeDetail([
        makeMessage({ id: 2, createdAt: '2026-09-11T10:02:00Z' }),
        makeMessage({ id: 3, createdAt: '2026-09-11T10:03:00Z' }),
      ]),
    );
    await advance(CHAT_POLL_INTERVAL_MS);

    expect(result.current.messages.map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it('AC5: un error de polling conserva los últimos datos sin error fatal', async () => {
    jest.useFakeTimers();
    mockGetConversation.mockResolvedValueOnce(makeDetail([makeMessage({ id: 1 })]));
    const { result } = renderHook(() => useConversationPolling('ORD-0001'));
    await flushMicrotasks();

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.fatalError).toBeNull();

    mockGetConversation.mockRejectedValueOnce(new Error('network down'));
    await advance(CHAT_POLL_INTERVAL_MS);

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.fatalError).toBeNull();
  });

  it('AC5: un error en la primera carga expone fatalError y retry reintenta', async () => {
    jest.useFakeTimers();
    mockGetConversation.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useConversationPolling('ORD-0001'));
    await flushMicrotasks();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fatalError).toBeTruthy();
    expect(result.current.messages).toHaveLength(0);

    mockGetConversation.mockResolvedValueOnce(makeDetail([makeMessage({ id: 1 })]));
    await act(async () => {
      result.current.retry();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.fatalError).toBeNull();
  });

  it('AC4: envía con trim, muestra el optimista y reconcilia con el server', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useConversationPolling('ORD-0001'));
    await flushMicrotasks();

    let resolveSend!: (value: unknown) => void;
    mockSendMessage.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSend = resolve;
      }),
    );

    let sendPromise!: Promise<boolean>;
    await act(async () => {
      sendPromise = result.current.sendMessage('  Hola  ');
    });

    expect(mockSendMessage).toHaveBeenCalledWith('ORD-0001', 'Hola');
    expect(result.current.messages.some((m) => m.pending)).toBe(true);

    await act(async () => {
      resolveSend({
        message: 'Mensaje enviado',
        data: {
          id: 9,
          body: 'Hola',
          senderRole: 'customer',
          type: 'text',
          metadata: null,
          createdAt: '2026-09-11T10:05:00Z',
        },
      });
      await sendPromise;
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].id).toBe(9);
    expect(result.current.messages[0].pending).toBeFalsy();
  });

  it('AC4: body vacío o mayor a 2000 no llama al servicio', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useConversationPolling('ORD-0001'));
    await flushMicrotasks();

    let emptyResult = true;
    await act(async () => {
      emptyResult = await result.current.sendMessage('   ');
    });
    expect(emptyResult).toBe(false);

    let longResult = true;
    await act(async () => {
      longResult = await result.current.sendMessage('a'.repeat(2001));
    });
    expect(longResult).toBe(false);

    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('AC4: error al enviar quita el optimista y expone sendError', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useConversationPolling('ORD-0001'));
    await flushMicrotasks();

    mockSendMessage.mockRejectedValueOnce({
      name: 'HttpError',
      message: 'HTTP 422',
      body: { message: 'No puedes compartir correos.' },
    });

    let ok = true;
    await act(async () => {
      ok = await result.current.sendMessage('Hola');
    });

    expect(ok).toBe(false);
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.sendError).toBe('No puedes compartir correos.');
  });
});
