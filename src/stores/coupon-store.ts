import { create } from 'zustand';

import { registerSessionReset } from '@/core/session/reset';
import { couponService } from '@/core/services/coupon-service';

import type { CouponDefinition } from '@/core/models/coupon.model';

export type CouponStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface CouponState {
  coupons: CouponDefinition[];
  query: string;
  status: CouponStatus;
  error: string | null;
  fetchCoupons: (email?: string) => Promise<void>;
  setQuery: (query: string) => void;
  reset: () => void;
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'No pudimos cargar tus cupones.';
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Monotonic sequence guarding against stale responses. A slow in-flight
 * `fetchCoupons` must not repopulate the wallet after `reset()` (logout), so
 * its result is applied only when it is still the most recent request.
 */
let couponRequestSeq = 0;

/**
 * Client-side search over the already-fetched cuponera (AC3). The backend also
 * accepts `q` (see `couponService.getCoupons`), but filtering locally keeps the
 * search instant and avoids a round-trip per keystroke.
 */
export function filterCoupons(coupons: CouponDefinition[], query: string): CouponDefinition[] {
  const needle = normalize(query);
  if (!needle) return coupons;

  return coupons.filter((coupon) => {
    const haystack = normalize(
      [
        coupon.code,
        coupon.title,
        coupon.description,
        coupon.storeName ?? '',
        (coupon.keywords ?? []).join(' '),
      ].join(' '),
    );
    return haystack.includes(needle);
  });
}

/**
 * Coupon wallet (cuponera) store. Owns the assigned/public coupon list fetched
 * from `GET /coupons` and the search term. Applying a coupon is NOT done here:
 * the screen delegates to `checkout-store.applyCoupon`, which reuses the real
 * `checkoutService.validateCoupon` (AC4, single source of validation rules).
 *
 * @see .spec/2026-09-11-m6-2-coupons.md §Arquitectura
 */
export const useCouponStore = create<CouponState>((set) => ({
  coupons: [],
  query: '',
  status: 'idle',
  error: null,

  fetchCoupons: async (email) => {
    const seq = ++couponRequestSeq;
    set({ status: 'loading', error: null });
    try {
      const coupons = await couponService.getCoupons(email ? { email } : {});
      if (seq !== couponRequestSeq) return;
      set({ coupons, status: 'ready', error: null });
    } catch (err) {
      if (seq !== couponRequestSeq) return;
      set({ status: 'error', error: toErrorMessage(err) });
    }
  },

  setQuery: (query) => set({ query }),

  reset: () => {
    couponRequestSeq += 1;
    set({ coupons: [], query: '', status: 'idle', error: null });
  },
}));

/**
 * Session-scoped state must not leak between accounts: signing out wipes the
 * cuponera and invalidates any in-flight fetch. Registered at import time;
 * executed by `auth-store.clearSession`.
 */
registerSessionReset(() => useCouponStore.getState().reset());
