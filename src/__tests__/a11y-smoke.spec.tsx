/**
 * M7.4-qa-regression (#35) — Smoke de accesibilidad (estático).
 *
 * Renderiza los controles críticos en su pantalla real y afirma
 * `accessibilityLabel` / `accessibilityRole` además de una altura mínima
 * táctil razonable (≥ 44). No valida contraste ni gestos en dispositivo:
 * eso queda BLOQUEADO (requiere dispositivo).
 *
 * @see .spec/2026-09-11-m7-4-qa-regression.md
 */

import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import type { StyleProp, ViewStyle } from 'react-native';

import CartTab from '@/app/(tabs)/cart';
import ConversationScreen from '@/app/chat/[orderNumber]';
import PaymentInstructionsScreen from '@/app/checkout/payment-instructions';
import ReviewScreen from '@/app/checkout/review';
import ProfileScreen from '@/app/profile';

import type { CartItem } from '@/core/models/cart.model';
import type { PaymentInstructionsResult } from '@/core/models/checkout.model';
import type { ConversationDetail } from '@/core/models/chat.model';

const MIN_TOUCH_HEIGHT = 44;

const mockPush = jest.fn();
const mockReplace = jest.fn();

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
    Redirect: () => null,
    useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
    router: { push: mockPush, replace: mockReplace, back: jest.fn() },
    useLocalSearchParams: () => ({ orderNumber: 'ORD-0001', email: 'ana@example.com' }),
    useFocusEffect: () => undefined,
  };
});

const mockFetchCart = jest.fn().mockResolvedValue(undefined);
const mockUpdateItem = jest.fn().mockResolvedValue(undefined);
const mockRemoveItem = jest.fn().mockResolvedValue(undefined);

interface CartState {
  items: CartItem[];
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  fetchCart: jest.Mock;
  updateItem: jest.Mock;
  removeItem: jest.Mock;
}

let mockCartState: CartState;

jest.mock('@/stores/cart-store', () => {
  const actual = jest.requireActual('@/stores/cart-store');
  return {
    ...actual,
    useCartStore: (selector: (s: CartState) => unknown) => selector(mockCartState),
  };
});

const mockSubmit = jest.fn().mockResolvedValue(null);
const mockFetchPaymentInstructions = jest.fn().mockResolvedValue(undefined);
const mockCopyToClipboard = jest.fn().mockResolvedValue(undefined);

interface CheckoutState {
  address: { street: string; city: string; state: string; zip: string };
  coupon: null;
  submission: { status: 'idle'; error: null; result: null };
  submit: jest.Mock;
  paymentInstructions: PaymentInstructionsResult | null;
  instructionsStatus: 'ready';
  instructionsError: null;
  copiedLabel: null;
  clipboardError: null;
  fetchPaymentInstructions: jest.Mock;
  copyToClipboard: jest.Mock;
}

let mockCheckoutState: CheckoutState;

jest.mock('@/stores/checkout-store', () => ({
  useCheckoutStore: (selector: (s: CheckoutState) => unknown) => selector(mockCheckoutState),
}));

const mockRefreshUser = jest.fn().mockResolvedValue(true);
const mockLogout = jest.fn().mockResolvedValue(undefined);
const mockClearSession = jest.fn().mockResolvedValue(undefined);

interface AuthState {
  user: { id: number; name: string; email: string; phone: null; role: string } | null;
  token: string | null;
  isHydrated: boolean;
  refreshUser: jest.Mock;
  logout: jest.Mock;
  clearSession: jest.Mock;
}

let mockAuthState: AuthState;

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (s: AuthState) => unknown) => selector(mockAuthState),
  isAuthenticated: (s: { token: string | null; user: unknown }) => !!s.token && !!s.user,
}));

const mockHookState = {
  detail: null as ConversationDetail | null,
  messages: [],
  isLoading: false,
  isSending: false,
  fatalError: null,
  sendError: null,
};

jest.mock('@/core/hooks/useConversationPolling', () => ({
  CHAT_POLL_INTERVAL_MS: 8000,
  useConversationPolling: () => ({
    ...mockHookState,
    sendMessage: jest.fn().mockResolvedValue(true),
    sendAttachment: jest.fn().mockResolvedValue(true),
    retry: jest.fn(),
  }),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    variantId: 5,
    productId: 1,
    supplierId: null,
    productName: 'Playera Negra',
    productSlug: 'playera-negra',
    size: 'M',
    color: 'Negro',
    sku: 'P-M-N',
    price: 80,
    stock: 10,
    quantity: 2,
    image: null,
    lineTotal: 160,
    ...overrides,
  };
}

const oxxo: PaymentInstructionsResult = {
  orderNumber: 'ORD-0001',
  paymentStatus: 'pending',
  paymentMethod: 'oxxo',
  total: 240,
  paymentDueAt: '2099-01-01T00:00:00Z',
  paymentInstructions: {
    type: 'supplier_manual',
    method: 'oxxo',
    reference: 'REF-123',
    amount: 240,
  },
  demoMode: false,
};

function expectCriticalControl(
  element: { props: Record<string, unknown> },
  label: string,
): void {
  expect(element.props.accessibilityRole).toBe('button');
  expect(element.props.accessibilityLabel).toBe(label);
  const style = StyleSheet.flatten(
    element.props.style as StyleProp<ViewStyle>,
  );
  expect(style?.minHeight ?? 0).toBeGreaterThanOrEqual(MIN_TOUCH_HEIGHT);
}

describe('M7.4 — smoke de accesibilidad de controles críticos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCartState = {
      items: [makeItem()],
      status: 'idle',
      error: null,
      fetchCart: mockFetchCart,
      updateItem: mockUpdateItem,
      removeItem: mockRemoveItem,
    };
    mockCheckoutState = {
      address: { street: 'Av. Juárez 123', city: 'CDMX', state: 'CDMX', zip: '06600' },
      coupon: null,
      submission: { status: 'idle', error: null, result: null },
      submit: mockSubmit,
      paymentInstructions: oxxo,
      instructionsStatus: 'ready',
      instructionsError: null,
      copiedLabel: null,
      clipboardError: null,
      fetchPaymentInstructions: mockFetchPaymentInstructions,
      copyToClipboard: mockCopyToClipboard,
    };
    mockAuthState = {
      user: { id: 1, name: 'Ana', email: 'ana@example.com', phone: null, role: 'customer' },
      token: 'tok',
      isHydrated: true,
      refreshUser: mockRefreshUser,
      logout: mockLogout,
      clearSession: mockClearSession,
    };
    mockHookState.detail = {
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
    mockHookState.messages = [];
  });

  it('carrito: botón Continuar tiene rol, label y altura táctil ≥ 44', () => {
    render(<CartTab />);

    expectCriticalControl(screen.getByTestId('cart-continue'), 'Continuar');
  });

  it('checkout: botón Solicitar pedidos tiene rol, label y altura táctil ≥ 44', () => {
    render(<ReviewScreen />);

    expectCriticalControl(screen.getByTestId('review-submit'), 'Solicitar pedidos');
  });

  it('pago: botón Copiar tiene rol, label y altura táctil ≥ 44', () => {
    render(<PaymentInstructionsScreen />);

    expectCriticalControl(screen.getByTestId('payment-instructions-copy-reference'), 'Copiar');
  });

  it('perfil: botón Cerrar sesión tiene rol, label y altura táctil ≥ 44', () => {
    render(<ProfileScreen />);

    expectCriticalControl(screen.getByTestId('profile-logout'), 'Cerrar sesión');
  });

  it('chat: botón Enviar tiene rol, label y altura táctil ≥ 44', () => {
    render(<ConversationScreen />);

    expectCriticalControl(screen.getByTestId('chat-send'), 'Enviar');
  });
});
