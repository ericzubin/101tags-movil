import { httpClient } from '@/core/api/client';

import type { CouponDefinition } from '@/core/models/coupon.model';

export interface GetCouponsParams {
  email?: string;
  q?: string;
}

/**
 * Cuponera API — `GET /coupons?email=&q=` returns the active, non-expired
 * coupons assigned to `email` (or public ones), already filtered server-side.
 * `httpClient` injects the bearer token and normalizes the response keys.
 *
 * @see .spec/2026-09-11-m6-2-coupons.md §Contratos
 */
export const couponService = {
  async getCoupons(params: GetCouponsParams = {}): Promise<CouponDefinition[]> {
    const query: Record<string, string> = {};
    if (params.email) query.email = params.email;
    if (params.q) query.q = params.q;

    const res = await httpClient.request<{ data: CouponDefinition[] }>('/coupons', {
      method: 'GET',
      query,
    });
    return res.data ?? [];
  },
};
