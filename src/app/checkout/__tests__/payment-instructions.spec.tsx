import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import type { PaymentInstructionsResult } from '@/core/models/checkout.model';

import PaymentInstructionsScreen from '../payment-instructions';

const mockPush = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  router: { push: mockPush, replace: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => mockParams,
}));

interface MockCheckoutState {
  paymentInstructions: PaymentInstructionsResult | null;
  instructionsStatus: 'idle' | 'loading' | 'ready' | 'error';
  instructionsError: string | null;
  copiedLabel: string | null;
  clipboardError: string | null;
  fetchPaymentInstructions: jest.Mock;
  copyToClipboard: jest.Mock;
}

const mockFetchPaymentInstructions = jest.fn().mockResolvedValue(undefined);
const mockCopyToClipboard = jest.fn().mockResolvedValue(undefined);

let mockState: MockCheckoutState;

jest.mock('@/stores/checkout-store', () => ({
  useCheckoutStore: (selector: (s: MockCheckoutState) => unknown) => selector(mockState),
}));

const oxxo: PaymentInstructionsResult = {
  orderNumber: 'ORD-1',
  paymentStatus: 'pending',
  paymentMethod: 'oxxo',
  total: 259,
  paymentDueAt: '2099-09-14T00:00:00Z',
  paymentInstructions: {
    type: 'supplier_manual',
    method: 'oxxo',
    reference: '1234567890',
    barcodeUrl: 'https://cdn.test/barcode.png',
    amount: 259,
    dueAt: '2099-09-14T00:00:00Z',
  },
  demoMode: false,
};

const spei: PaymentInstructionsResult = {
  orderNumber: 'ORD-2',
  paymentStatus: 'pending',
  paymentMethod: 'spei',
  total: 480,
  paymentDueAt: '2099-09-15T00:00:00Z',
  paymentInstructions: {
    type: 'supplier_manual',
    method: 'spei',
    clabe: '012180000000000000',
    bank: 'BBVA',
    recipientName: 'Tags SA de CV',
    accountHolder: 'Tags SA de CV',
    amount: 480,
    dueAt: '2099-09-15T00:00:00Z',
  },
  demoMode: false,
};

function baseState(overrides: Partial<MockCheckoutState> = {}): MockCheckoutState {
  return {
    paymentInstructions: null,
    instructionsStatus: 'ready',
    instructionsError: null,
    copiedLabel: null,
    clipboardError: null,
    fetchPaymentInstructions: mockFetchPaymentInstructions,
    copyToClipboard: mockCopyToClipboard,
    ...overrides,
  };
}

describe('PaymentInstructionsScreen — M3.4 OXXO/SPEI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { orderNumber: 'ORD-1', email: 'ada@example.com' };
    mockState = baseState({ paymentInstructions: oxxo });
  });

  it('AC1: al montar consulta las instrucciones con orderNumber y email', () => {
    render(<PaymentInstructionsScreen />);

    expect(mockFetchPaymentInstructions).toHaveBeenCalledWith('ORD-1', 'ada@example.com');
  });

  it('AC2: OXXO muestra referencia, código de barras, monto y vencimiento', () => {
    render(<PaymentInstructionsScreen />);

    expect(screen.getByTestId('payment-instructions-reference').props.children).toBe('1234567890');
    expect(screen.getByTestId('payment-instructions-barcode')).toBeTruthy();
    expect(screen.getByTestId('payment-instructions-amount').props.children).toContain('259');
    expect(screen.getByTestId('payment-instructions-due')).toBeTruthy();
  });

  it('AC2: OXXO sin barcode_url no renderiza código de barras', () => {
    mockState = baseState({
      paymentInstructions: {
        ...oxxo,
        paymentInstructions: { ...oxxo.paymentInstructions, barcodeUrl: null },
      },
    });
    render(<PaymentInstructionsScreen />);

    expect(screen.queryByTestId('payment-instructions-barcode')).toBeNull();
    expect(screen.getByTestId('payment-instructions-reference')).toBeTruthy();
  });

  it('AC3: SPEI muestra CLABE, banco, titular, monto y vencimiento', () => {
    mockState = baseState({ paymentInstructions: spei });
    render(<PaymentInstructionsScreen />);

    expect(screen.getByTestId('payment-instructions-clabe').props.children).toBe(
      '012180000000000000',
    );
    expect(screen.getByTestId('payment-instructions-bank').props.children).toBe('BBVA');
    expect(screen.getByTestId('payment-instructions-recipient').props.children).toBe(
      'Tags SA de CV',
    );
    expect(screen.getByTestId('payment-instructions-amount').props.children).toContain('480');
    expect(screen.getByTestId('payment-instructions-due')).toBeTruthy();
  });

  it('AC4: copiar la referencia usa copyToClipboard con el valor correcto', () => {
    render(<PaymentInstructionsScreen />);

    fireEvent.press(screen.getByTestId('payment-instructions-copy-reference'));

    expect(mockCopyToClipboard).toHaveBeenCalledWith('Referencia', '1234567890');
  });

  it('AC4: copiar la CLABE usa copyToClipboard con el valor correcto', () => {
    mockState = baseState({ paymentInstructions: spei });
    render(<PaymentInstructionsScreen />);

    fireEvent.press(screen.getByTestId('payment-instructions-copy-clabe'));

    expect(mockCopyToClipboard).toHaveBeenCalledWith('CLABE', '012180000000000000');
  });

  it('AC4: muestra confirmación cuando el store registra el copiado', () => {
    mockState = baseState({ paymentInstructions: oxxo, copiedLabel: 'Referencia' });
    render(<PaymentInstructionsScreen />);

    expect(screen.getByTestId('payment-instructions-copied').props.children).toContain(
      'Referencia',
    );
  });

  it('AC4: muestra aviso cuando el portapapeles no está disponible (web)', () => {
    mockState = baseState({ paymentInstructions: oxxo, clipboardError: 'No pudimos copiar.' });
    render(<PaymentInstructionsScreen />);

    expect(screen.getByTestId('payment-instructions-clipboard-error')).toBeTruthy();
  });

  it('AC5: pedido expirado muestra estado vencido y no ofrece comprobante', () => {
    mockState = baseState({
      paymentInstructions: { ...oxxo, paymentStatus: 'expired' },
    });
    render(<PaymentInstructionsScreen />);

    expect(screen.getByTestId('payment-instructions-expired')).toBeTruthy();
    expect(screen.queryByTestId('payment-instructions-proof-cta')).toBeNull();
  });

  it('AC5: pedido con due_at pasado se considera vencido', () => {
    mockState = baseState({
      paymentInstructions: {
        ...oxxo,
        paymentDueAt: '2020-01-01T00:00:00Z',
        paymentInstructions: { ...oxxo.paymentInstructions, dueAt: '2020-01-01T00:00:00Z' },
      },
    });
    render(<PaymentInstructionsScreen />);

    expect(screen.getByTestId('payment-instructions-expired')).toBeTruthy();
    expect(screen.queryByTestId('payment-instructions-proof-cta')).toBeNull();
  });

  it('AC5: pedido pagado muestra estado pagado y no ofrece comprobante', () => {
    mockState = baseState({
      paymentInstructions: { ...oxxo, paymentStatus: 'paid' },
    });
    render(<PaymentInstructionsScreen />);

    expect(screen.getByTestId('payment-instructions-paid')).toBeTruthy();
    expect(screen.queryByTestId('payment-instructions-proof-cta')).toBeNull();
  });

  it('CTA: pedido pendiente vigente ofrece enviar comprobante', () => {
    render(<PaymentInstructionsScreen />);

    fireEvent.press(screen.getByTestId('payment-instructions-proof-cta'));

    expect(mockPush).toHaveBeenCalledWith('/checkout/payment-proof');
  });

  it('AC6: error de red muestra ErrorState y reintenta', () => {
    mockState = baseState({ instructionsStatus: 'error', instructionsError: 'network' });
    render(<PaymentInstructionsScreen />);

    expect(screen.getByTestId('payment-instructions-error')).toBeTruthy();

    fireEvent.press(screen.getByTestId('payment-instructions-error-retry'));

    expect(mockFetchPaymentInstructions).toHaveBeenCalledWith('ORD-1', 'ada@example.com');
  });

  it('muestra estado de carga mientras consulta', () => {
    mockState = baseState({ instructionsStatus: 'loading' });
    render(<PaymentInstructionsScreen />);

    expect(screen.getByTestId('payment-instructions-loading')).toBeTruthy();
  });

  it('sin orderNumber/email no consulta y muestra estado vacío', () => {
    mockParams = {};
    mockState = baseState({ paymentInstructions: null });
    render(<PaymentInstructionsScreen />);

    expect(mockFetchPaymentInstructions).not.toHaveBeenCalled();
    expect(screen.getByTestId('payment-instructions-empty')).toBeTruthy();
  });
});
