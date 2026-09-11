import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import type { CustomerUser } from '@/core/models/auth';
import type { CartItem } from '@/core/models/cart.model';
import type {
  CouponValidation,
  RequestOrdersResult,
  ShippingAddress,
} from '@/core/models/checkout.model';
import type { CheckoutSubmission } from '@/stores/checkout-store';

import ReviewScreen from '../review';

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { replace: mockReplace, push: mockPush, back: jest.fn() },
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: jest.fn() }),
}));

const mockSubmit = jest.fn().mockResolvedValue(null);

interface MockCheckoutState {
  address: ShippingAddress;
  coupon: CouponValidation | null;
  couponCode: string | null;
  submission: CheckoutSubmission;
}

let mockCheckoutState: MockCheckoutState;

jest.mock('@/stores/checkout-store', () => ({
  useCheckoutStore: (selector: (s: MockCheckoutState & { submit: typeof mockSubmit }) => unknown) =>
    selector({ ...mockCheckoutState, submit: mockSubmit }),
}));

let mockCartState: { items: CartItem[] };

jest.mock('@/stores/cart-store', () => {
  const actual = jest.requireActual('@/stores/cart-store');
  return {
    ...actual,
    useCartStore: (selector: (s: { items: CartItem[] }) => unknown) => selector(mockCartState),
  };
});

let mockUser: CustomerUser | null;

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (s: { user: CustomerUser | null }) => unknown) =>
    selector({ user: mockUser }),
}));

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    variantId: 5,
    productId: 1,
    supplierId: null,
    productName: 'Playera Negra',
    productSlug: 'playera-negra',
    size: 'M',
    color: 'Negro',
    sku: 'P-M-N',
    price: 80,
    stock: 10,
    quantity: 2,
    image: null,
    lineTotal: 160,
    ...overrides,
  };
}

const validCoupon: CouponValidation = {
  valid: true,
  message: 'Cupón aplicado.',
  discountAmount: 50,
  shippingDiscount: 0,
  eligibleSubtotal: 160,
};

const successResult: RequestOrdersResult = {
  message: 'Pedidos solicitados.',
  purchaseNumber: 'PUR-1',
  accessToken: 'guest-token',
  orders: [],
};

describe('ReviewScreen — checkout M3.3', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmit.mockResolvedValue(null);
    mockUser = null;
    mockCartState = { items: [makeItem()] };
    mockCheckoutState = {
      address: { street: 'Av. Juárez 123', city: 'CDMX', state: 'CDMX', zip: '06600' },
      coupon: null,
      couponCode: null,
      submission: { status: 'idle', error: null, result: null },
    };
  });

  it('muestra el resumen con items del carrito, envío 99 y total', () => {
    mockCartState = {
      items: [
        makeItem({ variantId: 5, quantity: 2, lineTotal: 160 }),
        makeItem({ variantId: 6, quantity: 1, lineTotal: 100, price: 100, productName: 'Taza' }),
      ],
    };
    render(<ReviewScreen />);

    expect(screen.getByTestId('review-summary-count').props.children).toBe(3);
    expect(screen.getByTestId('review-summary-subtotal').props.children).toBe('$260.00');
    expect(screen.getByTestId('review-summary-shipping').props.children).toBe('$99.00');
    expect(screen.getByTestId('review-summary-total').props.children).toBe('$359.00');
  });

  it('muestra la dirección de envío capturada', () => {
    render(<ReviewScreen />);

    expect(screen.getByTestId('review-address')).toBeTruthy();
  });

  it('prefill de los datos del cliente desde authStore', () => {
    mockUser = {
      id: 1,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '5512345678',
      role: 'customer',
    };
    render(<ReviewScreen />);

    expect(screen.getByTestId('review-customer-name').props.value).toBe('Ada Lovelace');
    expect(screen.getByTestId('review-customer-email').props.value).toBe('ada@example.com');
    expect(screen.getByTestId('review-customer-phone').props.value).toBe('5512345678');
  });

  it('guest puede editar sus datos de cliente', () => {
    render(<ReviewScreen />);

    fireEvent.changeText(screen.getByTestId('review-customer-name'), 'Invitado');
    fireEvent.changeText(screen.getByTestId('review-customer-email'), 'guest@example.com');

    expect(screen.getByTestId('review-customer-name').props.value).toBe('Invitado');
    expect(screen.getByTestId('review-customer-email').props.value).toBe('guest@example.com');
  });

  it('AC1: submit envía los datos y navega a confirmation en éxito', async () => {
    mockUser = { id: 1, name: 'Ada', email: 'ada@example.com', role: 'customer' };
    mockSubmit.mockResolvedValueOnce(successResult);
    render(<ReviewScreen />);

    fireEvent.press(screen.getByTestId('review-submit'));

    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'Ada',
      email: 'ada@example.com',
      phone: undefined,
    });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/checkout/confirmation'));
  });

  it('AC6: muestra el error del submit y no navega', async () => {
    mockUser = { id: 1, name: 'Ada', email: 'ada@example.com', role: 'customer' };
    mockSubmit.mockResolvedValueOnce(null);
    mockCheckoutState.submission = {
      status: 'error',
      error: 'El correo no es válido.',
      result: null,
    };
    render(<ReviewScreen />);

    fireEvent.press(screen.getByTestId('review-submit'));

    await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
    expect(screen.getByTestId('review-error').props.children).toBe('El correo no es válido.');
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('carrito vacío no ofrece submit', () => {
    mockCartState = { items: [] };
    render(<ReviewScreen />);

    expect(screen.getByTestId('review-empty')).toBeTruthy();
    expect(screen.queryByTestId('review-submit')).toBeNull();
  });

  it('AC4: aplica el descuento del cupón al total', () => {
    mockCheckoutState.coupon = validCoupon;
    mockCheckoutState.couponCode = 'TAGS50';
    render(<ReviewScreen />);

    expect(screen.getByTestId('review-summary-discount').props.children).toBe('-$50.00');
    expect(screen.getByTestId('review-summary-total').props.children).toBe('$209.00');
  });

  it('M6.3: ofrece accesos legales (términos, privacidad y ayuda)', () => {
    render(<ReviewScreen />);

    fireEvent.press(screen.getByTestId('checkout-legal-terms'));
    expect(mockPush).toHaveBeenCalledWith('/legal/terms');

    fireEvent.press(screen.getByTestId('checkout-legal-privacy'));
    expect(mockPush).toHaveBeenCalledWith('/legal/privacy');

    fireEvent.press(screen.getByTestId('checkout-legal-help'));
    expect(mockPush).toHaveBeenCalledWith('/legal/help');
  });
});
