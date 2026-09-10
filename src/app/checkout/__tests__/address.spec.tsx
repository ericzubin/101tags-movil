import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import type { CartItem } from '@/core/models/cart.model';
import type {
  CheckoutConfig,
  CouponValidation,
  PostalSettlement,
  ShippingAddress,
} from '@/core/models/checkout.model';

import AddressScreen from '../address';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  router: { push: mockPush, replace: jest.fn(), back: jest.fn() },
}));

const mockFetchConfig = jest.fn().mockResolvedValue(undefined);
const mockFetchPolicies = jest.fn().mockResolvedValue(undefined);
const mockSetAddressField = jest.fn().mockResolvedValue(undefined);
const mockSetAddress = jest.fn();
const mockValidate = jest.fn();
const mockApplyCoupon = jest.fn().mockResolvedValue(undefined);
const mockClearCoupon = jest.fn();

interface MockCheckoutState {
  config: CheckoutConfig | null;
  address: ShippingAddress;
  settlements: PostalSettlement[];
  coupon: CouponValidation | null;
  couponMessage: string | null;
  fieldErrors: Record<string, string | undefined>;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}

let mockCheckoutState: MockCheckoutState;

jest.mock('@/stores/checkout-store', () => ({
  useCheckoutStore: (selector: (s: MockCheckoutState) => unknown) =>
    selector({
      ...mockCheckoutState,
      fetchConfig: mockFetchConfig,
      fetchPolicies: mockFetchPolicies,
      setAddressField: mockSetAddressField,
      setAddress: mockSetAddress,
      validate: mockValidate,
      applyCoupon: mockApplyCoupon,
      clearCoupon: mockClearCoupon,
    } as unknown as MockCheckoutState),
}));

let mockCartState: { items: CartItem[] };

jest.mock('@/stores/cart-store', () => {
  const actual = jest.requireActual('@/stores/cart-store');
  return {
    ...actual,
    useCartStore: (selector: (s: { items: CartItem[] }) => unknown) => selector(mockCartState),
  };
});

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

const config = {
  paymentMode: 'supplier_manual',
  paymentMethods: { card: false, oxxo: true, spei: true },
  housePaymentMethods: { card: false, oxxo: true, spei: true },
  housePaymentAvailable: true,
  houseSupplierIds: [1],
  oxxoDueHours: 72,
  speiDueHours: 48,
  demoMode: false,
  manualPaymentDisclaimer: 'Pago manual',
} as unknown as CheckoutConfig;

const validCoupon: CouponValidation = {
  valid: true,
  message: 'Cupón aplicado.',
  discountAmount: 50,
  shippingDiscount: 0,
  eligibleSubtotal: 160,
};

describe('AddressScreen — checkout M3.2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckoutState = {
      config,
      address: { street: '', city: '', state: '', zip: '', neighborhood: '' },
      settlements: [],
      coupon: null,
      couponMessage: null,
      fieldErrors: {},
      status: 'ready',
      error: null,
    };
    mockCartState = { items: [makeItem()] };
  });

  it('AC1: al montar llama fetchConfig y habilita solo los métodos permitidos', () => {
    render(<AddressScreen />);

    expect(mockFetchConfig).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('payment-method-oxxo')).toBeTruthy();
    expect(screen.getByTestId('payment-method-spei')).toBeTruthy();
    expect(screen.queryByTestId('payment-method-card')).toBeNull();
  });

  it('AC6: carrito vacío no ofrece continuar', () => {
    mockCartState = { items: [] };
    render(<AddressScreen />);

    expect(screen.getByTestId('checkout-empty')).toBeTruthy();
    expect(screen.queryByTestId('checkout-continue')).toBeNull();
  });

  it('AC2: muestra errores inline del store para campos requeridos', () => {
    mockCheckoutState.fieldErrors = { street: 'Ingresa tu calle y número.', zip: 'CP inválido' };
    render(<AddressScreen />);

    expect(screen.getByTestId('address-street-error').props.children).toBe('Ingresa tu calle y número.');
    expect(screen.getByTestId('address-zip-error').props.children).toBe('CP inválido');
  });

  it('AC2: continuar deshabilitado con dirección incompleta', () => {
    render(<AddressScreen />);

    const button = screen.getByTestId('checkout-continue');
    expect(button.props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(button);
    expect(mockValidate).not.toHaveBeenCalled();
  });

  it('AC2: continuar habilitado con dirección completa llama validate', () => {
    mockCheckoutState.address = {
      street: 'Av. Juárez 123',
      city: 'CDMX',
      state: 'CDMX',
      zip: '06600',
    };
    mockValidate.mockReturnValueOnce(true);

    render(<AddressScreen />);
    fireEvent.press(screen.getByTestId('checkout-continue'));

    expect(mockValidate).toHaveBeenCalledTimes(1);
  });

  it('AC3: escribir un CP de 5 dígitos dispara setAddressField("zip")', () => {
    render(<AddressScreen />);

    fireEvent.changeText(screen.getByTestId('address-zip'), '06600');

    expect(mockSetAddressField).toHaveBeenCalledWith('zip', '06600');
  });

  it('AC3: lista colonias y al elegir una actualiza neighborhood', () => {
    mockCheckoutState.settlements = [
      { name: 'Juárez', type: 'Colonia' },
      { name: 'Tabacalera', type: 'Colonia' },
    ];
    render(<AddressScreen />);

    fireEvent.press(screen.getByTestId('address-settlement-Juárez'));

    expect(mockSetAddress).toHaveBeenCalledWith({ neighborhood: 'Juárez' });
  });

  it('AC4: aplicar cupón llama applyCoupon con el código', () => {
    render(<AddressScreen />);

    fireEvent.changeText(screen.getByTestId('coupon-input'), 'TAGS50');
    fireEvent.press(screen.getByTestId('coupon-apply'));

    expect(mockApplyCoupon).toHaveBeenCalledWith('TAGS50');
  });

  it('AC4: cupón aplicado muestra mensaje y descuento', () => {
    mockCheckoutState.coupon = validCoupon;
    mockCheckoutState.couponMessage = 'Cupón aplicado.';
    render(<AddressScreen />);

    expect(screen.getByTestId('coupon-message').props.children).toBe('Cupón aplicado.');
    expect(screen.getByTestId('checkout-summary-discount').props.children).toBe('-$50.00');
  });

  it('AC5: resumen usa cantidades/precios del carrito (servidor), no recálculo', () => {
    mockCartState = {
      items: [
        makeItem({ variantId: 5, quantity: 2, lineTotal: 160 }),
        makeItem({ variantId: 6, quantity: 1, lineTotal: 100, price: 100, productName: 'Taza' }),
      ],
    };
    mockCheckoutState.coupon = validCoupon;
    render(<AddressScreen />);

    expect(screen.getByTestId('checkout-summary-count').props.children).toBe(3);
    expect(screen.getByTestId('checkout-summary-subtotal').props.children).toBe('$260.00');
    expect(screen.getByTestId('checkout-summary-shipping').props.children).toBe('$99.00');
    expect(screen.getByTestId('checkout-summary-total').props.children).toBe('$309.00');
  });
});
