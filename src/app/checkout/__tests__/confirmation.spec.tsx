import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import type { RequestOrdersResult, RequestedOrder } from '@/core/models/checkout.model';
import type { CheckoutSubmission } from '@/stores/checkout-store';

import ConfirmationScreen from '../confirmation';

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { replace: mockReplace, push: mockPush, back: jest.fn() },
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: jest.fn() }),
}));

let mockSubmission: CheckoutSubmission;
let mockEmail: string | null;

jest.mock('@/stores/checkout-store', () => ({
  useCheckoutStore: (
    selector: (s: { submission: CheckoutSubmission; lastCustomerEmail: string | null }) => unknown,
  ) => selector({ submission: mockSubmission, lastCustomerEmail: mockEmail }),
}));

const order: RequestedOrder = {
  orderNumber: 'ORD-1',
  supplierId: 1,
  status: 'pending',
  paymentStatus: 'pending',
  total: 259,
};

const oxxoOrder: RequestedOrder = { ...order, paymentMethod: 'oxxo' };

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
    mockEmail = 'ada@example.com';
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

  it('M3.4: pedido OXXO ofrece ver instrucciones y navega con orderNumber/email', () => {
    mockSubmission = {
      status: 'success',
      error: null,
      result: { ...guestResult, orders: [oxxoOrder] },
    };
    render(<ConfirmationScreen />);

    fireEvent.press(screen.getByTestId('confirmation-instructions-ORD-1'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/checkout/payment-instructions',
      params: { orderNumber: 'ORD-1', email: 'ada@example.com' },
    });
  });

  it('M3.4: pedido sin método manual no ofrece ver instrucciones', () => {
    render(<ConfirmationScreen />);

    expect(screen.queryByTestId('confirmation-instructions-ORD-1')).toBeNull();
  });
});
