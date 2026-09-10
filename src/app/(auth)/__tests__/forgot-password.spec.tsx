import type React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import ForgotPasswordScreen from '../forgot-password';

const mockForgotPassword = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('@/core/services/auth-service', () => ({
  authService: {
    forgotPassword: (...args: unknown[]) => mockForgotPassword(...args),
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
    SafeAreaFrameContext: ReactLib.createContext({ top: 0, y: 0, width: 320, height: 640 }),
  };
});

describe('ForgotPasswordScreen — render & validation (AC1, AC2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockForgotPassword.mockReset();
    mockReplace.mockReset();
    mockBack.mockReset();
  });

  it('AC1: renderiza email input, submit, back y NO muestra éxito/error inicialmente', () => {
    render(<ForgotPasswordScreen />);
    expect(screen.getByTestId('forgot-email-input')).toBeTruthy();
    expect(screen.getByTestId('forgot-submit')).toBeTruthy();
    expect(screen.getByTestId('forgot-back')).toBeTruthy();
    expect(screen.queryByText(/Revisa tu correo/i)).toBeNull();
    expect(screen.queryByText(/Ingresa un correo electr/i)).toBeNull();
    expect(screen.queryByText(/No pudimos enviar/i)).toBeNull();
  });

  it('AC2: email inválido → muestra error inline y NO llama authService.forgotPassword', async () => {
    render(<ForgotPasswordScreen />);
    fireEvent.changeText(screen.getByTestId('forgot-email-input'), 'no-es-email');
    fireEvent.press(screen.getByTestId('forgot-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('forgot-error').props.children).toBe(
        'Ingresa un correo electrónico válido.',
      );
    });
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });
});

describe('ForgotPasswordScreen — happy path & anti-enumeración (AC3, AC4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockForgotPassword.mockReset();
    mockReplace.mockReset();
    mockBack.mockReset();
  });

  it('AC3: submit OK → llama authService.forgotPassword y muestra mensaje genérico + botón volver', async () => {
    mockForgotPassword.mockResolvedValueOnce({
      message: 'Si el correo está registrado, recibirás instrucciones...',
    });

    render(<ForgotPasswordScreen />);
    fireEvent.changeText(screen.getByTestId('forgot-email-input'), 'existente@ejemplo.com');
    fireEvent.press(screen.getByTestId('forgot-submit'));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('existente@ejemplo.com');
    });
    await waitFor(() => {
      expect(screen.getByText(/Revisa tu correo/i)).toBeTruthy();
      expect(screen.getByText(/Si el correo está registrado/i)).toBeTruthy();
      expect(screen.getByTestId('forgot-back-to-login')).toBeTruthy();
    });
  });

  it('AC4: email "no existe" muestra MISMO mensaje genérico (anti-enumeración)', async () => {
    mockForgotPassword.mockResolvedValueOnce({
      message: 'Si el correo está registrado, recibirás instrucciones...',
    });

    render(<ForgotPasswordScreen />);
    fireEvent.changeText(screen.getByTestId('forgot-email-input'), 'no-existe@ejemplo.com');
    fireEvent.press(screen.getByTestId('forgot-submit'));

    await waitFor(() => {
      expect(screen.getByText(/Revisa tu correo/i)).toBeTruthy();
    });
    expect(screen.queryByText(/no está registrado/i)).toBeNull();
    expect(screen.queryByText(/no encontrado/i)).toBeNull();
  });
});

describe('ForgotPasswordScreen — errores (AC5, AC6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockForgotPassword.mockReset();
    mockReplace.mockReset();
    mockBack.mockReset();
  });

  it('AC5: error de red → muestra mensaje error y NO muestra éxito', async () => {
    mockForgotPassword.mockRejectedValueOnce(new Error('Network failed'));

    render(<ForgotPasswordScreen />);
    fireEvent.changeText(screen.getByTestId('forgot-email-input'), 'test@ejemplo.com');
    fireEvent.press(screen.getByTestId('forgot-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('forgot-error').props.children).toBe(
        'No pudimos enviar el correo. Revisa tu conexión e inténtalo de nuevo.',
      );
    });
    expect(screen.queryByText(/Revisa tu correo/i)).toBeNull();
  });

  it('AC6: loading state — input no editable durante submit', async () => {
    let resolveForgot: (value: unknown) => void = () => {};
    mockForgotPassword.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveForgot = resolve;
      }),
    );

    render(<ForgotPasswordScreen />);
    fireEvent.changeText(screen.getByTestId('forgot-email-input'), 'test@ejemplo.com');
    fireEvent.press(screen.getByTestId('forgot-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('forgot-email-input').props.editable).toBe(false);
      expect(screen.getByTestId('forgot-submit').props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true }),
      );
    });
    resolveForgot({ message: 'OK' });
  });
});

describe('ForgotPasswordScreen — navegación (AC7, AC8)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockForgotPassword.mockReset();
    mockReplace.mockReset();
    mockBack.mockReset();
  });

  it('AC7: back en form llama router.back', () => {
    render(<ForgotPasswordScreen />);
    fireEvent.press(screen.getByTestId('forgot-back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('AC8: post-success "Volver a iniciar sesión" navega con router.replace a /\\(auth\\)/login', async () => {
    mockForgotPassword.mockResolvedValueOnce({ message: 'OK' });

    render(<ForgotPasswordScreen />);
    fireEvent.changeText(screen.getByTestId('forgot-email-input'), 'test@ejemplo.com');
    fireEvent.press(screen.getByTestId('forgot-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('forgot-back-to-login')).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId('forgot-back-to-login'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });
});
