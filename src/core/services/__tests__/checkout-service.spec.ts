import { httpClient } from '@/core/api/client';
import { checkoutService } from '@/core/services/checkout-service';

import type {
  CheckoutConfig,
  CheckoutPolicies,
  CouponValidation,
  PostalCodeLookup,
} from '@/core/models/checkout.model';

jest.mock('@/core/api/client', () => {
  const actual = jest.requireActual('@/core/api/client');
  return {
    ...actual,
    httpClient: {
      request: jest.fn(),
    },
  };
});

const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

const config = {
  paymentMode: 'supplier_manual',
  paymentMethods: { card: false, oxxo: true, spei: true },
} as unknown as CheckoutConfig;

const policies = {
  manualPaymentDisclaimer: 'Pago manual',
  mediationWindowHours: 24,
  whatsappEnabled: true,
} as unknown as CheckoutPolicies;

const lookup = {
  postalCode: '06600',
  state: 'Ciudad de México',
  stateCode: 'CDMX',
  municipality: 'Cuauhtémoc',
  city: 'Ciudad de México',
  settlements: [{ name: 'Juárez', type: 'Colonia' }],
} as unknown as PostalCodeLookup;

describe('checkoutService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AC1: getConfig() llama GET /checkout/config', async () => {
    mockedHttpClient.request.mockResolvedValueOnce(config);

    const result = await checkoutService.getConfig();

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/checkout/config');
    expect(options?.method).toBe('GET');
    expect(result).toEqual(config);
  });

  it('getPolicies() llama GET /policies', async () => {
    mockedHttpClient.request.mockResolvedValueOnce(policies);

    const result = await checkoutService.getPolicies();

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/policies');
    expect(options?.method).toBe('GET');
    expect(result).toEqual(policies);
  });

  it('AC3: lookupPostalCode("06600") llama GET /postal-codes/06600 y desenvuelve `{ data }`', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ data: lookup });

    const result = await checkoutService.lookupPostalCode('06600');

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/postal-codes/06600');
    expect(options?.method).toBe('GET');
    expect(result).toEqual(lookup);
  });

  it('AC4: validateCoupon envía body snake_case con segment basicos, shipping_cost e items', async () => {
    const payload = {
      code: 'TAGS50',
      segment: 'basicos' as const,
      shipping_cost: 99,
      items: [{ variant_id: 5, quantity: 2 }],
    };
    mockedHttpClient.request.mockResolvedValueOnce({
      valid: true,
      message: 'Cupón aplicado.',
      discountAmount: 50,
      shippingDiscount: 0,
      eligibleSubtotal: 160,
    });

    const result = await checkoutService.validateCoupon(payload);

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/coupons/validate');
    expect(options?.method).toBe('POST');
    expect(options?.body).toEqual(payload);
    expect(result.discountAmount).toBe(50);
  });

  it('AC4: validateCoupon normaliza montos ausentes a 0', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ valid: false, message: 'Código no válido.' });

    const result = await checkoutService.validateCoupon({
      code: 'NOPE',
      segment: 'basicos',
      shipping_cost: 99,
      items: [{ variant_id: 5, quantity: 1 }],
    });

    expect(result.valid).toBe(false);
    expect(result.message).toBe('Código no válido.');
    expect(result.discountAmount).toBe(0);
    expect(result.shippingDiscount).toBe(0);
    expect(result.eligibleSubtotal).toBe(0);
  });

  it('AC4: validateCoupon propaga el cupón y montos presentes', async () => {
    const coupon = { id: 'api-1', code: 'TAGS50' } as unknown as CouponValidation['coupon'];
    mockedHttpClient.request.mockResolvedValueOnce({
      valid: true,
      message: 'Cupón aplicado.',
      coupon,
      discountAmount: 50,
      shippingDiscount: 99,
      eligibleSubtotal: 300,
    });

    const result = await checkoutService.validateCoupon({
      code: 'TAGS50',
      segment: 'basicos',
      shipping_cost: 99,
      items: [{ variant_id: 5, quantity: 1 }],
    });

    expect(result.coupon).toEqual(coupon);
    expect(result.shippingDiscount).toBe(99);
    expect(result.eligibleSubtotal).toBe(300);
  });

  it('AC1: requestOrders(key) llama POST /checkout/request-orders con body y header Idempotency-Key', async () => {
    const payload = {
      segment: 'basicos' as const,
      items: [{ variant_id: 5, quantity: 2 }],
      customer_name: 'Ada Lovelace',
      customer_email: 'ada@example.com',
      shipping_address: { street: 'Av. Juárez 123', city: 'CDMX', state: 'CDMX', zip: '06600' },
    };
    const response = {
      message: 'Pedidos solicitados.',
      purchaseNumber: 'PUR-1',
      accessToken: null,
      orders: [
        {
          orderNumber: 'ORD-1',
          supplierId: 1,
          status: 'pending',
          paymentStatus: 'pending',
          total: 259,
        },
      ],
    };
    mockedHttpClient.request.mockResolvedValueOnce(response);

    const result = await checkoutService.requestOrders(payload, 'ck_1234567890_abc');

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/checkout/request-orders');
    expect(options?.method).toBe('POST');
    expect(options?.body).toEqual(payload);
    expect(options?.headers).toEqual({ 'Idempotency-Key': 'ck_1234567890_abc' });
    expect(result).toEqual(response);
  });

  it('AC1: requestOrders sin key NO envía header Idempotency-Key', async () => {
    const payload = {
      segment: 'basicos' as const,
      items: [{ variant_id: 5, quantity: 1 }],
      customer_name: 'Ada Lovelace',
      customer_email: 'ada@example.com',
      shipping_address: { street: 'x', city: 'y', state: 'z', zip: '06600' },
    };
    mockedHttpClient.request.mockResolvedValueOnce({
      message: 'ok',
      purchaseNumber: 'PUR-1',
      accessToken: 'guest-token',
      orders: [],
    });

    await checkoutService.requestOrders(payload);

    const [, options] = mockedHttpClient.request.mock.calls[0];
    expect(options?.headers).toBeUndefined();
  });

  it('AC1 M3.4: getPaymentInstructions(orderNumber, email) llama GET con ?email=', async () => {
    const response = {
      orderNumber: 'ORD-1',
      paymentStatus: 'pending',
      paymentMethod: 'oxxo',
      total: 259,
      paymentDueAt: '2026-09-14T00:00:00Z',
      paymentInstructions: {
        type: 'supplier_manual',
        method: 'oxxo',
        reference: '1234567890',
        amount: 259,
      },
      demoMode: false,
    };
    mockedHttpClient.request.mockResolvedValueOnce(response);

    const result = await checkoutService.getPaymentInstructions('ORD-1', 'ada@example.com');

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/checkout/payment-instructions/ORD-1');
    expect(options?.method).toBe('GET');
    expect(options?.query).toEqual({ email: 'ada@example.com' });
    expect(result).toEqual(response);
  });

  it('AC1 M3.4: getPaymentInstructions codifica el orderNumber en la ruta', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({});

    await checkoutService.getPaymentInstructions('ORD/1 2', 'a@b.com');

    const [path] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/checkout/payment-instructions/ORD%2F1%202');
  });
});
