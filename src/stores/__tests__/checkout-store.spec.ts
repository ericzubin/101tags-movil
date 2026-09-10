import type { CartItem } from '@/core/models/cart.model';
import type { CheckoutConfig, CouponValidation, PostalCodeLookup } from '@/core/models/checkout.model';
import { checkoutService } from '@/core/services/checkout-service';
import { useCartStore } from '@/stores/cart-store';
import { useCheckoutStore } from '@/stores/checkout-store';

jest.mock('@/core/services/checkout-service', () => ({
  checkoutService: {
    getConfig: jest.fn(),
    getPolicies: jest.fn(),
    lookupPostalCode: jest.fn(),
    validateCoupon: jest.fn(),
  },
}));

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
});
