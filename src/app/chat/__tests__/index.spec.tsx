import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import ChatListScreen from '../index';

import type { Conversation } from '@/core/models/chat.model';

const mockPush = jest.fn();
const mockUseQuery = jest.fn();
const mockGetConversations = jest.fn();
const mockRefetch = jest.fn();
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
    router: { push: (...args: unknown[]) => mockPush(...args) },
    useLocalSearchParams: () => ({}),
  };
});

jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock('@/core/services/chat-service', () => ({
  chatService: {
    getConversations: (...args: unknown[]) => mockGetConversations(...args),
  },
}));

interface QueryState {
  data?: { data: Conversation[] };
  isLoading?: boolean;
  isError?: boolean;
  isRefetching?: boolean;
}

const QUERY_DEFAULTS: QueryState = {
  data: undefined,
  isLoading: false,
  isError: false,
  isRefetching: false,
};

function setupQuery(state: QueryState = {}) {
  mockUseQuery.mockImplementation(
    (options: { queryFn?: () => unknown; enabled?: boolean }) => {
      if (options.enabled !== false && options.queryFn) {
        void options.queryFn();
      }
      return { ...QUERY_DEFAULTS, ...state, refetch: mockRefetch };
    },
  );
}

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    orderNumber: 'ORD-0001',
    orderStatus: 'shipped',
    orderTotal: 1250.5,
    orderCreatedAt: '2026-09-10T18:00:00Z',
    lastMessage: {
      body: '¿Cuándo llega?',
      senderRole: 'customer',
      createdAt: '2026-09-11T10:00:00Z',
      isMine: true,
    },
    ...overrides,
  };
}

describe('ChatListScreen — lista de conversaciones (M5.1 AC1, AC6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReset();
    mockRefetch.mockReset();
    mockRedirect.mockReset();
    mockIsAuthenticated = true;
    mockIsHydrated = true;
  });

  it('AC1: consulta GET /conversations y muestra orderNumber + último mensaje', () => {
    setupQuery({ data: { data: [makeConversation()] } });

    render(<ChatListScreen />);

    expect(mockGetConversations).toHaveBeenCalledTimes(1);
    expect(screen.getByText('ORD-0001')).toBeTruthy();
    expect(screen.getByTestId('conversation-last-ORD-0001').props.children).toBe('¿Cuándo llega?');
    expect(screen.getByText('shipped')).toBeTruthy();
  });

  it('AC1: tap en una conversación navega al chat del pedido', () => {
    setupQuery({ data: { data: [makeConversation()] } });

    render(<ChatListScreen />);
    fireEvent.press(screen.getByTestId('conversation-item-ORD-0001'));

    expect(mockPush).toHaveBeenCalledWith('/chat/ORD-0001');
  });

  it('AC6: lista vacía muestra EmptyState', () => {
    setupQuery({ data: { data: [] } });

    render(<ChatListScreen />);

    expect(screen.getByTestId('chat-empty')).toBeTruthy();
  });

  it('AC6: error de primera carga muestra ErrorState y el retry refetchea', () => {
    setupQuery({ isError: true });

    render(<ChatListScreen />);
    expect(screen.getByTestId('chat-error')).toBeTruthy();

    fireEvent.press(screen.getByTestId('chat-error-retry'));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('M5.1: sin sesión redirige a login y no consulta conversaciones', () => {
    mockIsAuthenticated = false;
    setupQuery({ data: { data: [] } });

    render(<ChatListScreen />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)/login' });
    expect(mockGetConversations).not.toHaveBeenCalled();
  });

  it('M5.1: durante la hidratación no renderiza la lista', () => {
    mockIsHydrated = false;
    setupQuery({ data: { data: [makeConversation()] } });

    render(<ChatListScreen />);

    expect(screen.queryByTestId('chat-list')).toBeNull();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
