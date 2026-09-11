import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert, type AlertButton } from 'react-native';

import { AuthError } from '@/core/models/auth';

import ProfileScreen from '../profile';

const mockRefreshUser = jest.fn();
const mockLogout = jest.fn();
const mockClearSession = jest.fn();
const mockReplaceRouter = jest.fn();
const mockPushRouter = jest.fn();

let mockUser = {
  id: 1,
  name: 'Juan Pérez',
  email: 'j@test.com',
  phone: '+525512345678',
  role: 'customer',
};
const mockToken = 'secret-bearer-token-xyz';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { name: '101tags', version: '1.2.3' } },
}));

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (
    selector: (s: {
      user: typeof mockUser;
      token: string;
      refreshUser: jest.Mock;
      logout: jest.Mock;
      clearSession: jest.Mock;
    }) => unknown,
  ) =>
    selector({
      user: mockUser,
      token: mockToken,
      refreshUser: mockRefreshUser,
      logout: mockLogout,
      clearSession: mockClearSession,
    }),
}));

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPushRouter(...args),
    replace: (...args: unknown[]) => mockReplaceRouter(...args),
    back: jest.fn(),
  },
}));

function confirmFromAlert(): void {
  const alertSpy = Alert.alert as jest.Mock;
  const buttons = alertSpy.mock.calls[0][2] as AlertButton[] | undefined;
  const confirm = buttons?.find((b) => b.style === 'destructive');
  confirm?.onPress?.();
}

function cancelFromAlert(): void {
  const alertSpy = Alert.alert as jest.Mock;
  const buttons = alertSpy.mock.calls[0][2] as AlertButton[] | undefined;
  const cancel = buttons?.find((b) => b.style === 'cancel');
  cancel?.onPress?.();
}

describe('ProfileScreen (M6.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      id: 1,
      name: 'Juan Pérez',
      email: 'j@test.com',
      phone: '+525512345678',
      role: 'customer',
    };
    mockRefreshUser.mockResolvedValue(true);
    mockLogout.mockResolvedValue(undefined);
    mockClearSession.mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  it('AC1: renders name/email/phone/role from the store', () => {
    render(<ProfileScreen />);

    expect(screen.getByText('Juan Pérez')).toBeTruthy();
    expect(screen.getByText('j@test.com')).toBeTruthy();
    expect(screen.getByText('+525512345678')).toBeTruthy();
    expect(screen.getByText('Cliente')).toBeTruthy();
  });

  it('AC1: calls refreshUser once on mount', async () => {
    render(<ProfileScreen />);

    await waitFor(() => {
      expect(mockRefreshUser).toHaveBeenCalledTimes(1);
    });
  });

  it('AC2: shows a non-blocking error and keeps cached user when refresh fails', async () => {
    mockRefreshUser.mockResolvedValue(false);

    render(<ProfileScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('profile-refresh-error')).toBeTruthy();
    });
    expect(screen.getByText('Juan Pérez')).toBeTruthy();
    expect(screen.getByText('j@test.com')).toBeTruthy();
  });

  it('AC2: hides the error when refresh succeeds', async () => {
    mockRefreshUser.mockResolvedValue(true);

    render(<ProfileScreen />);

    await waitFor(() => {
      expect(mockRefreshUser).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByTestId('profile-refresh-error')).toBeNull();
  });

  it('AC5: never renders the bearer token', () => {
    render(<ProfileScreen />);

    expect(screen.queryByText(/secret-bearer-token/)).toBeNull();
  });

  it('renders the app version from expo-constants', () => {
    render(<ProfileScreen />);

    expect(screen.getByText('1.2.3')).toBeTruthy();
  });

  it('AC3: requires confirmation before logging out', async () => {
    render(<ProfileScreen />);

    fireEvent.press(screen.getByTestId('profile-logout'));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('AC3: confirming logout calls store logout + clearSession and redirects to login', async () => {
    render(<ProfileScreen />);

    fireEvent.press(screen.getByTestId('profile-logout'));
    confirmFromAlert();

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(mockReplaceRouter).toHaveBeenCalledWith('/(auth)/login');
    });
  });

  it('AC3: cancelling logout does not sign out', () => {
    render(<ProfileScreen />);

    fireEvent.press(screen.getByTestId('profile-logout'));
    cancelFromAlert();

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockReplaceRouter).not.toHaveBeenCalled();
  });

  it('AC4: still clears local session and redirects when logout rejects', async () => {
    mockLogout.mockRejectedValueOnce(new AuthError('NETWORK_ERROR', 'offline', 0));

    render(<ProfileScreen />);

    fireEvent.press(screen.getByTestId('profile-logout'));
    confirmFromAlert();

    await waitFor(() => {
      expect(mockClearSession).toHaveBeenCalledTimes(1);
    });
    expect(mockReplaceRouter).toHaveBeenCalledWith('/(auth)/login');
  });

  it('links to terms, privacy and help routes', () => {
    render(<ProfileScreen />);

    fireEvent.press(screen.getByTestId('profile-legal-terms'));
    expect(mockPushRouter).toHaveBeenCalledWith('/legal/terms');

    fireEvent.press(screen.getByTestId('profile-legal-privacy'));
    expect(mockPushRouter).toHaveBeenCalledWith('/legal/privacy');

    fireEvent.press(screen.getByTestId('profile-legal-help'));
    expect(mockPushRouter).toHaveBeenCalledWith('/legal/help');
  });
});
