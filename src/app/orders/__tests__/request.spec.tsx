import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import RequestReturnScreen from '../request';

import type { ReturnSubmission } from '@/stores/order-store';

const mockSubmitReturn = jest.fn().mockResolvedValue(true);
const mockSubmitCancellation = jest.fn().mockResolvedValue(true);
const mockResetReturn = jest.fn();
const mockResetCancellation = jest.fn();
const mockBack = jest.fn();
const mockRedirect = jest.fn();

let mockIsAuthenticated = true;
let mockParams: Record<string, string> = { orderNumber: 'ORD-0001', type: 'return' };
let mockReturnSubmission: ReturnSubmission;
let mockCancellationSubmission: ReturnSubmission;

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (
    selector: (s: { isHydrated: boolean; token: string | null; user: unknown }) => unknown,
  ) =>
    selector({
      isHydrated: true,
      token: mockIsAuthenticated ? 'mock-token' : null,
      user: mockIsAuthenticated ? { id: 1, name: 'Juan' } : null,
    }),
  isAuthenticated: (s: { token: string | null; user: unknown }) => !!s.token && !!s.user,
}));

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react');
  const MockStack = (props: { children?: unknown }) =>
    ReactLib.createElement(ReactLib.Fragment, null, props.children);
  MockStack.displayName = 'Stack';
  const MockStackScreen = () => null;
  MockStackScreen.displayName = 'StackScreen';
  (MockStack as unknown as Record<string, unknown>).Screen = MockStackScreen;
  return {
    Stack: MockStack,
    Redirect: (props: { href: string }) => {
      mockRedirect(props);
      return null;
    },
    router: { back: (...args: unknown[]) => mockBack(...args), push: jest.fn(), replace: jest.fn() },
    useLocalSearchParams: () => mockParams,
  };
});

jest.mock('@/stores/order-store', () => ({
  useOrderStore: (
    selector: (s: {
      returnSubmission: ReturnSubmission;
      cancellationSubmission: ReturnSubmission;
      submitReturn: (orderNumber: string, input: unknown) => Promise<boolean>;
      submitCancellation: (orderNumber: string, input: unknown) => Promise<boolean>;
      resetReturnSubmission: () => void;
      resetCancellationSubmission: () => void;
    }) => unknown,
  ) =>
    selector({
      returnSubmission: mockReturnSubmission,
      cancellationSubmission: mockCancellationSubmission,
      submitReturn: mockSubmitReturn,
      submitCancellation: mockSubmitCancellation,
      resetReturnSubmission: mockResetReturn,
      resetCancellationSubmission: mockResetCancellation,
    }),
}));

const IDLE: ReturnSubmission = { status: 'idle', error: null, message: null, applied: false };

describe('RequestReturnScreen — devolución/cancelación (M4.2 AC1, AC3, AC4, AC6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = true;
    mockParams = { orderNumber: 'ORD-0001', type: 'return' };
    mockReturnSubmission = { ...IDLE };
    mockCancellationSubmission = { ...IDLE };
  });

  it('AC3: motivo vacío muestra validación y NO llama al service', () => {
    render(<RequestReturnScreen />);

    fireEvent.press(screen.getByTestId('request-submit'));

    expect(mockSubmitReturn).not.toHaveBeenCalled();
    expect(screen.getByTestId('request-reason-error')).toBeTruthy();
  });

  it('AC3: con motivo llama submitReturn con los valores recortados', () => {
    render(<RequestReturnScreen />);

    fireEvent.changeText(screen.getByTestId('request-reason'), '  Producto dañado  ');
    fireEvent.changeText(screen.getByTestId('request-description'), '  Llegó roto  ');
    fireEvent.press(screen.getByTestId('request-submit'));

    expect(mockSubmitReturn).toHaveBeenCalledWith('ORD-0001', {
      reason: 'Producto dañado',
      description: 'Llegó roto',
    });
  });

  it('AC1: en type=cancellation llama submitCancellation y muestra applied', () => {
    mockParams = { orderNumber: 'ORD-0002', type: 'cancellation' };
    render(<RequestReturnScreen />);

    fireEvent.changeText(screen.getByTestId('request-reason'), 'Ya no lo quiero');
    fireEvent.press(screen.getByTestId('request-submit'));

    expect(mockSubmitCancellation).toHaveBeenCalledWith('ORD-0002', {
      reason: 'Ya no lo quiero',
    });
  });

  it('AC1: applied=true muestra "Pedido cancelado"', () => {
    mockParams = { orderNumber: 'ORD-0002', type: 'cancellation' };
    mockCancellationSubmission = {
      status: 'success',
      error: null,
      message: 'Pedido cancelado',
      applied: true,
    };

    render(<RequestReturnScreen />);

    expect(screen.getByTestId('request-success').props.children).toBe('Pedido cancelado');
  });

  it('AC5/return: success muestra el mensaje del backend', () => {
    mockReturnSubmission = {
      status: 'success',
      error: null,
      message: 'Solicitud de devolución registrada',
      applied: false,
    };

    render(<RequestReturnScreen />);

    expect(screen.getByTestId('request-success').props.children).toBe(
      'Solicitud de devolución registrada',
    );
  });

  it('AC4: estado error muestra el mensaje y no muestra éxito', () => {
    mockReturnSubmission = {
      status: 'error',
      error: 'Este pedido no admite devolución en su estado actual.',
      message: null,
      applied: false,
    };

    render(<RequestReturnScreen />);

    expect(screen.getByTestId('request-error').props.children).toBe(
      'Este pedido no admite devolución en su estado actual.',
    );
    expect(screen.queryByTestId('request-success')).toBeNull();
  });

  it('AC6: con submit en curso el botón queda deshabilitado y no reenvía', () => {
    mockReturnSubmission = { status: 'submitting', error: null, message: null, applied: false };

    render(<RequestReturnScreen />);

    const button = screen.getByTestId('request-submit');
    expect(button.props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(button);
    expect(mockSubmitReturn).not.toHaveBeenCalled();
  });

  it('M4.2: sin sesión redirige a login', () => {
    mockIsAuthenticated = false;

    render(<RequestReturnScreen />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)/login' });
  });

  it('T2: orderNumber vacío muestra estado inválido y no el formulario', () => {
    mockParams = { type: 'return' };

    render(<RequestReturnScreen />);

    expect(screen.getByTestId('request-invalid-title').props.children).toBe('Enlace inválido');
    expect(screen.queryByTestId('request-submit')).toBeNull();
    expect(mockSubmitReturn).not.toHaveBeenCalled();
  });

  it('T2: type inválido muestra estado inválido y no el formulario', () => {
    mockParams = { orderNumber: 'ORD-0001', type: 'bogus' };

    render(<RequestReturnScreen />);

    expect(screen.getByTestId('request-invalid')).toBeTruthy();
    expect(screen.queryByTestId('request-submit')).toBeNull();
  });

  it('T2: type ausente muestra estado inválido y no el formulario', () => {
    mockParams = { orderNumber: 'ORD-0001' };

    render(<RequestReturnScreen />);

    expect(screen.getByTestId('request-invalid')).toBeTruthy();
    expect(screen.queryByTestId('request-submit')).toBeNull();
  });

  it('T2: type válido + orderNumber renderiza el formulario', () => {
    mockParams = { orderNumber: 'ORD-0009', type: 'cancellation' };

    render(<RequestReturnScreen />);

    expect(screen.queryByTestId('request-invalid')).toBeNull();
    expect(screen.getByTestId('request-submit')).toBeTruthy();
  });

  it('T2: el authGuard tiene prioridad sobre el enlace inválido', () => {
    mockIsAuthenticated = false;
    mockParams = { type: 'return' };

    render(<RequestReturnScreen />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)/login' });
    expect(screen.queryByTestId('request-invalid')).toBeNull();
  });
});
