import { httpClient } from '@/core/api/client';
import { contentService } from '@/core/services/content-service';

import type {
  CheckoutConfig,
  CheckoutPolicies,
  CouponValidation,
  PaymentInstructionsResult,
  PaymentProofAsset,
  PaymentProofResult,
  PostalCodeLookup,
  RequestOrdersPayload,
  RequestOrdersResult,
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

  /** `/policies` now lives in `contentService` (shared with the legal screens). */
  async getPolicies(): Promise<CheckoutPolicies> {
    return contentService.getPolicies();
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

  /**
   * Fetch the OXXO/SPEI payment instructions for an order. The backend scopes
   * the order to the matching `email`, so it is required even for guests.
   */
  async getPaymentInstructions(
    orderNumber: string,
    email: string,
  ): Promise<PaymentInstructionsResult> {
    return httpClient.request<PaymentInstructionsResult>(
      `/checkout/payment-instructions/${encodeURIComponent(orderNumber)}`,
      { method: 'GET', query: { email } },
    );
  },

  /**
   * Upload a payment proof for a `supplier_*` order. The backend expects
   * `multipart/form-data`, so we build a `FormData` with `email` + `proof`
   * and let the runtime set the multipart boundary (no manual `Content-Type`).
   */
  async uploadPaymentProof(
    orderNumber: string,
    email: string,
    file: PaymentProofAsset,
  ): Promise<PaymentProofResult> {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('proof', {
      uri: file.uri,
      name: file.name,
      type: file.type || 'application/octet-stream',
    } as unknown as Blob);

    return httpClient.request<PaymentProofResult>(
      `/checkout/orders/${encodeURIComponent(orderNumber)}/payment-proof`,
      { method: 'POST', body: formData },
    );
  },

  /**
   * Create the requested orders. `Idempotency-Key` is only sent when a key is
   * provided, so a retry after a timeout reuses the same key and the backend
   * replays the existing purchase instead of duplicating it.
   */
  async requestOrders(
    payload: RequestOrdersPayload,
    idempotencyKey?: string,
  ): Promise<RequestOrdersResult> {
    return httpClient.request<RequestOrdersResult>('/checkout/request-orders', {
      method: 'POST',
      body: payload,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    });
  },
};
