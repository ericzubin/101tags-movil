import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import type { AppNotification } from '@/core/models/notification.model';

import NotificationsScreen from '../notifications';

const mockPush = jest.fn();
const mockRedirect = jest.fn();
const mockFetchNotifications = jest.fn().mockResolvedValue(undefined);
const mockMarkRead = jest.fn().mockResolvedValue(undefined);
const mockMarkAllRead = jest.fn().mockResolvedValue(undefined);

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
  };
});

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  fetchNotifications: jest.Mock;
  markRead: jest.Mock;
  markAllRead: jest.Mock;
}

let mockState: NotificationState;

jest.mock('@/stores/notification-store', () => ({
  useNotificationStore: (selector: (s: NotificationState) => unknown) => selector(mockState),
}));

function makeNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 1,
    type: 'order_confirmed',
    title: 'Pedido confirmado',
    body: 'Tu pedido ORD-0001 fue registrado.',
    link: '/cuenta?pedido=ORD-0001',
    read: false,
    createdAt: '2026-09-11T10:00:00Z',
    ...overrides,
  };
}

describe('NotificationsScreen — notificaciones in-app (M5.3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = true;
    mockIsHydrated = true;
    mockState = {
      notifications: [],
      unreadCount: 0,
      status: 'idle',
      error: null,
      fetchNotifications: mockFetchNotifications,
      markRead: mockMarkRead,
      markAllRead: mockMarkAllRead,
    };
  });

  it('AC1: al montar dispara fetchNotifications() una vez', () => {
    render(<NotificationsScreen />);
    expect(mockFetchNotifications).toHaveBeenCalledTimes(1);
  });

  it('AC1: muestra título y body de cada notificación', () => {
    mockState.notifications = [makeNotification()];
    mockState.unreadCount = 1;

    render(<NotificationsScreen />);

    expect(screen.getByText('Pedido confirmado')).toBeTruthy();
    expect(screen.getByText('Tu pedido ORD-0001 fue registrado.')).toBeTruthy();
  });

  it('AC2/AC6: la notificación no leída se resalta (dot) y la leída no', () => {
    mockState.notifications = [
      makeNotification({ id: 1, read: false }),
      makeNotification({ id: 2, read: true }),
    ];

    render(<NotificationsScreen />);

    expect(screen.getByTestId('notification-unread-1')).toBeTruthy();
    expect(screen.queryByTestId('notification-unread-2')).toBeNull();
  });

  it('AC6: tocar con link web de pedido marca leída y navega al detalle', () => {
    mockState.notifications = [makeNotification({ id: 1, link: '/cuenta?pedido=ORD-0001' })];

    render(<NotificationsScreen />);
    fireEvent.press(screen.getByTestId('notification-item-1'));

    expect(mockMarkRead).toHaveBeenCalledWith(1);
    expect(mockPush).toHaveBeenCalledWith('/orders/ORD-0001');
  });

  it('AC6 (#28): tocar con link de chat navega a la conversación', () => {
    mockState.notifications = [
      makeNotification({ id: 2, link: '/cuenta?pedido=ORD-0001&chat=1' }),
    ];

    render(<NotificationsScreen />);
    fireEvent.press(screen.getByTestId('notification-item-2'));

    expect(mockMarkRead).toHaveBeenCalledWith(2);
    expect(mockPush).toHaveBeenCalledWith('/chat/ORD-0001');
  });

  it('AC6 (#28): un link de proveedor marca leída pero no navega', () => {
    mockState.notifications = [
      makeNotification({ id: 4, link: '/proveedores/pedidos?estado=nuevo' }),
    ];

    render(<NotificationsScreen />);
    fireEvent.press(screen.getByTestId('notification-item-4'));

    expect(mockMarkRead).toHaveBeenCalledWith(4);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('AC6: tocar sin link solo marca leída, no navega', () => {
    mockState.notifications = [makeNotification({ id: 3, link: null })];

    render(<NotificationsScreen />);
    fireEvent.press(screen.getByTestId('notification-item-3'));

    expect(mockMarkRead).toHaveBeenCalledWith(3);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('AC3: "Marcar todas" llama markAllRead()', () => {
    mockState.notifications = [makeNotification()];
    mockState.unreadCount = 1;

    render(<NotificationsScreen />);
    fireEvent.press(screen.getByTestId('notifications-mark-all'));

    expect(mockMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it('AC5: lista vacía muestra EmptyState', () => {
    render(<NotificationsScreen />);
    expect(screen.getByTestId('notifications-empty')).toBeTruthy();
  });

  it('AC5: error muestra ErrorState y el retry vuelve a pedir las notificaciones', () => {
    mockState.status = 'error';
    mockState.error = 'boom';

    render(<NotificationsScreen />);

    expect(screen.getByTestId('notifications-error')).toBeTruthy();
    fireEvent.press(screen.getByTestId('notifications-error-retry'));

    expect(mockFetchNotifications).toHaveBeenCalledTimes(2);
  });

  it('AC5: status loading muestra el skeleton', () => {
    mockState.status = 'loading';

    render(<NotificationsScreen />);

    expect(screen.getByTestId('notifications-skeleton')).toBeTruthy();
  });

  it('M5.3: sin sesión redirige a login y no consulta notificaciones', () => {
    mockIsAuthenticated = false;

    render(<NotificationsScreen />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)/login' });
    expect(mockFetchNotifications).not.toHaveBeenCalled();
  });

  it('M5.3: durante la hidratación no renderiza la lista', () => {
    mockIsHydrated = false;

    render(<NotificationsScreen />);

    expect(screen.queryByTestId('notifications-list')).toBeNull();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
