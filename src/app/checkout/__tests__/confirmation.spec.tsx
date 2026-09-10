import { render, screen } from '@testing-library/react-native';
import React from 'react';

import type { RequestOrdersResult, RequestedOrder } from '@/core/models/checkout.model';
import type { CheckoutSubmission } from '@/stores/checkout-store';

import ConfirmationScreen from '../confirmation';

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  router: { replace: mockReplace, push: jest.fn(), back: jest.fn() },
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
}));

let mockSubmission: CheckoutSubmission;

jest.mock('@/stores/checkout-store', () => ({
  useCheckoutStore: (selector: (s: { submission: CheckoutSubmission }) => unknown) =>
    selector({ submission: mockSubmission }),
}));

const order: RequestedOrder = {
  orderNumber: 'ORD-1',
  supplierId: 1,
  status: 'pending',
  paymentStatus: 'pending',
  total: 259,
};

const guestResult: RequestOrdersResult = {
  message: 'Pedidos solicitados.',
  purchaseNumber: 'PUR-1',
  accessToken: 'guest-token-123',
  orders: [order],
};

const authResult: RequestOrdersResult = {
  ...guestResult,
  accessToken: null,
};

describe('ConfirmationScreen — checkout M3.3', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmission = { status: 'success', error: null, result: guestResult };
  });

  it('muestra el purchase_number y los pedidos creados', () => {
    render(<ConfirmationScreen />);

    expect(screen.getByTestId('confirmation-purchase-number').props.children).toBe('PUR-1');
    expect(screen.getByTestId('confirmation-order-ORD-1')).toBeTruthy();
  });

  it('AC5: guest muestra el aviso del token de acceso', () => {
    render(<ConfirmationScreen />);

    expect(screen.getByTestId('confirmation-access-token-notice')).toBeTruthy();
  });

  it('usuario autenticado no muestra el aviso de token de acceso', () => {
    mockSubmission = { status: 'success', error: null, result: authResult };
    render(<ConfirmationScreen />);

    expect(screen.queryByTestId('confirmation-access-token-notice')).toBeNull();
  });

  it('sin resultado de compra muestra estado vacío', () => {
    mockSubmission = { status: 'idle', error: null, result: null };
    render(<ConfirmationScreen />);

    expect(screen.getByTestId('confirmation-empty')).toBeTruthy();
    expect(screen.queryByTestId('confirmation-purchase-number')).toBeNull();
  });
});
