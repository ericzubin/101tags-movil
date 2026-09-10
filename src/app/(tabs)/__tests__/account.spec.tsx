import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import AccountTab from '../account';

const mockLogout = jest.fn().mockResolvedValue({ message: 'Logged out' });
const mockClearSession = jest.fn().mockResolvedValue(undefined);
const mockReplaceRouter = jest.fn();
const mockPushRouter = jest.fn();
const mockBackRouter = jest.fn();

jest.mock('@/core/services/auth-service', () => ({
  authService: {
    logout: () => mockLogout(),
  },
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
});
