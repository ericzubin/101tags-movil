import * as Clipboard from 'expo-clipboard';

import { HttpError } from '@/core/api/client';
import type { CartItem } from '@/core/models/cart.model';
import type {
  CheckoutConfig,
  CouponValidation,
  PaymentInstructionsResult,
  PostalCodeLookup,
  RequestedOrder,
  RequestOrdersResult,
} from '@/core/models/checkout.model';
import { checkoutService } from '@/core/services/checkout-service';
import { useCartStore } from '@/stores/cart-store';
import { paymentProofAssetError, useCheckoutStore } from '@/stores/checkout-store';

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

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

const mockedClipboard = Clipboard as unknown as { setStringAsync: jest.Mock };

const mockedCheckoutService = checkoutService as jest.Mocked<typeof checkoutService>;

const config = {
  paymentMode: 'supplier_manual',
  paymentMethods: { card: false, oxxo: true, spei: true },
} as unknown as CheckoutConfig;

const lookup = {
  postalCode: '06600',
  state: 'Ciudad de México',
  stateCode: 'CDMX',
  municipality: 'Cuauhtémoc',
  city: 'Ciudad de México',
  settlements: [
    { name: 'Juárez', type: 'Colonia' },
    { name: 'Tabacalera', type: 'Colonia' },
  ],
} as unknown as PostalCodeLookup;

const validCoupon: CouponValidation = {
  valid: true,
  message: 'Cupón aplicado.',
  discountAmount: 50,
  shippingDiscount: 0,
  eligibleSubtotal: 160,
};

const order: RequestedOrder = {
  orderNumber: 'ORD-1',
  supplierId: 1,
  status: 'pending',
  paymentStatus: 'pending',
  total: 160,
};

const successResult: RequestOrdersResult = {
  message: 'Pedidos solicitados.',
  purchaseNumber: 'PUR-1',
  accessToken: null,
  orders: [order],
};

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

describe('checkout-store', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useCartStore.setState({ items: [], status: 'idle', error: null });
    useCheckoutStore.getState().reset();
  });

  it('estado inicial: sin config, dirección vacía, status idle, error null', () => {
    const s = useCheckoutStore.getState();
    expect(s.config).toBeNull();
    expect(s.policies).toBeNull();
    expect(s.address).toEqual({ street: '', city: '', state: '', zip: '', neighborhood: '' });
    expect(s.coupon).toBeNull();
    expect(s.status).toBe('idle');
    expect(s.error).toBeNull();
  });

  it('AC1: fetchConfig() llama getConfig, guarda config y status ready', async () => {
    mockedCheckoutService.getConfig.mockResolvedValueOnce(config);

    await useCheckoutStore.getState().fetchConfig();

    expect(mockedCheckoutService.getConfig).toHaveBeenCalledTimes(1);
    const s = useCheckoutStore.getState();
    expect(s.config).toEqual(config);
    expect(s.status).toBe('ready');
    expect(s.error).toBeNull();
  });

  it('fetchConfig() ante error deja status error y guarda mensaje', async () => {
    mockedCheckoutService.getConfig.mockRejectedValueOnce(new Error('config boom'));

    await useCheckoutStore.getState().fetchConfig();

    const s = useCheckoutStore.getState();
    expect(s.status).toBe('error');
    expect(s.error).toBe('config boom');
  });

  it('fetchPolicies() guarda las políticas', async () => {
    const policies = {
      manualPaymentDisclaimer: 'Pago manual',
      mediationWindowHours: 24,
      whatsappEnabled: true,
    };
    mockedCheckoutService.getPolicies.mockResolvedValueOnce(policies);

    await useCheckoutStore.getState().fetchPolicies();

    expect(useCheckoutStore.getState().policies).toEqual(policies);
  });

  it('setAddressField actualiza el campo y limpia su error', async () => {
    useCheckoutStore.setState({ fieldErrors: { street: 'Requerido' } });

    await useCheckoutStore.getState().setAddressField('street', 'Av. Juárez 123');

    const s = useCheckoutStore.getState();
    expect(s.address.street).toBe('Av. Juárez 123');
    expect(s.fieldErrors.street).toBeUndefined();
  });

  it('AC3: setAddressField("zip","06600") consulta lookup y autocompleta estado/ciudad + colonias', async () => {
    mockedCheckoutService.lookupPostalCode.mockResolvedValueOnce(lookup);

    await useCheckoutStore.getState().setAddressField('zip', '06600');

    expect(mockedCheckoutService.lookupPostalCode).toHaveBeenCalledWith('06600');
    const s = useCheckoutStore.getState();
    expect(s.address.zip).toBe('06600');
    expect(s.address.state).toBe('Ciudad de México');
    expect(s.address.city).toBe('Ciudad de México');
    expect(s.settlements).toEqual(lookup.settlements);
  });

  it('setAddressField("zip") con <5 dígitos limpia colonias y no consulta', async () => {
    useCheckoutStore.setState({ settlements: [{ name: 'Juárez', type: 'Colonia' }] });

    await useCheckoutStore.getState().setAddressField('zip', '066');

    expect(mockedCheckoutService.lookupPostalCode).not.toHaveBeenCalled();
    expect(useCheckoutStore.getState().settlements).toEqual([]);
  });

  it('AC3: CP no encontrado deja error inline y permite captura manual', async () => {
    mockedCheckoutService.lookupPostalCode.mockRejectedValueOnce(new Error('HTTP 404'));

    await useCheckoutStore.getState().setAddressField('zip', '99999');

    const s = useCheckoutStore.getState();
    expect(s.settlements).toEqual([]);
    expect(s.address.state).toBe('');
    expect(s.fieldErrors.zip).toBeTruthy();
  });

  it('setAddress hace merge parcial (selección de colonia)', () => {
    useCheckoutStore.getState().setAddress({ neighborhood: 'Juárez' });

    expect(useCheckoutStore.getState().address.neighborhood).toBe('Juárez');
  });

  it('AC2: validate() marca requeridos y CP inválido, devuelve false', () => {
    const ok = useCheckoutStore.getState().validate();

    expect(ok).toBe(false);
    const { fieldErrors } = useCheckoutStore.getState();
    expect(fieldErrors.street).toBeTruthy();
    expect(fieldErrors.city).toBeTruthy();
    expect(fieldErrors.state).toBeTruthy();
    expect(fieldErrors.zip).toBeTruthy();
  });

  it('AC2: validate() con CP de 4 dígitos marca zip', async () => {
    useCheckoutStore.setState({
      address: { street: 'Calle 1', city: 'CDMX', state: 'CDMX', zip: '0660' },
    });

    const ok = useCheckoutStore.getState().validate();

    expect(ok).toBe(false);
    expect(useCheckoutStore.getState().fieldErrors.zip).toBeTruthy();
  });

  it('AC2: validate() con dirección completa devuelve true y sin errores', () => {
    useCheckoutStore.setState({
      address: { street: 'Av. Juárez 123', city: 'CDMX', state: 'CDMX', zip: '06600' },
    });

    const ok = useCheckoutStore.getState().validate();

    expect(ok).toBe(true);
    expect(useCheckoutStore.getState().fieldErrors).toEqual({});
  });

  it('AC4: applyCoupon usa items del carrito, segment basicos y shipping_cost 99', async () => {
    useCartStore.setState({ items: [makeItem({ variantId: 5, quantity: 2 })] });
    mockedCheckoutService.validateCoupon.mockResolvedValueOnce(validCoupon);

    await useCheckoutStore.getState().applyCoupon('TAGS50');

    expect(mockedCheckoutService.validateCoupon).toHaveBeenCalledWith({
      code: 'TAGS50',
      segment: 'basicos',
      shipping_cost: 99,
      items: [{ variant_id: 5, quantity: 2 }],
    });
    const s = useCheckoutStore.getState();
    expect(s.coupon).toEqual(validCoupon);
    expect(s.couponMessage).toBe('Cupón aplicado.');
  });

  it('AC4: cupón inválido guarda mensaje y no rompe (coupon null)', async () => {
    mockedCheckoutService.validateCoupon.mockResolvedValueOnce({
      valid: false,
      message: 'Código no válido.',
      discountAmount: 0,
      shippingDiscount: 0,
      eligibleSubtotal: 0,
    });

    await useCheckoutStore.getState().applyCoupon('NOPE');

    const s = useCheckoutStore.getState();
    expect(s.coupon).toBeNull();
    expect(s.couponMessage).toBe('Código no válido.');
  });

  it('AC4: error del service no rompe y guarda mensaje', async () => {
    mockedCheckoutService.validateCoupon.mockRejectedValueOnce(new Error('network'));

    await expect(useCheckoutStore.getState().applyCoupon('TAGS50')).resolves.toBeUndefined();

    expect(useCheckoutStore.getState().couponMessage).toBe('network');
  });

  it('applyCoupon con código vacío no llama al service', async () => {
    await useCheckoutStore.getState().applyCoupon('   ');

    expect(mockedCheckoutService.validateCoupon).not.toHaveBeenCalled();
  });

  it('clearCoupon limpia cupón y mensaje', () => {
    useCheckoutStore.setState({ coupon: validCoupon, couponMessage: 'Cupón aplicado.' });

    useCheckoutStore.getState().clearCoupon();

    const s = useCheckoutStore.getState();
    expect(s.coupon).toBeNull();
    expect(s.couponMessage).toBeNull();
  });

  it('reset() vuelve al estado inicial', () => {
    useCheckoutStore.setState({
      config,
      address: { street: 'Calle 1', city: 'CDMX', state: 'CDMX', zip: '06600' },
      coupon: validCoupon,
      status: 'error',
      error: 'x',
    });

    useCheckoutStore.getState().reset();

    const s = useCheckoutStore.getState();
    expect(s.config).toBeNull();
    expect(s.address.zip).toBe('');
    expect(s.coupon).toBeNull();
    expect(s.status).toBe('idle');
    expect(s.error).toBeNull();
  });

  describe('M3.3 — idempotencia y submit', () => {
    it('AC1: submit() genera Idempotency-Key, llama requestOrders y guarda purchaseNumber/orders', async () => {
      useCartStore.setState({ items: [makeItem({ variantId: 5, quantity: 2 })] });
      useCheckoutStore.setState({
        address: { street: 'Av. Juárez 123', city: 'CDMX', state: 'CDMX', zip: '06600' },
      });
      mockedCheckoutService.requestOrders.mockResolvedValueOnce(successResult);

      const returned = await useCheckoutStore.getState().submit({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
      });

      expect(mockedCheckoutService.requestOrders).toHaveBeenCalledTimes(1);
      const [payload, key] = mockedCheckoutService.requestOrders.mock.calls[0];
      expect(key).toMatch(/^[A-Za-z0-9._:-]{8,100}$/);
      expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(payload.segment).toBe('basicos');
      expect(payload.items).toEqual([{ variant_id: 5, quantity: 2 }]);
      expect(payload.customer_name).toBe('Ada Lovelace');
      expect(payload.customer_email).toBe('ada@example.com');
      expect(payload.shipping_address).toEqual({
        street: 'Av. Juárez 123',
        city: 'CDMX',
        state: 'CDMX',
        zip: '06600',
      });
      expect(payload.coupon_code).toBeUndefined();
      expect(returned).toEqual(successResult);

      const s = useCheckoutStore.getState();
      expect(s.submission.status).toBe('success');
      expect(s.submission.result?.purchaseNumber).toBe('PUR-1');
      expect(s.submission.result?.orders).toEqual([order]);
    });

    it('AC1: submit() envía el cupón aplicado como coupon_code', async () => {
      useCartStore.setState({ items: [makeItem()] });
      mockedCheckoutService.validateCoupon.mockResolvedValueOnce(validCoupon);
      await useCheckoutStore.getState().applyCoupon('TAGS50');
      mockedCheckoutService.requestOrders.mockResolvedValueOnce(successResult);

      await useCheckoutStore.getState().submit({ name: 'Ada', email: 'ada@example.com' });

      const [payload] = mockedCheckoutService.requestOrders.mock.calls[0];
      expect(payload.coupon_code).toBe('TAGS50');
    });

    it('AC2: ensureIdempotencyKey reutiliza la misma key con igual fingerprint', () => {
      const k1 = useCheckoutStore.getState().ensureIdempotencyKey('fp-1');
      const k2 = useCheckoutStore.getState().ensureIdempotencyKey('fp-1');

      expect(k2).toBe(k1);
      expect(k1).toMatch(/^[A-Za-z0-9._:-]{8,100}$/);
      expect(k1.length).toBeLessThanOrEqual(100);
    });

    it('AC4: ensureIdempotencyKey genera nueva key cuando cambia el fingerprint', () => {
      const k1 = useCheckoutStore.getState().ensureIdempotencyKey('fp-1');
      const k2 = useCheckoutStore.getState().ensureIdempotencyKey('fp-2');

      expect(k2).not.toBe(k1);
    });

    it('AC3: timeout y reintento usan la MISMA Idempotency-Key', async () => {
      useCartStore.setState({ items: [makeItem()] });
      mockedCheckoutService.requestOrders.mockRejectedValueOnce(
        new HttpError(0, 'Timeout', null, 'Request timeout', 'timeout'),
      );

      await useCheckoutStore.getState().submit({ name: 'Ada', email: 'ada@example.com' });
      expect(useCheckoutStore.getState().submission.status).toBe('error');
      const firstKey = mockedCheckoutService.requestOrders.mock.calls[0][1];

      mockedCheckoutService.requestOrders.mockResolvedValueOnce(successResult);
      await useCheckoutStore.getState().submit({ name: 'Ada', email: 'ada@example.com' });

      const secondKey = mockedCheckoutService.requestOrders.mock.calls[1][1];
      expect(secondKey).toBe(firstKey);
      expect(useCheckoutStore.getState().submission.status).toBe('success');
    });

    it('AC4: submit cambia de key al cambiar el email del carrito', async () => {
      useCartStore.setState({ items: [makeItem()] });
      mockedCheckoutService.requestOrders.mockRejectedValue(
        new HttpError(500, 'Server Error', null, 'HTTP 500'),
      );

      await useCheckoutStore.getState().submit({ name: 'Ada', email: 'a@example.com' });
      const firstKey = mockedCheckoutService.requestOrders.mock.calls[0][1];

      await useCheckoutStore.getState().submit({ name: 'Ada', email: 'b@example.com' });
      const secondKey = mockedCheckoutService.requestOrders.mock.calls[1][1];

      expect(secondKey).not.toBe(firstKey);
    });

    it('AC5: submit guest guarda access_token de la respuesta', async () => {
      useCartStore.setState({ items: [makeItem()] });
      mockedCheckoutService.requestOrders.mockResolvedValueOnce({
        ...successResult,
        accessToken: 'guest-token-123',
      });

      await useCheckoutStore.getState().submit({
        name: 'Invitado',
        email: 'guest@example.com',
      });

      expect(useCheckoutStore.getState().submission.result?.accessToken).toBe('guest-token-123');
    });

    it('AC6: 422 guarda el mensaje de validación, conserva la key y no crea pedido local', async () => {
      useCartStore.setState({ items: [makeItem()] });
      mockedCheckoutService.requestOrders.mockRejectedValueOnce(
        new HttpError(422, 'Unprocessable', { message: 'El correo no es válido.' }, 'HTTP 422'),
      );

      await useCheckoutStore.getState().submit({ name: 'Ada', email: 'bad' });

      const usedKey = mockedCheckoutService.requestOrders.mock.calls[0][1];
      const s = useCheckoutStore.getState();
      expect(s.submission.status).toBe('error');
      expect(s.submission.error).toBe('El correo no es válido.');
      expect(s.submission.result).toBeNull();
      expect(s.idempotencyKey).toBe(usedKey);
    });

    it('AC6: 409 regenera la key, informa y no crea pedido local', async () => {
      useCartStore.setState({ items: [makeItem()] });
      mockedCheckoutService.requestOrders.mockRejectedValueOnce(
        new HttpError(
          409,
          'Conflict',
          { message: 'La clave ya se usó con otro carrito.' },
          'HTTP 409',
        ),
      );

      await useCheckoutStore.getState().submit({ name: 'Ada', email: 'ada@example.com' });

      const usedKey = mockedCheckoutService.requestOrders.mock.calls[0][1];
      const s = useCheckoutStore.getState();
      expect(s.submission.status).toBe('error');
      expect(s.submission.error).toBe('La clave ya se usó con otro carrito.');
      expect(s.submission.result).toBeNull();
      expect(s.idempotencyKey).not.toBe(usedKey);
      expect(s.idempotencyKey).toMatch(/^[A-Za-z0-9._:-]{8,100}$/);
    });

    it('AC6: 429 guarda mensaje de espera y no crea pedido local', async () => {
      useCartStore.setState({ items: [makeItem()] });
      mockedCheckoutService.requestOrders.mockRejectedValueOnce(
        new HttpError(429, 'Too Many Requests', { message: 'Demasiadas solicitudes.' }, 'HTTP 429'),
      );

      await useCheckoutStore.getState().submit({ name: 'Ada', email: 'ada@example.com' });

      const s = useCheckoutStore.getState();
      expect(s.submission.status).toBe('error');
      expect(s.submission.error).toBe('Demasiadas solicitudes.');
      expect(s.submission.result).toBeNull();
    });

    it('AC6: 5xx conserva la key y expone un error de reintento', async () => {
      useCartStore.setState({ items: [makeItem()] });
      mockedCheckoutService.requestOrders.mockRejectedValue(
        new HttpError(500, 'Server Error', null, 'HTTP 500'),
      );

      await useCheckoutStore.getState().submit({ name: 'Ada', email: 'ada@example.com' });
      const firstKey = mockedCheckoutService.requestOrders.mock.calls[0][1];
      expect(useCheckoutStore.getState().submission.error).toBeTruthy();

      await useCheckoutStore.getState().submit({ name: 'Ada', email: 'ada@example.com' });
      expect(mockedCheckoutService.requestOrders.mock.calls[1][1]).toBe(firstKey);
    });

    it('tras éxito, el siguiente submit genera una key nueva', async () => {
      useCartStore.setState({ items: [makeItem()] });
      mockedCheckoutService.requestOrders.mockResolvedValue(successResult);

      await useCheckoutStore.getState().submit({ name: 'Ada', email: 'ada@example.com' });
      const firstKey = mockedCheckoutService.requestOrders.mock.calls[0][1];

      await useCheckoutStore.getState().submit({ name: 'Ada', email: 'ada@example.com' });
      const secondKey = mockedCheckoutService.requestOrders.mock.calls[1][1];

      expect(secondKey).not.toBe(firstKey);
    });

    it('submit() con carrito vacío no llama al service y expone error', async () => {
      useCartStore.setState({ items: [] });

      const result = await useCheckoutStore.getState().submit({ name: 'Ada', email: 'a@b.com' });

      expect(mockedCheckoutService.requestOrders).not.toHaveBeenCalled();
      expect(result).toBeNull();
      expect(useCheckoutStore.getState().submission.status).toBe('error');
    });

    it('reset() limpia submission e idempotencyKey', () => {
      useCheckoutStore.setState({
        idempotencyKey: 'ck_1234567890_abc',
        submission: { status: 'error', error: 'x', result: null },
      });

      useCheckoutStore.getState().reset();

      const s = useCheckoutStore.getState();
      expect(s.idempotencyKey).toBeNull();
      expect(s.submission).toEqual({ status: 'idle', error: null, result: null });
    });
  });

  describe('M3.4 — instrucciones de pago OXXO/SPEI', () => {
    const instructions: PaymentInstructionsResult = {
      orderNumber: 'ORD-1',
      paymentStatus: 'pending',
      paymentMethod: 'oxxo',
      total: 259,
      paymentDueAt: '2026-09-14T00:00:00Z',
      paymentInstructions: {
        type: 'supplier_manual',
        method: 'oxxo',
        reference: '1234567890',
        barcodeUrl: 'https://cdn.test/barcode.png',
        amount: 259,
      },
      demoMode: false,
    };

    it('estado inicial: sin instrucciones, idle, sin feedback de copiado', () => {
      const s = useCheckoutStore.getState();
      expect(s.paymentInstructions).toBeNull();
      expect(s.instructionsStatus).toBe('idle');
      expect(s.copiedLabel).toBeNull();
      expect(s.clipboardError).toBeNull();
    });

    it('AC1: fetchPaymentInstructions(orderNumber, email) puebla el store y status ready', async () => {
      mockedCheckoutService.getPaymentInstructions.mockResolvedValueOnce(instructions);

      await useCheckoutStore.getState().fetchPaymentInstructions('ORD-1', 'ada@example.com');

      expect(mockedCheckoutService.getPaymentInstructions).toHaveBeenCalledWith(
        'ORD-1',
        'ada@example.com',
      );
      const s = useCheckoutStore.getState();
      expect(s.paymentInstructions).toEqual(instructions);
      expect(s.instructionsStatus).toBe('ready');
      expect(s.instructionsError).toBeNull();
    });

    it('AC6: error de red deja instructionsStatus error y mensaje', async () => {
      mockedCheckoutService.getPaymentInstructions.mockRejectedValueOnce(new Error('network down'));

      await useCheckoutStore.getState().fetchPaymentInstructions('ORD-1', 'a@b.com');

      const s = useCheckoutStore.getState();
      expect(s.instructionsStatus).toBe('error');
      expect(s.instructionsError).toBe('network down');
    });

    it('AC4: copyToClipboard usa expo-clipboard con el valor correcto y registra feedback', async () => {
      mockedClipboard.setStringAsync.mockResolvedValueOnce(true);

      await useCheckoutStore.getState().copyToClipboard('CLABE', '012180000000000000');

      expect(mockedClipboard.setStringAsync).toHaveBeenCalledWith('012180000000000000');
      const s = useCheckoutStore.getState();
      expect(s.copiedLabel).toBe('CLABE');
      expect(s.clipboardError).toBeNull();
    });

    it('AC4: copyToClipboard hace no-op seguro si el portapapeles no está disponible (web)', async () => {
      mockedClipboard.setStringAsync.mockResolvedValueOnce(false);

      await useCheckoutStore.getState().copyToClipboard('CLABE', '012180000000000000');

      const s = useCheckoutStore.getState();
      expect(s.copiedLabel).toBeNull();
      expect(s.clipboardError).toBeTruthy();
    });

    it('AC4: copyToClipboard no rompe si setStringAsync rechaza', async () => {
      mockedClipboard.setStringAsync.mockRejectedValueOnce(new Error('denied'));

      await expect(
        useCheckoutStore.getState().copyToClipboard('Referencia', '123'),
      ).resolves.toBeUndefined();

      const s = useCheckoutStore.getState();
      expect(s.copiedLabel).toBeNull();
      expect(s.clipboardError).toBeTruthy();
    });

    it('M3.4: submit guarda el email del cliente para consultar instrucciones', async () => {
      useCartStore.setState({ items: [makeItem()] });
      mockedCheckoutService.requestOrders.mockResolvedValueOnce(successResult);

      await useCheckoutStore.getState().submit({ name: 'Ada', email: 'ada@example.com' });

      expect(useCheckoutStore.getState().lastCustomerEmail).toBe('ada@example.com');
    });

    it('reset() limpia instrucciones, feedback y email del cliente', () => {
      useCheckoutStore.setState({
        paymentInstructions: instructions,
        instructionsStatus: 'ready',
        copiedLabel: 'CLABE',
        clipboardError: 'x',
        lastCustomerEmail: 'ada@example.com',
      });

      useCheckoutStore.getState().reset();

      const s = useCheckoutStore.getState();
      expect(s.paymentInstructions).toBeNull();
      expect(s.instructionsStatus).toBe('idle');
      expect(s.copiedLabel).toBeNull();
      expect(s.clipboardError).toBeNull();
      expect(s.lastCustomerEmail).toBeNull();
    });
  });

  describe('M3.5 — comprobante de pago', () => {
    const asset = {
      uri: 'file:///tmp/comprobante.pdf',
      name: 'comprobante.pdf',
      type: 'application/pdf',
      size: 1024,
    };

    const proofResponse = {
      message: 'Comprobante enviado. El proveedor revisará tu pago.',
      paymentStatus: 'proof_submitted',
      paymentProofUrl: 'https://cdn.test/proof.pdf',
    };

    const refreshed: PaymentInstructionsResult = {
      orderNumber: 'ORD-1',
      paymentStatus: 'proof_submitted',
      paymentMethod: 'spei',
      total: 259,
      paymentDueAt: '2099-09-14T00:00:00Z',
      paymentInstructions: null,
      demoMode: false,
    };

    it('estado inicial: proof idle, sin error ni url', () => {
      const s = useCheckoutStore.getState();
      expect(s.proof).toEqual({ status: 'idle', error: null, url: null });
    });

    it('AC1/AC3: submitProof sube el comprobante y refresca las instrucciones', async () => {
      mockedCheckoutService.uploadPaymentProof.mockResolvedValueOnce(proofResponse);
      mockedCheckoutService.getPaymentInstructions.mockResolvedValueOnce(refreshed);

      const ok = await useCheckoutStore
        .getState()
        .submitProof('ORD-1', 'ada@example.com', asset);

      expect(ok).toBe(true);
      expect(mockedCheckoutService.uploadPaymentProof).toHaveBeenCalledWith(
        'ORD-1',
        'ada@example.com',
        asset,
      );
      const s = useCheckoutStore.getState();
      expect(s.proof.status).toBe('success');
      expect(s.proof.url).toBe('https://cdn.test/proof.pdf');
      expect(s.proof.error).toBeNull();
      expect(mockedCheckoutService.getPaymentInstructions).toHaveBeenCalledWith(
        'ORD-1',
        'ada@example.com',
      );
      expect(s.paymentInstructions?.paymentStatus).toBe('proof_submitted');
    });

    it('AC2: archivo >8 MB no llama al service y expone error inline', async () => {
      const oversized = { ...asset, size: 8 * 1024 * 1024 + 1 };

      const ok = await useCheckoutStore
        .getState()
        .submitProof('ORD-1', 'ada@example.com', oversized);

      expect(ok).toBe(false);
      expect(mockedCheckoutService.uploadPaymentProof).not.toHaveBeenCalled();
      const s = useCheckoutStore.getState();
      expect(s.proof.status).toBe('error');
      expect(s.proof.error).toBeTruthy();
      expect(s.proof.url).toBeNull();
    });

    it('AC2: tipo no permitido no llama al service y expone error inline', async () => {
      const unsupported = {
        uri: 'file:///tmp/contrato.docx',
        name: 'contrato.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 2048,
      };

      const ok = await useCheckoutStore
        .getState()
        .submitProof('ORD-1', 'ada@example.com', unsupported);

      expect(ok).toBe(false);
      expect(mockedCheckoutService.uploadPaymentProof).not.toHaveBeenCalled();
      const s = useCheckoutStore.getState();
      expect(s.proof.status).toBe('error');
      expect(s.proof.error).toBeTruthy();
    });

    it('AC2: acepta por extensión cuando el asset no trae mimeType', async () => {
      mockedCheckoutService.uploadPaymentProof.mockResolvedValueOnce(proofResponse);
      mockedCheckoutService.getPaymentInstructions.mockResolvedValueOnce(refreshed);

      const ok = await useCheckoutStore.getState().submitProof('ORD-1', 'a@b.com', {
        uri: 'file:///tmp/foto.jpg',
        name: 'FOTO.JPG',
        type: null,
        size: 2048,
      });

      expect(ok).toBe(true);
      expect(mockedCheckoutService.uploadPaymentProof).toHaveBeenCalledTimes(1);
    });

    it('AC4: 422 expone el mensaje del backend y permite reintentar', async () => {
      mockedCheckoutService.uploadPaymentProof.mockRejectedValueOnce(
        new HttpError(
          422,
          'Unprocessable Entity',
          { message: 'Este pedido no acepta comprobantes en este momento' },
          'HTTP 422',
        ),
      );

      const first = await useCheckoutStore
        .getState()
        .submitProof('ORD-1', 'ada@example.com', asset);

      expect(first).toBe(false);
      let s = useCheckoutStore.getState();
      expect(s.proof.status).toBe('error');
      expect(s.proof.error).toBe('Este pedido no acepta comprobantes en este momento');
      expect(s.proof.url).toBeNull();

      mockedCheckoutService.uploadPaymentProof.mockResolvedValueOnce(proofResponse);
      mockedCheckoutService.getPaymentInstructions.mockResolvedValueOnce(refreshed);

      const retry = await useCheckoutStore
        .getState()
        .submitProof('ORD-1', 'ada@example.com', asset);

      expect(retry).toBe(true);
      s = useCheckoutStore.getState();
      expect(s.proof.status).toBe('success');
      expect(s.proof.error).toBeNull();
    });

    it('AC4: error de red usa el mensaje del error', async () => {
      mockedCheckoutService.uploadPaymentProof.mockRejectedValueOnce(new Error('network down'));

      const ok = await useCheckoutStore
        .getState()
        .submitProof('ORD-1', 'ada@example.com', asset);

      expect(ok).toBe(false);
      expect(useCheckoutStore.getState().proof.error).toBe('network down');
    });

    it('AC4: error sin mensaje usa el fallback en español', async () => {
      mockedCheckoutService.uploadPaymentProof.mockRejectedValueOnce(new HttpError(500, 'Server', null, 'HTTP 500'));

      await useCheckoutStore.getState().submitProof('ORD-1', 'ada@example.com', asset);

      expect(useCheckoutStore.getState().proof.error).toBe(
        'No pudimos enviar tu comprobante. Intenta de nuevo.',
      );
    });

    it('AC5: reset limpia el estado del comprobante', () => {
      useCheckoutStore.setState({
        proof: { status: 'success', error: null, url: 'https://cdn.test/proof.pdf' },
      });

      useCheckoutStore.getState().reset();

      expect(useCheckoutStore.getState().proof).toEqual({
        status: 'idle',
        error: null,
        url: null,
      });
    });
  });
});

describe('paymentProofAssetError — validación MIME/extensión (#21)', () => {
  it('acepta cuando el MIME es permitido', () => {
    expect(
      paymentProofAssetError({ uri: 'file:///a', name: 'a.bin', type: 'image/jpeg', size: 1 }),
    ).toBeNull();
  });

  it('rechaza cuando el MIME está presente pero no permitido, aunque la extensión lo parezca', () => {
    expect(
      paymentProofAssetError({
        uri: 'file:///a',
        name: 'nota.pdf',
        type: 'text/plain',
        size: 1,
      }),
    ).toBe('Solo aceptamos imágenes JPG, PNG, WEBP o PDF.');
  });

  it('cae a la extensión solo cuando el picker omite el MIME', () => {
    expect(
      paymentProofAssetError({ uri: 'file:///a', name: 'nota.pdf', type: null, size: 1 }),
    ).toBeNull();
    expect(
      paymentProofAssetError({ uri: 'file:///a', name: 'nota.exe', type: null, size: 1 }),
    ).toBe('Solo aceptamos imágenes JPG, PNG, WEBP o PDF.');
  });

  it('rechaza archivos mayores a 8 MB', () => {
    expect(
      paymentProofAssetError({
        uri: 'file:///a',
        name: 'a.jpg',
        type: 'image/jpeg',
        size: 8 * 1024 * 1024 + 1,
      }),
    ).toBe('El archivo supera el máximo de 8 MB.');
  });
});

