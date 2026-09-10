import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { HttpError } from '@/core/api/client';
import type { OrderDetail } from '@/core/models/order.model';

import OrderDetailScreen from '../[orderNumber]';

const mockRefetch = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockRedirect = jest.fn();

let mockIsAuthenticated = true;
let mockIsHydrated = true;
let mockQueryState: {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  data: OrderDetail | undefined;
};

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (
    selector: (s: { isHydrated: boolean; token: string | null; user: unknown }) => unknown,
  ) => {
    const state = {
      isHydrated: mockIsHydrated,
      token: mockIsAuthenticated ? 'mock-token' : null,
      user: mockIsAuthenticated ? { id: 1, name: 'Juan' } : null,
    };
    return selector(state);
  },
  isAuthenticated: (s: { token: string | null; user: unknown }) => !!s.token && !!s.user,
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ ...mockQueryState, refetch: mockRefetch }),
}));

jest.mock('@/core/services/order-service', () => ({
  orderService: { getOrder: jest.fn() },
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
  const MockRedirect = (props: { href: string }) => {
    mockRedirect(props);
    return null;
  };
  MockRedirect.displayName = 'Redirect';
  return {
    Stack: MockStack,
    Redirect: MockRedirect,
    router: {
      replace: (...args: unknown[]) => mockReplace(...args),
      push: (...args: unknown[]) => mockPush(...args),
      back: jest.fn(),
    },
    useLocalSearchParams: () => ({ orderNumber: 'ORD-0001' }),
  };
});

function makeDetail(overrides: Partial<OrderDetail> = {}): OrderDetail {
  return {
    id: 1,
    orderNumber: 'ORD-0001',
    status: 'shipped',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    segment: 'basicos',
    total: 1149,
    itemsCount: 2,
    createdAt: '2026-09-10T18:00:00Z',
    tracking: { carrier: 'DHL', number: 'TRK-123', timeline: null },
    supplierRating: { canRate: false, hasRated: false, rating: null },
    subtotal: 1100,
    shippingCost: 99,
    discountAmount: 50,
    couponCode: 'TAGS50',
    paymentDueAt: null,
    paymentInstructions: null,
    shippingAddress: { street: 'Av. Juárez 123', city: 'CDMX', state: 'CDMX', zip: '06600' },
    items: [
      {
        productName: 'Playera Negra',
        size: 'M',
        color: 'Negro',
        quantity: 2,
        unitPrice: 550,
        totalPrice: 1100,
      },
    ],
    ...overrides,
  };
}

describe('OrderDetailScreen — detalle, timeline y tracking (M4.1 AC3, AC4, AC5, AC6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = true;
    mockIsHydrated = true;
    mockQueryState = { isLoading: false, isError: false, error: null, data: undefined };
  });

  it('AC3: muestra items con nombre, talla/color, cantidad, unitario y total', () => {
    mockQueryState = { ...mockQueryState, data: makeDetail() };

    render(<OrderDetailScreen />);

    expect(screen.getByTestId('order-item-name-0').props.children).toBe('Playera Negra');
    expect(screen.getByTestId('order-item-variant-0').props.children).toBe('M · Negro');
    expect(screen.getByTestId('order-item-qty-0').props.children).toBe(2);
    expect(screen.getByTestId('order-item-unit-0').props.children).toBe('$550.00');
    expect(screen.getByTestId('order-item-total-0').props.children).toBe('$1,100.00');
  });

  it('AC3: muestra subtotal, envío, descuento y total', () => {
    mockQueryState = { ...mockQueryState, data: makeDetail() };

    render(<OrderDetailScreen />);

    expect(screen.getByTestId('order-subtotal').props.children).toBe('$1,100.00');
    expect(screen.getByTestId('order-shipping').props.children).toBe('$99.00');
    expect(screen.getByTestId('order-discount').props.children).toBe('$50.00');
    expect(screen.getByTestId('order-total').props.children).toBe('$1,149.00');
  });

  it('AC4: renderiza la timeline cuando hay pasos', () => {
    mockQueryState = {
      ...mockQueryState,
      data: makeDetail({
        tracking: {
          carrier: 'DHL',
          number: 'TRK-123',
          timeline: [
            { key: 'requested', label: 'Solicitado', completed: true, current: false },
            { key: 'shipped', label: 'Enviado', completed: true, current: true },
          ],
        },
      }),
    };

    render(<OrderDetailScreen />);

    expect(screen.getByTestId('order-timeline')).toBeTruthy();
    expect(screen.getByTestId('timeline-step-requested')).toBeTruthy();
    expect(screen.getByText('Enviado')).toBeTruthy();
  });

  it('AC4: timeline null no rompe y omite el bloque', () => {
    mockQueryState = {
      ...mockQueryState,
      data: makeDetail({
        tracking: { carrier: null, number: null, timeline: null },
      }),
    };

    render(<OrderDetailScreen />);

    expect(screen.queryByTestId('order-timeline')).toBeNull();
  });

  it('AC4: muestra carrier/número solo cuando existen', () => {
    mockQueryState = { ...mockQueryState, data: makeDetail() };
    const { rerender } = render(<OrderDetailScreen />);

    expect(screen.getByTestId('order-tracking-carrier').props.children).toBe('DHL');
    expect(screen.getByTestId('order-tracking-number').props.children).toBe('TRK-123');

    mockQueryState = {
      ...mockQueryState,
      data: makeDetail({ tracking: { carrier: null, number: null, timeline: null } }),
    };
    rerender(<OrderDetailScreen />);

    expect(screen.queryByTestId('order-tracking')).toBeNull();
  });

  it('AC5: pedido ajeno/inexistente (404) muestra estado no encontrado sin crash', () => {
    mockQueryState = {
      isLoading: false,
      isError: true,
      error: new HttpError(404, 'Not Found', null, 'HTTP 404 Not Found'),
      data: undefined,
    };

    render(<OrderDetailScreen />);

    expect(screen.getByText('Pedido no encontrado')).toBeTruthy();
    fireEvent.press(screen.getByTestId('order-not-found-button'));
    expect(mockReplace).toHaveBeenCalledWith('/orders');
  });

  it('AC6: error genérico muestra ErrorState y reintenta', () => {
    mockQueryState = {
      isLoading: false,
      isError: true,
      error: new Error('boom'),
      data: undefined,
    };

    render(<OrderDetailScreen />);

    expect(screen.getByTestId('order-detail-error')).toBeTruthy();
    fireEvent.press(screen.getByTestId('order-detail-error-retry'));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('M4.1: sin sesión redirige a login', () => {
    mockIsAuthenticated = false;
    mockQueryState = { ...mockQueryState, data: makeDetail() };

    render(<OrderDetailScreen />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)/login' });
  });

  it('AC1: en paid ofrece cancelar y devolver y navega al request con su tipo', () => {
    mockQueryState = { ...mockQueryState, data: makeDetail({ status: 'paid' }) };

    render(<OrderDetailScreen />);

    fireEvent.press(screen.getByTestId('order-cancel-action'));
    expect(mockPush).toHaveBeenCalledWith(
      '/orders/request?orderNumber=ORD-0001&type=cancellation',
    );

    fireEvent.press(screen.getByTestId('order-return-action'));
    expect(mockPush).toHaveBeenCalledWith('/orders/request?orderNumber=ORD-0001&type=return');
  });

  it('AC2: en cancelled oculta cancelar y devolver', () => {
    mockQueryState = { ...mockQueryState, data: makeDetail({ status: 'cancelled' }) };

    render(<OrderDetailScreen />);

    expect(screen.queryByTestId('order-cancel-action')).toBeNull();
    expect(screen.queryByTestId('order-return-action')).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('AC2: en pending oculta devolver pero mantiene cancelar', () => {
    mockQueryState = { ...mockQueryState, data: makeDetail({ status: 'pending' }) };

    render(<OrderDetailScreen />);

    expect(screen.queryByTestId('order-return-action')).toBeNull();
    expect(screen.getByTestId('order-cancel-action')).toBeTruthy();
  });

  it('AC2: en shipped mantiene devolver y cancelar', () => {
    mockQueryState = { ...mockQueryState, data: makeDetail({ status: 'shipped' }) };

    render(<OrderDetailScreen />);

    expect(screen.getByTestId('order-return-action')).toBeTruthy();
    expect(screen.getByTestId('order-cancel-action')).toBeTruthy();
  });
});
