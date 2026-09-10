import { httpClient } from '@/core/api/client';

import type {
  CheckoutConfig,
  CheckoutPolicies,
  CouponValidation,
  PostalCodeLookup,
} from '@/core/models/checkout.model';

/** Request body for `POST /coupons/validate` — backend expects snake_case. */
export interface CouponValidationRequest {
  code: string;
  segment: 'basicos';
  shipping_cost: number;
  customer_email?: string;
  items: { variant_id: number; quantity: number }[];
}

export const checkoutService = {
  async getConfig(): Promise<CheckoutConfig> {
    return httpClient.request<CheckoutConfig>('/checkout/config', { method: 'GET' });
  },

  async getPolicies(): Promise<CheckoutPolicies> {
    return httpClient.request<CheckoutPolicies>('/policies', { method: 'GET' });
  },

  async lookupPostalCode(postalCode: string): Promise<PostalCodeLookup> {
    const { data } = await httpClient.request<{ data: PostalCodeLookup }>(
      `/postal-codes/${encodeURIComponent(postalCode)}`,
      { method: 'GET' },
    );
    return data;
  },

  async validateCoupon(payload: CouponValidationRequest): Promise<CouponValidation> {
    const res = await httpClient.request<CouponValidation>('/coupons/validate', {
      method: 'POST',
      body: payload,
    });
    return {
      valid: res.valid,
      message: res.message,
      coupon: res.coupon,
      discountAmount: res.discountAmount ?? 0,
      shippingDiscount: res.shippingDiscount ?? 0,
      eligibleSubtotal: res.eligibleSubtotal ?? 0,
    };
  },
};
