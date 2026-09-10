import type {
  CheckoutConfig,
  CouponValidation,
  PaymentInstructions,
  PostalCodeLookup,
  ShippingAddress,
} from '@/core/models/checkout.model';
import { EMPTY_SHIPPING_ADDRESS, SHIPPING_COST } from '@/core/models/checkout.model';
import { toCamel } from '@/core/utils/snake-camel';

const rawConfig = {
  payment_mode: 'supplier_manual',
  payment_methods: { card: false, oxxo: true, spei: true },
  house_payment_available: true,
  house_supplier_ids: [1, 4],
  house_payment_methods: { card: true, oxxo: true, spei: true },
  oxxo_due_hours: 72,
  spei_due_hours: 48,
  demo_mode: false,
  manual_payment_disclaimer: 'Pago manual del proveedor',
  openpay_enabled: false,
  openpay_merchant_id: null,
  openpay_public_key: null,
  openpay_sandbox: true,
  platform_openpay_enabled: true,
  platform_openpay_public_key: 'pk_test',
  platform_openpay_merchant_id: 'm_test',
};

const rawPostal = {
  postal_code: '06600',
  state: 'Ciudad de México',
  state_code: 'CDMX',
  municipality: 'Cuauhtémoc',
  city: 'Ciudad de México',
  settlements: [
    { name: 'Juárez', type: 'Colonia' },
    { name: 'Tabacalera', type: null },
  ],
};

const rawCoupon = {
  valid: true,
  message: 'Cupón aplicado.',
  discount_amount: 50,
  shipping_discount: 0,
  eligible_subtotal: 300,
  coupon: {
    id: 'api-1',
    code: 'TAGS50',
    issuer: 'platform',
    title: '50 pesos',
    description: 'Descuento',
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
  },
};

describe('checkout.model', () => {
  it('CheckoutConfig expone los campos camelCase del contrato (snake → toCamel)', () => {
    const config = toCamel<CheckoutConfig>(rawConfig);

    expect(config.paymentMode).toBe('supplier_manual');
    expect(config.paymentMethods).toEqual({ card: false, oxxo: true, spei: true });
    expect(config.housePaymentAvailable).toBe(true);
    expect(config.houseSupplierIds).toEqual([1, 4]);
    expect(config.housePaymentMethods).toEqual({ card: true, oxxo: true, spei: true });
    expect(config.oxxoDueHours).toBe(72);
    expect(config.speiDueHours).toBe(48);
    expect(config.demoMode).toBe(false);
    expect(config.manualPaymentDisclaimer).toBe('Pago manual del proveedor');
    expect(config.platformOpenpayEnabled).toBe(true);
    expect(config.platformOpenpayPublicKey).toBe('pk_test');
    expect(config.platformOpenpayMerchantId).toBe('m_test');
  });

  it('PostalCodeLookup mapea colonias y acepta type null', () => {
    const lookup = toCamel<PostalCodeLookup>(rawPostal);

    expect(lookup.postalCode).toBe('06600');
    expect(lookup.state).toBe('Ciudad de México');
    expect(lookup.stateCode).toBe('CDMX');
    expect(lookup.municipality).toBe('Cuauhtémoc');
    expect(lookup.city).toBe('Ciudad de México');
    expect(lookup.settlements).toEqual([
      { name: 'Juárez', type: 'Colonia' },
      { name: 'Tabacalera', type: null },
    ]);
  });

  it('CouponValidation expone montos camelCase y cupón', () => {
    const result = toCamel<CouponValidation>(rawCoupon);

    expect(result.valid).toBe(true);
    expect(result.message).toBe('Cupón aplicado.');
    expect(result.discountAmount).toBe(50);
    expect(result.shippingDiscount).toBe(0);
    expect(result.eligibleSubtotal).toBe(300);
    expect(result.coupon?.code).toBe('TAGS50');
  });

  it('CouponValidation inválido no requiere cupón', () => {
    const result: CouponValidation = {
      valid: false,
      message: 'Código no válido.',
      discountAmount: 0,
      shippingDiscount: 0,
      eligibleSubtotal: 0,
    };

    expect(result.valid).toBe(false);
    expect(result.coupon).toBeUndefined();
  });

  it('PaymentInstructions acepta los campos snake de OpenPay/SPEI/OXXO (toCamel)', () => {
    const instructions = toCamel<PaymentInstructions>({
      type: 'supplier_manual',
      method: 'spei',
      clabe: '012180000000000000',
      barcode_url: 'https://cdn.test/barcode.png',
      oxxo_reference: '1234567890',
      due_at: '2026-09-12T00:00:00Z',
      amount: 150,
      demo: true,
    });

    expect(instructions.method).toBe('spei');
    expect(instructions.clabe).toBe('012180000000000000');
    expect(instructions.barcodeUrl).toBe('https://cdn.test/barcode.png');
    expect(instructions.oxxoReference).toBe('1234567890');
    expect(instructions.dueAt).toBe('2026-09-12T00:00:00Z');
    expect(instructions.amount).toBe(150);
    expect(instructions.demo).toBe(true);
  });

  it('ShippingAddress y constantes del checkout', () => {
    const address: ShippingAddress = {
      street: 'Av. Juárez 123',
      city: 'Ciudad de México',
      state: 'Ciudad de México',
      zip: '06600',
      neighborhood: 'Juárez',
    };

    expect(address.neighborhood).toBe('Juárez');
    expect(EMPTY_SHIPPING_ADDRESS.zip).toBe('');
    expect(SHIPPING_COST).toBe(99);
  });
});
