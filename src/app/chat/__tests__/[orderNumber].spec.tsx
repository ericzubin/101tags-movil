import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import ConversationScreen from '../[orderNumber]';

import type { ChatMessage, ConversationDetail } from '@/core/models/chat.model';

const mockSend = jest.fn();
const mockRetry = jest.fn();
const mockRedirect = jest.fn();
const mockReplace = jest.fn();

let mockIsAuthenticated = true;
let mockIsHydrated = true;
let mockHookState: {
  detail: ConversationDetail | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  fatalError: string | null;
  sendError: string | null;
};

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (
    selector: (s: { isHydrated: boolean; token: string | null; user: unknown }) => unknown,
  ) =>
    selector({
      isHydrated: mockIsHydrated,
      token: mockIsAuthenticated ? 'mock-token' : null,
      user: mockIsAuthenticated ? { id: 1, name: 'Juan' } : null,
    }),
  isAuthenticated: (s: { token: string | null; user: unknown }) => !!s.token && !!s.user,
}));

jest.mock('@/core/hooks/useConversationPolling', () => ({
  CHAT_POLL_INTERVAL_MS: 8000,
  useConversationPolling: () => ({
    ...mockHookState,
    sendMessage: (...args: unknown[]) => mockSend(...args),
    retry: (...args: unknown[]) => mockRetry(...args),
  }),
}));

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react');
  const MockStack = (props: { children?: unknown }) =>
    ReactLib.createElement(ReactLib.Fragment, null, props.children);
  MockStack.displayName = 'Stack';
  const MockStackScreen = () => null;
  MockStackScreen.displayName = 'StackScreen';
  (MockStack as unknown as Record<string, unknown>).Screen = MockStackScreen;
  return {
    Stack: MockStack,
    Redirect: (props: { href: string }) => {
      mockRedirect(props);
      return null;
    },
    router: {
      push: jest.fn(),
      replace: (...args: unknown[]) => mockReplace(...args),
      back: jest.fn(),
    },
    useLocalSearchParams: () => ({ orderNumber: 'ORD-0001' }),
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
    policy: 'Toda la comunicación queda registrada en 101tags.',
    messages,
  };
}

describe('ConversationScreen — chat (M5.1 AC4, AC5, AC6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockReset().mockResolvedValue(true);
    mockRetry.mockReset();
    mockRedirect.mockReset();
    mockReplace.mockReset();
    mockIsAuthenticated = true;
    mockIsHydrated = true;
    mockHookState = {
      detail: makeDetail([makeMessage()]),
      messages: [makeMessage()],
      isLoading: false,
      isSending: false,
      fatalError: null,
      sendError: null,
    };
  });

  it('muestra la policy y las burbujas por isMine', () => {
    mockHookState.messages = [
      makeMessage({ id: 1, body: 'Hola', isMine: true }),
      makeMessage({ id: 2, body: '¿En qué te ayudo?', isMine: false, senderRole: 'supplier' }),
    ];
    mockHookState.detail = makeDetail(mockHookState.messages);

    render(<ConversationScreen />);

    expect(screen.getByTestId('chat-policy').props.children).toBe(
      'Toda la comunicación queda registrada en 101tags.',
    );
    expect(screen.getByTestId('chat-message-mine-1')).toBeTruthy();
    expect(screen.getByTestId('chat-message-other-2')).toBeTruthy();
    expect(screen.getByTestId('chat-message-body-2').props.children).toBe('¿En qué te ayudo?');
  });

  it('AC4: envía el texto con trim y limpia el input', async () => {
    render(<ConversationScreen />);

    fireEvent.changeText(screen.getByTestId('chat-input'), '  Hola proveedor  ');
    fireEvent.press(screen.getByTestId('chat-send'));

    await waitFor(() => {
      expect(mockSend).toHaveBeenCalledWith('Hola proveedor');
    });
    await waitFor(() => {
      expect(screen.getByTestId('chat-input').props.value).toBe('');
    });
  });

  it('AC4: input vacío no envía', () => {
    render(<ConversationScreen />);

    fireEvent.press(screen.getByTestId('chat-send'));

    expect(mockSend).not.toHaveBeenCalled();
  });

  it('AC4/AC5: muestra el error de envío', () => {
    mockHookState.sendError = 'No puedes compartir correos.';

    render(<ConversationScreen />);

    expect(screen.getByTestId('chat-send-error').props.children).toBe(
      'No puedes compartir correos.',
    );
  });

  it('AC5: error fatal muestra ErrorState y el retry reinvoca el hook', () => {
    mockHookState.detail = null;
    mockHookState.messages = [];
    mockHookState.fatalError = 'No pudimos cargar la conversación.';

    render(<ConversationScreen />);

    expect(screen.getByTestId('chat-error')).toBeTruthy();

    fireEvent.press(screen.getByTestId('chat-error-retry'));

    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('muestra skeleton durante la carga inicial', () => {
    mockHookState.detail = null;
    mockHookState.messages = [];
    mockHookState.isLoading = true;

    render(<ConversationScreen />);

    expect(screen.getByTestId('chat-skeleton')).toBeTruthy();
  });

  it('M5.1: sin sesión redirige a login', () => {
    mockIsAuthenticated = false;

    render(<ConversationScreen />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)/login' });
  });
});
