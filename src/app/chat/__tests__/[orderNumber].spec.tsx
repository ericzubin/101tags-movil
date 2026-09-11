import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Linking } from 'react-native';

import ConversationScreen from '../[orderNumber]';

import type { ChatAttachment, ChatMessage, ConversationDetail } from '@/core/models/chat.model';

const mockSend = jest.fn();
const mockSendAttachment = jest.fn();
const mockRetry = jest.fn();
const mockRedirect = jest.fn();
const mockReplace = jest.fn();

const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const mockedPicker = DocumentPicker as unknown as { getDocumentAsync: jest.Mock };
const mockedImagePicker = ImagePicker as unknown as {
  requestCameraPermissionsAsync: jest.Mock;
  launchCameraAsync: jest.Mock;
};

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
    sendAttachment: (...args: unknown[]) => mockSendAttachment(...args),
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

function makeDetail(
  messages: ChatMessage[] = [],
  overrides: Partial<ConversationDetail> = {},
): ConversationDetail {
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
    ...overrides,
  };
}

describe('ConversationScreen — chat (M5.1 AC4, AC5, AC6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockReset().mockResolvedValue(true);
    mockSendAttachment.mockReset().mockResolvedValue(true);
    mockRetry.mockReset();
    mockRedirect.mockReset();
    mockReplace.mockReset();
    mockedPicker.getDocumentAsync.mockReset().mockResolvedValue({ canceled: true, assets: null });
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

const pickedImage = {
  canceled: false,
  assets: [
    {
      name: 'foto.jpg',
      uri: 'file:///tmp/foto.jpg',
      size: 2048,
      mimeType: 'image/jpeg',
      lastModified: 1,
    },
  ],
};

const expectedAsset = {
  uri: 'file:///tmp/foto.jpg',
  name: 'foto.jpg',
  type: 'image/jpeg',
  size: 2048,
};

const proofAttachment: ChatAttachment = {
  id: 5,
  originalName: 'comprobante.pdf',
  mimeType: 'application/pdf',
  size: 1048576,
  downloadUrl: 'https://tags.test/private/5',
};

describe('ConversationScreen — adjuntos (M5.2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockReset().mockResolvedValue(true);
    mockSendAttachment.mockReset().mockResolvedValue(true);
    mockedPicker.getDocumentAsync.mockReset().mockResolvedValue({ canceled: true, assets: null });
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

  it('AC3: ofrece comprobante solo si paymentMethod supplier_* y status pending/rejected', () => {
    mockHookState.detail = makeDetail([], {
      paymentMethod: 'supplier_oxxo',
      paymentStatus: 'pending',
    });

    render(<ConversationScreen />);

    expect(screen.getByTestId('chat-proof')).toBeTruthy();
  });

  it('AC3: no ofrece comprobante en pedidos que no son supplier_*', () => {
    mockHookState.detail = makeDetail([], { paymentMethod: 'card', paymentStatus: 'pending' });

    render(<ConversationScreen />);

    expect(screen.queryByTestId('chat-proof')).toBeNull();
  });

  it('AC3: no ofrece comprobante si el pago no está pending/rejected', () => {
    mockHookState.detail = makeDetail([], {
      paymentMethod: 'supplier_spei',
      paymentStatus: 'paid',
    });

    render(<ConversationScreen />);

    expect(screen.queryByTestId('chat-proof')).toBeNull();
  });

  it('AC1: elegir archivo muestra el preview y lo envía como adjunto', async () => {
    mockedPicker.getDocumentAsync.mockResolvedValueOnce(pickedImage);

    render(<ConversationScreen />);
    fireEvent.press(screen.getByTestId('chat-attach'));

    await waitFor(() => expect(mockedPicker.getDocumentAsync).toHaveBeenCalled());
    expect(mockedPicker.getDocumentAsync).toHaveBeenCalledWith({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });

    await waitFor(() => expect(screen.getByTestId('chat-attachment-name')).toBeTruthy());
    expect(screen.getByTestId('chat-attachment-name').props.children).toBe('foto.jpg');
    expect(screen.getByTestId('chat-attachment-size').props.children).toBe('2.0 KB');

    fireEvent.press(screen.getByTestId('chat-attachment-send'));

    await waitFor(() => expect(mockSendAttachment).toHaveBeenCalled());
    expect(mockSendAttachment.mock.calls[0][0]).toEqual(expectedAsset);
    expect(mockSendAttachment.mock.calls[0][1]).toBeUndefined();
  });

  it('AC1 (#27): la cámara adjunta una foto al chat', async () => {
    mockedImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({ granted: true });
    mockedImagePicker.launchCameraAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: 'file:///tmp/foto.jpg',
          fileName: 'foto.jpg',
          mimeType: 'image/jpeg',
          fileSize: 2048,
          width: 10,
          height: 10,
        },
      ],
    });

    render(<ConversationScreen />);
    fireEvent.press(screen.getByTestId('chat-attach-camera'));

    await waitFor(() => expect(screen.getByTestId('chat-attachment-name')).toBeTruthy());
    expect(screen.getByTestId('chat-attachment-name').props.children).toBe('foto.jpg');
  });

  it('AC1: cancelar el picker no muestra preview', async () => {
    mockedPicker.getDocumentAsync.mockResolvedValueOnce({ canceled: true, assets: null });

    render(<ConversationScreen />);
    fireEvent.press(screen.getByTestId('chat-attach'));

    await waitFor(() => expect(mockedPicker.getDocumentAsync).toHaveBeenCalled());
    expect(screen.queryByTestId('chat-attachment-name')).toBeNull();
  });

  it('AC3: elegir desde comprobante envía type=proof_of_payment', async () => {
    mockHookState.detail = makeDetail([], {
      paymentMethod: 'supplier_oxxo',
      paymentStatus: 'rejected',
    });
    mockedPicker.getDocumentAsync.mockResolvedValueOnce(pickedImage);

    render(<ConversationScreen />);
    fireEvent.press(screen.getByTestId('chat-proof'));

    await waitFor(() => expect(screen.getByTestId('chat-attachment-send')).toBeTruthy());
    fireEvent.press(screen.getByTestId('chat-attachment-send'));

    await waitFor(() => expect(mockSendAttachment).toHaveBeenCalled());
    expect(mockSendAttachment.mock.calls[0][0]).toEqual(expectedAsset);
    expect(mockSendAttachment.mock.calls[0][1]).toEqual({ type: 'proof_of_payment' });
  });

  it('AC5: tocar un adjunto abre su downloadUrl', () => {
    const message = makeMessage({ id: 1, attachments: [proofAttachment] });
    mockHookState.messages = [message];
    mockHookState.detail = makeDetail([message]);

    render(<ConversationScreen />);

    expect(screen.getByTestId('chat-attachment-name-5').props.children).toBe('comprobante.pdf');
    fireEvent.press(screen.getByTestId('chat-attachment-5'));

    expect(openURLSpy).toHaveBeenCalledWith('https://tags.test/private/5');
  });

  it('AC6: el botón de envío queda deshabilitado durante sending', async () => {
    mockedPicker.getDocumentAsync.mockResolvedValueOnce(pickedImage);

    const { rerender } = render(<ConversationScreen />);
    fireEvent.press(screen.getByTestId('chat-attach'));
    await waitFor(() => expect(screen.getByTestId('chat-attachment-send')).toBeTruthy());

    mockHookState.isSending = true;
    rerender(<ConversationScreen />);

    expect(
      screen.getByTestId('chat-attachment-send').props.accessibilityState.disabled,
    ).toBe(true);
  });
});
