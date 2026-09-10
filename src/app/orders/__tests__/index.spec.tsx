import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { FlatList } from 'react-native';

import OrdersScreen from '../index';
import type { OrderSummary } from '@/core/models/order.model';
import type { Paginated } from '@/core/models/common.model';

const mockPush = jest.fn();
const mockUseInfiniteQuery = jest.fn();
const mockGetOrders = jest.fn();
const mockRefetch = jest.fn();
const mockFetchNextPage = jest.fn();
const mockRedirect = jest.fn();

let mockIsAuthenticated = true;
let mockIsHydrated = true;

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

jest.mock('expo-router', () => {
  const MockRedirect = (props: { href: string }) => {
    mockRedirect(props);
    return null;
  };
  MockRedirect.displayName = 'Redirect';
  return {
    Redirect: MockRedirect,
    router: { push: (...args: unknown[]) => mockPush(...args) },
    useLocalSearchParams: () => ({}),
  };
});

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
}));

jest.mock('@/core/services/order-service', () => ({
  orderService: {
    getOrders: (...args: unknown[]) => mockGetOrders(...args),
  },
}));

interface InfiniteState {
  data?: { pages: Paginated<OrderSummary>[] };
  isLoading?: boolean;
  isError?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isRefetching?: boolean;
}

const INFINITE_DEFAULTS: InfiniteState = {
  data: undefined,
  isLoading: false,
  isError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  isRefetching: false,
};

function setupQuery(state: InfiniteState = {}) {
  mockUseInfiniteQuery.mockImplementation(
    (options: {
      queryFn?: (ctx: { pageParam: unknown }) => unknown;
      initialPageParam?: unknown;
      enabled?: boolean;
    }) => {
      if (options.enabled !== false && options.queryFn) {
        void options.queryFn({ pageParam: options.initialPageParam });
      }
      return {
        ...INFINITE_DEFAULTS,
        ...state,
        refetch: mockRefetch,
        fetchNextPage: mockFetchNextPage,
      };
    },
  );
}

function makeOrder(overrides: Partial<OrderSummary> = {}): OrderSummary {
  return {
    id: 1,
    orderNumber: 'ORD-0001',
    status: 'shipped',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    segment: 'basicos',
    total: 1250.5,
    itemsCount: 2,
    createdAt: '2026-09-10T18:00:00Z',
    tracking: { carrier: null, number: null, timeline: null },
    supplierRating: { canRate: false, hasRated: false, rating: null },
    ...overrides,
  };
}

function makePage(
  orders: OrderSummary[],
  currentPage: number,
  lastPage: number,
): Paginated<OrderSummary> {
  return {
    data: orders,
    currentPage,
    lastPage,
    perPage: 10,
    total: orders.length,
    from: orders.length > 0 ? 1 : null,
    to: orders.length > 0 ? orders.length : null,
    nextPageUrl: null,
    prevPageUrl: null,
  };
}

describe('OrdersScreen — lista (M4.1 AC2, AC6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInfiniteQuery.mockReset();
    mockRefetch.mockReset();
    mockFetchNextPage.mockReset();
    mockRedirect.mockReset();
    mockIsAuthenticated = true;
    mockIsHydrated = true;
  });

  it('AC2: muestra orderNumber, total, estado y fecha, y consulta la página 1', () => {
    setupQuery({ data: { pages: [makePage([makeOrder()], 1, 1)] } });

    render(<OrdersScreen />);

    expect(mockGetOrders).toHaveBeenCalledWith(1);
    expect(screen.getByText('ORD-0001')).toBeTruthy();
    expect(screen.getByTestId('order-total-ORD-0001').props.children).toBe('$1,250.50');
    expect(screen.getByTestId('order-status-ORD-0001').props.children).toBe('shipped');
    expect(screen.getByTestId('order-date-ORD-0001').props.children).toBeTruthy();
  });

  it('AC2: tap en un pedido navega al detalle', () => {
    setupQuery({ data: { pages: [makePage([makeOrder()], 1, 1)] } });

    render(<OrdersScreen />);
    fireEvent.press(screen.getByTestId('order-item-ORD-0001'));

    expect(mockPush).toHaveBeenCalledWith('/orders/ORD-0001');
  });

  it('AC2: onEndReached llama fetchNextPage cuando hay página siguiente', () => {
    setupQuery({
      data: { pages: [makePage([makeOrder()], 1, 3)] },
      hasNextPage: true,
    });

    render(<OrdersScreen />);
    screen.UNSAFE_getByType(FlatList).props.onEndReached();

    expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('AC2: no llama fetchNextPage si no hay página siguiente', () => {
    setupQuery({ data: { pages: [makePage([makeOrder()], 3, 3)] }, hasNextPage: false });

    render(<OrdersScreen />);
    screen.UNSAFE_getByType(FlatList).props.onEndReached();

    expect(mockFetchNextPage).not.toHaveBeenCalled();
  });

  it('AC6: pull-to-refresh refetchea la lista', () => {
    setupQuery({ data: { pages: [makePage([makeOrder()], 1, 1)] } });

    render(<OrdersScreen />);
    screen.UNSAFE_getByType(FlatList).props.refreshControl.props.onRefresh();

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('AC6: lista vacía muestra EmptyState', () => {
    setupQuery({ data: { pages: [makePage([], 1, 1)] } });

    render(<OrdersScreen />);

    expect(screen.getByTestId('orders-empty')).toBeTruthy();
  });

  it('AC6: error de primera carga muestra ErrorState y el retry refetchea', () => {
    setupQuery({ isError: true });

    render(<OrdersScreen />);
    expect(screen.getByTestId('orders-error')).toBeTruthy();

    fireEvent.press(screen.getByTestId('orders-error-retry'));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('M4.1: sin sesión redirige a login y no consulta pedidos', () => {
    mockIsAuthenticated = false;
    setupQuery({ data: { pages: [makePage([], 1, 1)] } });

    render(<OrdersScreen />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)/login' });
    expect(mockGetOrders).not.toHaveBeenCalled();
  });

  it('M4.1: durante la hidratación no renderiza la lista', () => {
    mockIsHydrated = false;
    setupQuery({ data: { pages: [makePage([makeOrder()], 1, 1)] } });

    render(<OrdersScreen />);

    expect(screen.queryByTestId('orders-list')).toBeNull();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
