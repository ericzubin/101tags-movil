import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { FlatList } from 'react-native';

import ReturnsScreen from '../index';

import type { ReturnRequest } from '@/core/models/order.model';
import type { Paginated } from '@/core/models/common.model';

const mockUseInfiniteQuery = jest.fn();
const mockGetReturnRequests = jest.fn();
const mockRefetch = jest.fn();
const mockFetchNextPage = jest.fn();
const mockRedirect = jest.fn();

let mockIsAuthenticated = true;
let mockIsHydrated = true;

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

jest.mock('expo-router', () => {
  const MockRedirect = (props: { href: string }) => {
    mockRedirect(props);
    return null;
  };
  MockRedirect.displayName = 'Redirect';
  return {
    Redirect: MockRedirect,
    router: { push: jest.fn() },
    useLocalSearchParams: () => ({}),
  };
});

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
}));

jest.mock('@/core/services/order-service', () => ({
  orderService: {
    getReturnRequests: (...args: unknown[]) => mockGetReturnRequests(...args),
  },
}));

interface InfiniteState {
  data?: { pages: Paginated<ReturnRequest>[] };
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
      return { ...INFINITE_DEFAULTS, ...state, refetch: mockRefetch, fetchNextPage: mockFetchNextPage };
    },
  );
}

function makeReturn(overrides: Partial<ReturnRequest> = {}): ReturnRequest {
  return {
    id: 1,
    folio: 'RET-1',
    type: 'return',
    orderNumber: 'ORD-0001',
    orderStatus: 'delivered',
    reason: 'Producto dañado',
    description: null,
    status: 'requested',
    resolutionNotes: null,
    createdAt: '2026-09-11T10:00:00Z',
    resolvedAt: null,
    ...overrides,
  };
}

function makePage(items: ReturnRequest[], currentPage: number, lastPage: number): Paginated<ReturnRequest> {
  return {
    data: items,
    currentPage,
    lastPage,
    perPage: 20,
    total: items.length,
    from: items.length > 0 ? 1 : null,
    to: items.length > 0 ? items.length : null,
    nextPageUrl: null,
    prevPageUrl: null,
  };
}

describe('ReturnsScreen — lista de devoluciones (M4.2 AC5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInfiniteQuery.mockReset();
    mockRefetch.mockReset();
    mockFetchNextPage.mockReset();
    mockRedirect.mockReset();
    mockIsAuthenticated = true;
    mockIsHydrated = true;
  });

  it('AC5: muestra folio, tipo y status y consulta la página 1', () => {
    setupQuery({ data: { pages: [makePage([makeReturn()], 1, 1)] } });

    render(<ReturnsScreen />);

    expect(mockGetReturnRequests).toHaveBeenCalledWith(1);
    expect(screen.getByTestId('return-folio-RET-1').props.children).toBe('RET-1');
    expect(screen.getByTestId('return-type-RET-1').props.children).toBe('Devolución');
    expect(screen.getByTestId('return-status-RET-1').props.children).toBe('Solicitada');
  });

  it('AC5: traduce cancelación y status aprobado', () => {
    setupQuery({
      data: {
        pages: [
          makePage(
            [makeReturn({ folio: 'RET-2', type: 'cancellation', status: 'approved' })],
            1,
            1,
          ),
        ],
      },
    });

    render(<ReturnsScreen />);

    expect(screen.getByTestId('return-type-RET-2').props.children).toBe('Cancelación');
    expect(screen.getByTestId('return-status-RET-2').props.children).toBe('Aprobada');
  });

  it('AC5: lista vacía muestra EmptyState', () => {
    setupQuery({ data: { pages: [makePage([], 1, 1)] } });

    render(<ReturnsScreen />);

    expect(screen.getByTestId('returns-empty')).toBeTruthy();
  });

  it('AC5: error de primera carga muestra ErrorState y el retry refetchea', () => {
    setupQuery({ isError: true });

    render(<ReturnsScreen />);
    expect(screen.getByTestId('returns-error')).toBeTruthy();

    fireEvent.press(screen.getByTestId('returns-error-retry'));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('AC5: onEndReached pagina cuando hay siguiente página', () => {
    setupQuery({ data: { pages: [makePage([makeReturn()], 1, 3)] }, hasNextPage: true });

    render(<ReturnsScreen />);
    screen.UNSAFE_getByType(FlatList).props.onEndReached();

    expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('M4.2: sin sesión redirige a login y no consulta devoluciones', () => {
    mockIsAuthenticated = false;
    setupQuery({ data: { pages: [makePage([], 1, 1)] } });

    render(<ReturnsScreen />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)/login' });
    expect(mockGetReturnRequests).not.toHaveBeenCalled();
  });
});
