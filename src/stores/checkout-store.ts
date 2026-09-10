import { create } from 'zustand';

import { checkoutService } from '@/core/services/checkout-service';
import { useCartStore } from '@/stores/cart-store';

import type {
  AddressField,
  AddressFieldErrors,
  CheckoutConfig,
  CheckoutPolicies,
  CouponValidation,
  PostalSettlement,
  ShippingAddress,
} from '@/core/models/checkout.model';
import { CHECKOUT_SEGMENT, EMPTY_SHIPPING_ADDRESS, SHIPPING_COST } from '@/core/models/checkout.model';

export type CheckoutStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface CheckoutState {
  config: CheckoutConfig | null;
  policies: CheckoutPolicies | null;
  address: ShippingAddress;
  settlements: PostalSettlement[];
  coupon: CouponValidation | null;
  couponMessage: string | null;
  fieldErrors: AddressFieldErrors;
  status: CheckoutStatus;
  error: string | null;
  fetchConfig: () => Promise<void>;
  fetchPolicies: () => Promise<void>;
  setAddressField: (field: AddressField, value: string) => Promise<void>;
  setAddress: (partial: Partial<ShippingAddress>) => void;
  validate: () => boolean;
  applyCoupon: (code: string) => Promise<void>;
  clearCoupon: () => void;
  reset: () => void;
}

const POSTAL_NOT_FOUND =
  'No encontramos colonias para ese código postal. Puedes escribir tu colonia manualmente.';

function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function initialState() {
  return {
    config: null,
    policies: null,
    address: { ...EMPTY_SHIPPING_ADDRESS },
    settlements: [] as PostalSettlement[],
    coupon: null,
    couponMessage: null,
    fieldErrors: {} as AddressFieldErrors,
    status: 'idle' as CheckoutStatus,
    error: null,
  };
}

/**
 * Checkout store — owns the checkout config, the shipping address draft and
 * the applied coupon. The cart (prices, quantities, totals) stays in
 * `cartStore`; this store never recomputes line prices.
 *
 * @see .spec/2026-09-11-m3-2-checkout-address.md §Arquitectura
 */
export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  ...initialState(),

  fetchConfig: async () => {
    set({ status: 'loading', error: null });
    try {
      const config = await checkoutService.getConfig();
      set({ config, status: 'ready', error: null });
    } catch (err) {
      set({ status: 'error', error: toErrorMessage(err, 'No pudimos cargar el checkout.') });
    }
  },

  fetchPolicies: async () => {
    try {
      const policies = await checkoutService.getPolicies();
      set({ policies });
    } catch (err) {
      set({ error: toErrorMessage(err, 'No pudimos cargar las políticas.') });
    }
  },

  setAddressField: async (field, value) => {
    set((state) => ({
      address: { ...state.address, [field]: value },
      fieldErrors: { ...state.fieldErrors, [field]: undefined },
    }));

    if (field !== 'zip') return;

    const cp = digitsOnly(value);
    if (cp.length !== 5) {
      set({ settlements: [] });
      return;
    }

    try {
      const lookup = await checkoutService.lookupPostalCode(cp);
      set((state) => ({
        address: {
          ...state.address,
          state: lookup.state,
          city: lookup.city,
        },
        settlements: lookup.settlements,
      }));
    } catch {
      set((state) => ({
        settlements: [],
        fieldErrors: { ...state.fieldErrors, zip: POSTAL_NOT_FOUND },
      }));
    }
  },

  setAddress: (partial) => {
    set((state) => ({ address: { ...state.address, ...partial } }));
  },

  validate: () => {
    const { address } = get();
    const fieldErrors: AddressFieldErrors = {};

    if (!address.street.trim()) fieldErrors.street = 'Ingresa tu calle y número.';
    if (!address.city.trim()) fieldErrors.city = 'Ingresa tu ciudad.';
    if (!address.state.trim()) fieldErrors.state = 'Ingresa tu estado.';
    if (!/^\d{5}$/.test(address.zip.trim())) {
      fieldErrors.zip = 'El código postal debe tener 5 dígitos.';
    }

    set({ fieldErrors });
    return Object.keys(fieldErrors).length === 0;
  },

  applyCoupon: async (code) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    const items = useCartStore
      .getState()
      .items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity }));

    try {
      const result = await checkoutService.validateCoupon({
        code: trimmed,
        segment: CHECKOUT_SEGMENT,
        shipping_cost: SHIPPING_COST,
        items,
      });

      if (result.valid) {
        set({ coupon: result, couponMessage: result.message });
      } else {
        set({ coupon: null, couponMessage: result.message });
      }
    } catch (err) {
      set({
        coupon: null,
        couponMessage: toErrorMessage(err, 'No pudimos validar el cupón. Intenta de nuevo.'),
      });
    }
  },

  clearCoupon: () => set({ coupon: null, couponMessage: null }),

  reset: () => set({ ...initialState() }),
}));
