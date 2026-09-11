import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import AccountTab from '../account';

const mockLogout = jest.fn().mockResolvedValue({ message: 'Logged out' });
const mockClearSession = jest.fn().mockResolvedValue(undefined);
const mockReplaceRouter = jest.fn();
const mockPushRouter = jest.fn();
const mockBackRouter = jest.fn();
const mockFetchNotifications = jest.fn().mockResolvedValue(undefined);
let mockUnreadCount = 0;

jest.mock('@/core/services/auth-service', () => ({
  authService: {
    logout: () => mockLogout(),
  },
}));

jest.mock('@/stores/notification-store', () => ({
  useNotificationStore: (
    selector: (s: { unreadCount: number; fetchNotifications: jest.Mock }) => unknown,
  ) => selector({ unreadCount: mockUnreadCount, fetchNotifications: mockFetchNotifications }),
}));

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (
    selector: (s: {
      user: { id: string; name: string; email: string; phone: string; role: string };
      clearSession: () => Promise<void>;
    }) => unknown,
  ) => {
    const state = {
      user: { id: '1', name: 'Juan', email: 'j@test.com', phone: '', role: 'customer' },
      clearSession: mockClearSession,
    };
    return selector(state);
  },
}));

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPushRouter(...args),
    replace: (...args: unknown[]) => mockReplaceRouter(...args),
    back: (...args: unknown[]) => mockBackRouter(...args),
  },
  Redirect: ({ href }: { href: string }) => null,
}));

describe('AccountTab — placeholder + logout (M1.10 AC6, AC7)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogout.mockReset();
    mockClearSession.mockReset();
    mockReplaceRouter.mockReset();
    mockLogout.mockResolvedValue({ message: 'Logged out' });
    mockClearSession.mockResolvedValue(undefined);
    mockUnreadCount = 0;
  });

  it('AC6: renders "Mi cuenta" title and user name when session present', () => {
    render(<AccountTab />);
    expect(screen.getByText('Mi cuenta')).toBeTruthy();
    expect(screen.getByText('Juan')).toBeTruthy();
  });

  it('AC6: renders the "Cerrar sesión" button', () => {
    render(<AccountTab />);
    expect(screen.getByTestId('account-logout')).toBeTruthy();
    expect(screen.getByText('Cerrar sesión')).toBeTruthy();
  });

  it('AC7: clicking logout calls authService.logout + clearSession + router.replace', async () => {
    render(<AccountTab />);
    fireEvent.press(screen.getByTestId('account-logout'));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(mockClearSession).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(mockReplaceRouter).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('M6.1: muestra "Mi perfil" y navega a /profile', () => {
    render(<AccountTab />);

    expect(screen.getByText('Mi perfil')).toBeTruthy();

    fireEvent.press(screen.getByTestId('account-profile'));

    expect(mockPushRouter).toHaveBeenCalledWith('/profile');
  });

  it('M6.2: muestra "Mis cupones" y navega a /coupons', () => {
    render(<AccountTab />);

    expect(screen.getByText('Mis cupones')).toBeTruthy();

    fireEvent.press(screen.getByTestId('account-coupons'));

    expect(mockPushRouter).toHaveBeenCalledWith('/coupons');
  });

  it('M6.3: muestra "Ayuda" y navega a /legal/help', () => {
    render(<AccountTab />);

    expect(screen.getByText('Ayuda')).toBeTruthy();

    fireEvent.press(screen.getByTestId('account-help'));

    expect(mockPushRouter).toHaveBeenCalledWith('/legal/help');
  });

  it('M6.3: muestra "Términos y privacidad" y navega a /legal/terms', () => {
    render(<AccountTab />);

    expect(screen.getByText('Términos y privacidad')).toBeTruthy();

    fireEvent.press(screen.getByTestId('account-legal'));

    expect(mockPushRouter).toHaveBeenCalledWith('/legal/terms');
  });

  it('M4.1: muestra "Mis pedidos" y navega a /orders', () => {
    render(<AccountTab />);

    expect(screen.getByText('Mis pedidos')).toBeTruthy();

    fireEvent.press(screen.getByTestId('account-orders'));

    expect(mockPushRouter).toHaveBeenCalledWith('/orders');
  });

  it('M4.2: muestra "Mis devoluciones" y navega a /returns', () => {
    render(<AccountTab />);

    expect(screen.getByText('Mis devoluciones')).toBeTruthy();

    fireEvent.press(screen.getByTestId('account-returns'));

    expect(mockPushRouter).toHaveBeenCalledWith('/returns');
  });

  it('M5.1: muestra "Mensajes" y navega a /chat', () => {
    render(<AccountTab />);

    expect(screen.getByText('Mensajes')).toBeTruthy();

    fireEvent.press(screen.getByTestId('account-chat'));

    expect(mockPushRouter).toHaveBeenCalledWith('/chat');
  });

  it('M5.3: muestra "Notificaciones", navega a /notifications y dispara fetch', () => {
    render(<AccountTab />);

    expect(screen.getByText('Notificaciones')).toBeTruthy();

    fireEvent.press(screen.getByTestId('account-notifications'));

    expect(mockPushRouter).toHaveBeenCalledWith('/notifications');
    expect(mockFetchNotifications).toHaveBeenCalledTimes(1);
  });

  it('M5.3: muestra badge con unreadCount > 0 y lo oculta en 0', () => {
    mockUnreadCount = 2;
    const { rerender } = render(<AccountTab />);
    expect(screen.getByTestId('account-notifications-badge')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();

    mockUnreadCount = 0;
    rerender(<AccountTab />);
    expect(screen.queryByTestId('account-notifications-badge')).toBeNull();
  });
});
