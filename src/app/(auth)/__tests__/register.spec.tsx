import type React from 'react';
import { AuthError } from '@/core/models/auth';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import RegisterScreen from '../register';

const mockRegister = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (s: { register: (payload: unknown) => Promise<void> }) => unknown) => {
    return selector({ register: mockRegister });
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: mockBack }),
  Redirect: ({ href }: { href: string }) => null,
  Stack: ({ children }: { children?: unknown }) => children as unknown as React.ReactElement,
}));

jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react');
  function mockSafeAreaView(this: unknown, props: { children?: React.ReactNode }) {
    return ReactLib.createElement(ReactLib.Fragment, null, props.children);
  }
  (mockSafeAreaView as unknown as { displayName: string }).displayName = 'SafeAreaView';
  return {
    SafeAreaView: mockSafeAreaView,
    SafeAreaProvider: mockSafeAreaView,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 320, height: 640 }),
    SafeAreaInsetsContext: ReactLib.createContext({ top: 0, right: 0, bottom: 0, left: 0 }),
    SafeAreaFrameContext: ReactLib.createContext({ x: 0, y: 0, width: 320, height: 640 }),
  };
});

describe('RegisterScreen — UX contract (AC10, AC11, AC13)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegister.mockReset();
  });

  it('renders all four fields (name, email, password, confirmation) and submit (AC13)', () => {
    render(<RegisterScreen />);
    expect(screen.getByTestId('register-name')).toBeTruthy();
    expect(screen.getByTestId('register-email')).toBeTruthy();
    expect(screen.getByTestId('register-password')).toBeTruthy();
    expect(screen.getByTestId('register-password-confirmation')).toBeTruthy();
    expect(screen.getByTestId('register-submit')).toBeTruthy();
  });

  it('exposes accessibilityLabel on each input and button (AC13)', () => {
    render(<RegisterScreen />);
    expect(screen.getByTestId('register-name').props.accessibilityLabel).toBe('Nombre');
    expect(screen.getByTestId('register-email').props.accessibilityLabel).toBe('Correo electrónico');
    expect(screen.getByTestId('register-password').props.accessibilityLabel).toBe('Contraseña');
    expect(screen.getByTestId('register-password-confirmation').props.accessibilityLabel).toBe(
      'Confirmar contraseña',
    );
    expect(screen.getByTestId('register-submit').props.accessibilityLabel).toBe('Crear cuenta');
  });

  it('rejects a too-short name with inline error and no API call (AC10)', async () => {
    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByTestId('register-name'), 'a');
    fireEvent.changeText(screen.getByTestId('register-email'), 'user@x.com');
    fireEvent.changeText(screen.getByTestId('register-password'), '12345678');
    fireEvent.changeText(screen.getByTestId('register-password-confirmation'), '12345678');
    fireEvent.press(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('register-name-error').props.children).toBe(
        'El nombre debe tener al menos 2 caracteres',
      );
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('rejects mismatched password confirmation with inline error (AC11)', async () => {
    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByTestId('register-name'), 'Ana');
    fireEvent.changeText(screen.getByTestId('register-email'), 'user@x.com');
    fireEvent.changeText(screen.getByTestId('register-password'), '12345678');
    fireEvent.changeText(screen.getByTestId('register-password-confirmation'), '12345679');
    fireEvent.press(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('register-password-confirmation-error').props.children).toBe(
        'Las contraseñas no coinciden',
      );
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });
});

describe('RegisterScreen — backend error mapping (AC4, AC5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegister.mockReset();
    mockReplace.mockReset();
  });

  it('maps AuthError(VALIDATION_ERROR) with fields to per-field errors (AC5)', async () => {
    mockRegister.mockRejectedValueOnce(
      new AuthError('VALIDATION_ERROR', 'whatever', 422, {
        email: ['El email es obligatorio'],
        password: ['La contraseña es muy corta'],
      }),
    );

    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByTestId('register-name'), 'Ana');
    fireEvent.changeText(screen.getByTestId('register-email'), 'user@x.com');
    fireEvent.changeText(screen.getByTestId('register-password'), '12345678');
    fireEvent.changeText(screen.getByTestId('register-password-confirmation'), '12345678');
    fireEvent.press(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('register-email-error').props.children).toBe(
        'El email es obligatorio',
      );
      expect(screen.getByTestId('register-password-error').props.children).toBe(
        'La contraseña es muy corta',
      );
    });
  });

  it('maps AuthError(RATE_LIMITED) to es-MX global message (no field errors)', async () => {
    mockRegister.mockRejectedValueOnce(new AuthError('RATE_LIMITED', 'whatever', 429));

    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByTestId('register-name'), 'Ana');
    fireEvent.changeText(screen.getByTestId('register-email'), 'user@x.com');
    fireEvent.changeText(screen.getByTestId('register-password'), '12345678');
    fireEvent.changeText(screen.getByTestId('register-password-confirmation'), '12345678');
    fireEvent.press(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('register-form-error').props.children).toBe(
        'Demasiados intentos. Intenta de nuevo en unos minutos.',
      );
    });
    expect(screen.queryByTestId('register-name-error')).toBeNull();
  });
});

describe('RegisterScreen — happy path (AC12)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegister.mockReset();
    mockReplace.mockReset();
  });

  it('navigates to /\\(tabs\\) on success and shows no error message', async () => {
    mockRegister.mockResolvedValueOnce(undefined);

    render(<RegisterScreen />);
    fireEvent.changeText(screen.getByTestId('register-name'), 'Ana');
    fireEvent.changeText(screen.getByTestId('register-email'), 'user@x.com');
    fireEvent.changeText(screen.getByTestId('register-password'), '12345678');
    fireEvent.changeText(screen.getByTestId('register-password-confirmation'), '12345678');
    fireEvent.press(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
    expect(screen.queryByTestId('register-form-error')).toBeNull();
    expect(mockRegister).toHaveBeenCalledWith({
      name: 'Ana',
      email: 'user@x.com',
      password: '12345678',
      password_confirmation: '12345678',
    });
  });
});
