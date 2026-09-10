import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import { checkoutService } from '@/core/services/checkout-service';
import { couponService } from '@/core/services/coupon-service';
import { useCartStore } from '@/stores/cart-store';
import { useCheckoutStore } from '@/stores/checkout-store';
import { useCouponStore } from '@/stores/coupon-store';

import type { CartItem } from '@/core/models/cart.model';
import type { CouponDefinition } from '@/core/models/coupon.model';

import CouponsScreen from '../coupons';

const mockPush = jest.fn();
const mockRedirect = jest.fn();

let mockIsAuthenticated = true;
let mockIsHydrated = true;

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: (
    selector: (s: { isHydrated: boolean; token: string | null; user: unknown }) => unknown,
  ) =>
    selector({
      isHydrated: mockIsHydrated,
      token: mockIsAuthenticated ? 'mock-token' : null,
      user: mockIsAuthenticated ? { id: 1, name: 'Juan', email: 'j@test.com' } : null,
    }),
  isAuthenticated: (s: { token: string | null; user: unknown }) => !!s.token && !!s.user,
}));

jest.mock('expo-router', () => {
  const MockRedirect = (props: { href: string }) => {
    mockRedirect(props);
    return null;
  };
  MockRedirect.displayName = 'Redirect';
  return {
    Redirect: MockRedirect,
    router: { push: (...args: unknown[]) => mockPush(...args) },
  };
});

jest.mock('@/core/services/coupon-service', () => ({
  couponService: { getCoupons: jest.fn() },
}));

jest.mock('@/core/services/checkout-service', () => ({
  checkoutService: {
    getConfig: jest.fn(),
    getPolicies: jest.fn(),
    lookupPostalCode: jest.fn(),
    validateCoupon: jest.fn(),
    requestOrders: jest.fn(),
    getPaymentInstructions: jest.fn(),
    uploadPaymentProof: jest.fn(),
  },
}));

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));

const mockedCouponService = couponService as jest.Mocked<typeof couponService>;
const mockedCheckoutService = checkoutService as jest.Mocked<typeof checkoutService>;

function makeCoupon(overrides: Partial<CouponDefinition> = {}): CouponDefinition {
  return {
    id: 'api-1',
    code: 'TAGS50',
    issuer: 'platform',
    title: '50 pesos',
    description: 'Bienvenida',
    discountType: 'fixed',
    value: 50,
    minSubtotal: null,
    segment: null,
    storeSlug: null,
    storeName: null,
    assignedEmails: [],
    expiresAt: null,
    oneTime: false,
    keywords: [],
    ...overrides,
  };
}

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

const fifty = makeCoupon({ expiresAt: '2026-09-15' });
const shipping = makeCoupon({
  id: 'api-2',
  code: 'ENVIO',
  title: 'Envío gratis',
  description: 'Sin costo de envío',
  discountType: 'shipping',
  value: 100,
});

describe('CouponsScreen — cuponera (M6.2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = true;
    mockIsHydrated = true;
    useCouponStore.getState().reset();
    useCheckoutStore.getState().reset();
    useCartStore.setState({ items: [], status: 'idle', error: null });
    mockedCouponService.getCoupons.mockResolvedValue([]);
  });

  it('AC1: al montar pide los cupones del usuario autenticado una vez', async () => {
    render(<CouponsScreen />);

    await waitFor(() => {
      expect(mockedCouponService.getCoupons).toHaveBeenCalledWith({ email: 'j@test.com' });
    });
    expect(mockedCouponService.getCoupons).toHaveBeenCalledTimes(1);
  });

  it('AC2: muestra code/title/description/descuento y expiresAt legible', async () => {
    mockedCouponService.getCoupons.mockResolvedValue([fifty]);

    render(<CouponsScreen />);

    expect(await screen.findByText('TAGS50')).toBeTruthy();
    expect(screen.getByText('50 pesos')).toBeTruthy();
    expect(screen.getByText('Bienvenida')).toBeTruthy();
    expect(screen.getByText('$50 de descuento')).toBeTruthy();
    expect(screen.getByText('Vence 15 sep 2026')).toBeTruthy();
  });

  it('AC2: muestra "Envío gratis" para un cupón de tipo shipping', async () => {
    mockedCouponService.getCoupons.mockResolvedValue([shipping]);

    render(<CouponsScreen />);

    expect(await screen.findAllByText('Envío gratis')).toHaveLength(2);
  });

  it('AC3: la búsqueda usa el término y filtra la lista', async () => {
    mockedCouponService.getCoupons.mockResolvedValue([fifty, shipping]);

    render(<CouponsScreen />);
    await screen.findByTestId('coupon-item-TAGS50');

    fireEvent.changeText(screen.getByTestId('coupons-search'), 'envio');

    await waitFor(() => {
      expect(screen.queryByTestId('coupon-item-TAGS50')).toBeNull();
    });
    expect(screen.getByTestId('coupon-item-ENVIO')).toBeTruthy();
  });

  it('AC4: aplicar reutiliza checkout-store.applyCoupon con los items del carrito', async () => {
    useCartStore.setState({ items: [makeItem({ variantId: 5, quantity: 2 })] });
    mockedCouponService.getCoupons.mockResolvedValue([fifty]);
    mockedCheckoutService.validateCoupon.mockResolvedValueOnce({
      valid: true,
      message: 'Cupón aplicado.',
      discountAmount: 50,
      shippingDiscount: 0,
      eligibleSubtotal: 160,
    });

    render(<CouponsScreen />);
    fireEvent.press(await screen.findByTestId('coupon-apply-TAGS50'));

    await waitFor(() => {
      expect(mockedCheckoutService.validateCoupon).toHaveBeenCalledWith({
        code: 'TAGS50',
        segment: 'basicos',
        shipping_cost: 99,
        items: [{ variant_id: 5, quantity: 2 }],
        customer_email: 'j@test.com',
      });
    });
  });

  it('AC4: tras un cupón válido ofrece continuar al checkout', async () => {
    mockedCouponService.getCoupons.mockResolvedValue([fifty]);
    mockedCheckoutService.validateCoupon.mockResolvedValueOnce({
      valid: true,
      message: 'Cupón aplicado.',
      discountAmount: 50,
      shippingDiscount: 0,
      eligibleSubtotal: 160,
    });

    render(<CouponsScreen />);
    fireEvent.press(await screen.findByTestId('coupon-apply-TAGS50'));

    fireEvent.press(await screen.findByTestId('coupon-checkout-TAGS50'));

    expect(mockPush).toHaveBeenCalledWith('/checkout/address');
  });

  it('AC5: cupón inválido muestra el message del backend sin romper', async () => {
    mockedCouponService.getCoupons.mockResolvedValue([fifty]);
    mockedCheckoutService.validateCoupon.mockResolvedValueOnce({
      valid: false,
      message: 'El cupón expiró.',
      discountAmount: 0,
      shippingDiscount: 0,
      eligibleSubtotal: 0,
    });

    render(<CouponsScreen />);
    fireEvent.press(await screen.findByTestId('coupon-apply-TAGS50'));

    expect(await screen.findByText('El cupón expiró.')).toBeTruthy();
  });

  it('AC6: lista vacía muestra EmptyState', async () => {
    mockedCouponService.getCoupons.mockResolvedValue([]);

    render(<CouponsScreen />);

    expect(await screen.findByTestId('coupons-empty')).toBeTruthy();
  });

  it('AC6: error muestra ErrorState y el retry vuelve a pedir los cupones', async () => {
    mockedCouponService.getCoupons.mockRejectedValueOnce(new Error('boom'));

    render(<CouponsScreen />);

    expect(await screen.findByTestId('coupons-error')).toBeTruthy();
    fireEvent.press(screen.getByTestId('coupons-error-retry'));

    await waitFor(() => {
      expect(mockedCouponService.getCoupons).toHaveBeenCalledTimes(2);
    });
  });

  it('AC6: status loading muestra el skeleton', () => {
    mockedCouponService.getCoupons.mockReturnValue(new Promise(() => undefined));

    render(<CouponsScreen />);

    expect(screen.getByTestId('coupons-skeleton')).toBeTruthy();
  });

  it('sin sesión redirige a login y no consulta cupones', () => {
    mockIsAuthenticated = false;

    render(<CouponsScreen />);

    expect(mockRedirect).toHaveBeenCalledWith({ href: '/(auth)/login' });
    expect(mockedCouponService.getCoupons).not.toHaveBeenCalled();
  });

  it('durante la hidratación no renderiza la lista', () => {
    mockIsHydrated = false;

    render(<CouponsScreen />);

    expect(screen.queryByTestId('coupons-list')).toBeNull();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
