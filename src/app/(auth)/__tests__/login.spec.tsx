import type React from 'react';
import { AuthError } from '@/core/models/auth';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import LoginScreen from '../login';

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react');
  function mockSafeAreaView(this: unknown, props: { children?: React.ReactNode }) {
    return ReactLib.createElement(ReactLib.Fragment, null, props.children);
  }
  (mockSafeAreaView as unknown as { displayName: string }).displayName = 'SafeAreaView';
  function mockSafeAreaProvider(this: unknown, props: { children?: React.ReactNode }) {
    return ReactLib.createElement(ReactLib.Fragment, null, props.children);
  }
  (mockSafeAreaProvider as unknown as { displayName: string }).displayName = 'SafeAreaProvider';
  return {
    SafeAreaView: mockSafeAreaView,
    SafeAreaProvider: mockSafeAreaProvider,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 320, height: 640 }),
    SafeAreaInsetsContext: ReactLib.createContext({ top: 0, right: 0, bottom: 0, left: 0 }),
    SafeAreaFrameContext: ReactLib.createContext({ x: 0, y: 0, width: 320, height: 640 }),
  };
});

const mockLogin = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (s: { login: () => Promise<void> }) => unknown) => {
    return selector({ login: mockLogin });
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: mockBack }),
  Redirect: ({ href }: { href: string }) => null,
  Stack: ({ children }: { children?: unknown }) => children as unknown as React.ReactElement,
}));

describe('LoginScreen — UX contract (AC1, AC2, AC3, AC13)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockReset();
  });

  it('renders email + password inputs and the Entrar button (AC13)', () => {
    render(<LoginScreen />);
    expect(screen.getByTestId('login-email')).toBeTruthy();
    expect(screen.getByTestId('login-password')).toBeTruthy();
    expect(screen.getByTestId('login-submit')).toBeTruthy();
  });

  it('exposes accessibilityLabel + accessibilityState on inputs and button (AC13)', () => {
    render(<LoginScreen />);
    const email = screen.getByTestId('login-email');
    expect(email.props.accessibilityLabel).toBe('Correo electrónico');
    const password = screen.getByTestId('login-password');
    expect(password.props.accessibilityLabel).toBe('Contraseña');
    const submit = screen.getByTestId('login-submit');
    expect(submit.props.accessibilityLabel).toBe('Iniciar sesión');
    expect(submit.props.accessibilityState).toEqual(
      expect.objectContaining({ busy: false, disabled: false }),
    );
  });

  it('blocks empty submit and surfaces inline email error without calling login() (AC1)', async () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByTestId('login-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('login-email-error')).toBeTruthy();
    });
    expect(screen.getByTestId('login-email-error').props.children).toBe('El correo es obligatorio');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('blocks malformed email submit with inline message, no API call (AC2)', async () => {
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId('login-email'), 'no-es-email');
    fireEvent.changeText(screen.getByTestId('login-password'), '12345678');
    fireEvent.press(screen.getByTestId('login-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('login-email-error').props.children).toBe('Ingresa un correo válido');
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('blocks short password submit with inline message, no API call (AC3)', async () => {
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId('login-email'), 'user@x.com');
    fireEvent.changeText(screen.getByTestId('login-password'), '123');
    fireEvent.press(screen.getByTestId('login-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('login-password-error').props.children).toBe(
        'La contraseña debe tener al menos 8 caracteres',
      );
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });
});

describe('LoginScreen — backend error mapping (AC4, AC5, AC6, AC7)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockReset();
    mockReplace.mockReset();
  });

  it('maps AuthError(INVALID_CREDENTIALS) to es-MX global message (AC4)', async () => {
    mockLogin.mockRejectedValueOnce(new AuthError('INVALID_CREDENTIALS', 'whatever', 401));

    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId('login-email'), 'user@x.com');
    fireEvent.changeText(screen.getByTestId('login-password'), '12345678');
    fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('login-form-error').props.children).toBe(
        'Correo o contraseña incorrectos.',
      );
    });
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith('user@x.com', '12345678');
  });

  it('maps AuthError(VALIDATION_ERROR) with fields to per-field errors (AC5)', async () => {
    mockLogin.mockRejectedValueOnce(
      new AuthError('VALIDATION_ERROR', 'whatever', 422, {
        email: ['El email es obligatorio'],
        password: ['La contraseña es muy corta'],
      }),
    );

    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId('login-email'), 'user@x.com');
    fireEvent.changeText(screen.getByTestId('login-password'), '12345678');
    fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('login-email-error').props.children).toBe('El email es obligatorio');
      expect(screen.getByTestId('login-password-error').props.children).toBe('La contraseña es muy corta');
    });
  });

  it('maps AuthError(RATE_LIMITED) to es-MX global message, no field errors (AC6)', async () => {
    mockLogin.mockRejectedValueOnce(new AuthError('RATE_LIMITED', 'whatever', 429));

    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId('login-email'), 'user@x.com');
    fireEvent.changeText(screen.getByTestId('login-password'), '12345678');
    fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('login-form-error').props.children).toBe(
        'Demasiados intentos. Intenta de nuevo en unos minutos.',
      );
    });
    expect(screen.queryByTestId('login-email-error')).toBeNull();
    expect(screen.queryByTestId('login-password-error')).toBeNull();
  });

  it('maps AuthError(NETWORK_ERROR) to es-MX global message (AC7)', async () => {
    mockLogin.mockRejectedValueOnce(new AuthError('NETWORK_ERROR', 'whatever', 0));

    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId('login-email'), 'user@x.com');
    fireEvent.changeText(screen.getByTestId('login-password'), '12345678');
    fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('login-form-error').props.children).toBe(
        'Sin conexión. Verifica tu internet.',
      );
    });
  });
});

describe('LoginScreen — happy path (AC12)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockReset();
    mockReplace.mockReset();
  });

  it('navigates to /\\(tabs\\) and never sets the busy state on success', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId('login-email'), 'user@x.com');
    fireEvent.changeText(screen.getByTestId('login-password'), '12345678');
    fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
    expect(screen.queryByTestId('login-form-error')).toBeNull();
  });
});
