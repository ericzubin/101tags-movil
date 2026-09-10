/**
 * M7.4-qa-regression (#35) — Timers/listeners huérfanos.
 *
 * Afirma que el polling de chat arranca al enfocar y se limpia por completo
 * al desenfocar y al desmontar: sin `setInterval` residuales. Espeja el mock
 * de `expo-router` de `useConversationPolling.spec.ts` y audita los ids de
 * `setInterval` contra los de `clearInterval` (inmune a los timers internos
 * de React).
 *
 * @see .spec/2026-09-11-m7-4-qa-regression.md
 */

import { act, renderHook } from '@testing-library/react-native';

import {
  CHAT_POLL_INTERVAL_MS,
  useConversationPolling,
} from '@/core/hooks/useConversationPolling';

import type { ConversationDetail } from '@/core/models/chat.model';

const mockGetConversation = jest.fn();
const mockSendMessage = jest.fn();
const mockSendAttachment = jest.fn();

jest.mock('@/core/services/chat-service', () => ({
  chatService: {
    getConversation: (...args: unknown[]) => mockGetConversation(...args),
    sendMessage: (...args: unknown[]) => mockSendMessage(...args),
    sendAttachment: (...args: unknown[]) => mockSendAttachment(...args),
  },
}));

interface FocusHarness {
  callback: (() => void | (() => void)) | null;
  cleanup: (() => void) | null;
}

const mockFocus: FocusHarness = { callback: null, cleanup: null };

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react');
  return {
    useFocusEffect: (cb: () => void | (() => void)) => {
      ReactLib.useEffect(() => {
        mockFocus.callback = cb;
        const cleanup = cb();
        mockFocus.cleanup = typeof cleanup === 'function' ? cleanup : null;
        return () => {
          if (mockFocus.cleanup) mockFocus.cleanup();
        };
      }, [cb]);
    },
  };
});

function makeDetail(): ConversationDetail {
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
    messages: [],
  };
}

async function flushMicrotasks(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function blur(): void {
  act(() => {
    mockFocus.cleanup?.();
  });
}

function focus(): void {
  act(() => {
    mockFocus.cleanup?.();
    const cleanup = mockFocus.callback?.();
    mockFocus.cleanup = typeof cleanup === 'function' ? cleanup : null;
  });
}

describe('M7.4 — polling de chat sin timers huérfanos', () => {
  let setIntervalSpy: jest.SpyInstance;
  let clearIntervalSpy: jest.SpyInstance;

  function createdIds(): unknown[] {
    return setIntervalSpy.mock.results.map((result) => result.value);
  }

  function expectNoOrphanIntervals(): void {
    const cleared = new Set(clearIntervalSpy.mock.calls.map((call) => call[0]));
    const orphans = createdIds().filter((id) => !cleared.has(id));
    expect(orphans).toEqual([]);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    setIntervalSpy = jest.spyOn(globalThis, 'setInterval');
    clearIntervalSpy = jest.spyOn(globalThis, 'clearInterval');
    mockFocus.callback = null;
    mockFocus.cleanup = null;
    mockGetConversation.mockResolvedValue(makeDetail());
  });

  afterEach(() => {
    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
    jest.useRealTimers();
  });

  it('arranca un intervalo al enfocar y lo limpia al desenfocar', async () => {
    renderHook(() => useConversationPolling('ORD-0001'));
    await flushMicrotasks();

    expect(CHAT_POLL_INTERVAL_MS).toBe(8000);
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    const [intervalId] = createdIds();

    blur();
    expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
    expectNoOrphanIntervals();

    await act(async () => {
      jest.advanceTimersByTime(CHAT_POLL_INTERVAL_MS * 3);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockGetConversation).toHaveBeenCalledTimes(1);
  });

  it('el desmontaje cancela el intervalo (sin huérfanos)', async () => {
    const { unmount } = renderHook(() => useConversationPolling('ORD-0001'));
    await flushMicrotasks();
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    const [intervalId] = createdIds();

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
    expectNoOrphanIntervals();

    await act(async () => {
      jest.advanceTimersByTime(CHAT_POLL_INTERVAL_MS * 3);
      await Promise.resolve();
    });
    expect(mockGetConversation).toHaveBeenCalledTimes(1);
  });

  it('ciclos repetidos de focus/blur no acumulan intervalos', async () => {
    renderHook(() => useConversationPolling('ORD-0001'));
    await flushMicrotasks();
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    for (let cycle = 0; cycle < 3; cycle += 1) {
      blur();
      focus();
      await flushMicrotasks();
    }

    expect(setIntervalSpy).toHaveBeenCalledTimes(4);

    blur();
    expectNoOrphanIntervals();
  });

  it('sin orderNumber no crea intervalo', async () => {
    renderHook(() => useConversationPolling(undefined));
    await flushMicrotasks();

    expect(setIntervalSpy).not.toHaveBeenCalled();
    expect(mockGetConversation).not.toHaveBeenCalled();
    expectNoOrphanIntervals();
  });
});
