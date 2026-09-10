import { toCamel } from '@/core/utils/snake-camel';

import { couponDiscountLabel, formatCouponExpiry } from '@/core/models/coupon.model';

import type { CouponDefinition, CouponValidation } from '@/core/models/coupon.model';

const rawCoupon = {
  id: 'api-1',
  code: 'TAGS50',
  issuer: 'platform',
  title: '50 pesos de regalo',
  description: 'Descuento de bienvenida',
  discount_type: 'fixed',
  value: 50,
  min_subtotal: 200,
  segment: 'basicos',
  store_slug: null,
  store_name: null,
  assigned_emails: ['a@b.com'],
  expires_at: '2026-09-15',
  one_time: false,
  keywords: ['bienvenida'],
};

/**
 * Contract test for the coupon model. `httpClient` applies `toCamel`, so the
 * assertions pin the camelCase field names consumed by service/store/UI, plus
 * the pure display helpers (discount label + expiry).
 *
 * @see .spec/2026-09-11-m6-2-coupons.md §Contratos
 */
describe('coupon.model', () => {
  it('AC1: CouponDefinition expone las claves camelCase del contrato (snake → toCamel)', () => {
    const coupon = toCamel<CouponDefinition>(rawCoupon);

    expect(coupon.id).toBe('api-1');
    expect(coupon.code).toBe('TAGS50');
    expect(coupon.issuer).toBe('platform');
    expect(coupon.title).toBe('50 pesos de regalo');
    expect(coupon.description).toBe('Descuento de bienvenida');
    expect(coupon.discountType).toBe('fixed');
    expect(coupon.value).toBe(50);
    expect(coupon.minSubtotal).toBe(200);
    expect(coupon.segment).toBe('basicos');
    expect(coupon.storeSlug).toBeNull();
    expect(coupon.storeName).toBeNull();
    expect(coupon.assignedEmails).toEqual(['a@b.com']);
    expect(coupon.expiresAt).toBe('2026-09-15');
    expect(coupon.oneTime).toBe(false);
    expect(coupon.keywords).toEqual(['bienvenida']);
  });

  it('AC2: CouponValidation se alinea con checkout (montos camelCase, cupón opcional)', () => {
    const result: CouponValidation = {
      valid: true,
      message: 'Cupón aplicado.',
      discountAmount: 50,
      shippingDiscount: 0,
      eligibleSubtotal: 300,
    };

    expect(result.valid).toBe(true);
    expect(result.coupon).toBeUndefined();
  });

  it('AC2: couponDiscountLabel elige porcentaje / fijo / envío gratis', () => {
    expect(couponDiscountLabel({ discountType: 'percent', value: 15 })).toBe('15% de descuento');
    expect(couponDiscountLabel({ discountType: 'fixed', value: 50 })).toBe('$50 de descuento');
    expect(couponDiscountLabel({ discountType: 'shipping', value: 100 })).toBe('Envío gratis');
  });

  it('AC2: couponDiscountLabel usa un genérico si el tipo es desconocido', () => {
    expect(couponDiscountLabel({ discountType: 'otro', value: 1 })).toBe('Descuento');
  });

  it('AC2: formatCouponExpiry devuelve una fecha legible estable', () => {
    expect(formatCouponExpiry('2026-09-15')).toBe('15 sep 2026');
  });

  it('AC2: formatCouponExpiry null/vacío/inválido → null', () => {
    expect(formatCouponExpiry(null)).toBeNull();
    expect(formatCouponExpiry('')).toBeNull();
    expect(formatCouponExpiry('no-es-fecha')).toBeNull();
  });
});
