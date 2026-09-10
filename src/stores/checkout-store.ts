import * as Clipboard from 'expo-clipboard';
import { create } from 'zustand';

import { HttpError } from '@/core/api/client';
import { checkoutService } from '@/core/services/checkout-service';
import { useCartStore } from '@/stores/cart-store';

import type {
  AddressField,
  AddressFieldErrors,
  CheckoutConfig,
  CheckoutOrderItem,
  CheckoutPolicies,
  CouponValidation,
  PaymentInstructionsResult,
  PaymentMethod,
  PaymentProofAsset,
  PostalSettlement,
  RequestOrdersPayload,
  RequestOrdersResult,
  ShippingAddress,
} from '@/core/models/checkout.model';
import { CHECKOUT_SEGMENT, EMPTY_SHIPPING_ADDRESS, SHIPPING_COST } from '@/core/models/checkout.model';

export type CheckoutStatus = 'idle' | 'loading' | 'ready' | 'error';

export type CheckoutSubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

export type PaymentInstructionsStatus = 'idle' | 'loading' | 'ready' | 'error';

export type PaymentProofStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface PaymentProofSubmission {
  status: PaymentProofStatus;
  error: string | null;
  url: string | null;
}

const CLIPBOARD_ERROR = 'No pudimos copiar automáticamente. Selecciona el dato manualmente.';

export const PAYMENT_PROOF_MAX_BYTES = 8 * 1024 * 1024;
export const PAYMENT_PROOF_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;
export const PAYMENT_PROOF_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'] as const;
export const PAYMENT_PROOF_TYPE_ERROR = 'Solo aceptamos imágenes JPG, PNG, WEBP o PDF.';
export const PAYMENT_PROOF_SIZE_ERROR = 'El archivo supera el máximo de 8 MB.';

/**
 * Client-side UX validation for a picked proof. The backend remains the
 * authority; this only avoids a doomed round-trip for obvious mistakes.
 */
export function paymentProofAssetError(asset: PaymentProofAsset): string | null {
  if (typeof asset.size === 'number' && asset.size > PAYMENT_PROOF_MAX_BYTES) {
    return PAYMENT_PROOF_SIZE_ERROR;
  }

  const mime = (asset.type ?? '').trim().toLowerCase();
  const extension = (asset.name.split('.').pop() ?? '').trim().toLowerCase();
  const mimeAllowed = (PAYMENT_PROOF_ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
  const extensionAllowed = (PAYMENT_PROOF_ALLOWED_EXTENSIONS as readonly string[]).includes(
    extension,
  );

  // A present-but-invalid MIME must win over a coincidentally valid extension
  // (`nota.pdf` + `text/plain`); the extension is only a fallback when the
  // picker omits the MIME entirely (backend remains the authority).
  if (mime) return mimeAllowed ? null : PAYMENT_PROOF_TYPE_ERROR;
  return extensionAllowed ? null : PAYMENT_PROOF_TYPE_ERROR;
}

/** Customer data captured on the review screen (prefilled for auth, editable for guest). */
export interface CheckoutCustomer {
  name: string;
  email: string;
  phone?: string;
  housePaymentMethod?: PaymentMethod;
}

export interface CheckoutSubmission {
  status: CheckoutSubmissionStatus;
  error: string | null;
  result: RequestOrdersResult | null;
}

export interface CheckoutState {
  config: CheckoutConfig | null;
  policies: CheckoutPolicies | null;
  address: ShippingAddress;
  settlements: PostalSettlement[];
  coupon: CouponValidation | null;
  couponCode: string | null;
  couponMessage: string | null;
  couponCartFingerprint: string | null;
  fieldErrors: AddressFieldErrors;
  status: CheckoutStatus;
  error: string | null;
  idempotencyKey: string | null;
  idempotencyFingerprint: string | null;
  submission: CheckoutSubmission;
  paymentInstructions: PaymentInstructionsResult | null;
  instructionsStatus: PaymentInstructionsStatus;
  instructionsError: string | null;
  copiedLabel: string | null;
  clipboardError: string | null;
  lastCustomerEmail: string | null;
  proof: PaymentProofSubmission;
  fetchConfig: () => Promise<void>;
  fetchPolicies: () => Promise<void>;
  setAddressField: (field: AddressField, value: string) => Promise<void>;
  setAddress: (partial: Partial<ShippingAddress>) => void;
  validate: () => boolean;
  applyCoupon: (code: string) => Promise<void>;
  clearCoupon: () => void;
  ensureIdempotencyKey: (fingerprint: string) => string;
  submit: (customer: CheckoutCustomer) => Promise<RequestOrdersResult | null>;
  fetchPaymentInstructions: (orderNumber: string, email: string) => Promise<void>;
  submitProof: (orderNumber: string, email: string, asset: PaymentProofAsset) => Promise<boolean>;
  copyToClipboard: (label: string, value: string) => Promise<void>;
  reset: () => void;
}

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,100}$/;

/**
 * RFC 4122 v4 UUID. Prefers the platform `crypto.randomUUID()` and falls back
 * to a `Math.random` v4 when the runtime has no WebCrypto (Hermes). The
 * idempotency key is not a secret, so the fallback is acceptable; the backend
 * only requires a stable, unique, regex-compatible value (#19).
 */
function uuidV4(): string {
  const webCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (webCrypto && typeof webCrypto.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * Stable UUID for `Idempotency-Key` (#19). The backend regex
 * `^[A-Za-z0-9._:-]{8,100}$` accepts a v4 UUID as-is.
 */
export function generateIdempotencyKey(): string {
  const key = uuidV4();
  return IDEMPOTENCY_KEY_PATTERN.test(key) ? key : uuidV4();
}

/**
 * Local fingerprint of the logical checkout attempt. Mirrors the backend's
 * idempotency fingerprint inputs: sorted items + email + coupon + house
 * payment method. A change here means the previous key must not be reused.
 */
export function checkoutFingerprint(input: {
  items: CheckoutOrderItem[];
  email: string;
  couponCode?: string | null;
  housePaymentMethod?: string | null;
}): string {
  const items = input.items
    .map((item) => [Number(item.variant_id), Number(item.quantity)] as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return JSON.stringify([
    items,
    input.email.trim().toLowerCase(),
    (input.couponCode ?? '').trim().toUpperCase(),
    input.housePaymentMethod ?? null,
  ]);
}

function submissionErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpError) {
    const body = err.body;
    if (
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof (body as { message?: unknown }).message === 'string' &&
      (body as { message: string }).message
    ) {
      return (body as { message: string }).message;
    }
    return fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
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

/**
 * Stable signature of the cart contents a coupon was validated against. Used to
 * detect that the cart changed after applying a coupon so a stale discount is
 * never submitted (#18). Sorting by `variantId` keeps it order-independent.
 */
export function cartSignature(items: { variantId: number; quantity: number }[]): string {
  return JSON.stringify(
    items
      .map((item) => [item.variantId, item.quantity] as [number, number])
      .sort((a, b) => a[0] - b[0]),
  );
}

function initialState() {
  return {
    config: null,
    policies: null,
    address: { ...EMPTY_SHIPPING_ADDRESS },
    settlements: [] as PostalSettlement[],
    coupon: null,
    couponCode: null,
    couponMessage: null,
    couponCartFingerprint: null,
    fieldErrors: {} as AddressFieldErrors,
    status: 'idle' as CheckoutStatus,
    error: null,
    idempotencyKey: null,
    idempotencyFingerprint: null,
    submission: { status: 'idle', error: null, result: null } as CheckoutSubmission,
    paymentInstructions: null,
    instructionsStatus: 'idle' as PaymentInstructionsStatus,
    instructionsError: null,
    copiedLabel: null,
    clipboardError: null,
    lastCustomerEmail: null,
    proof: { status: 'idle', error: null, url: null } as PaymentProofSubmission,
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
      // A slower response must not overwrite a newer postal code (#18).
      if (digitsOnly(get().address.zip) !== cp) return;
      set((state) => ({
        address: {
          ...state.address,
          state: lookup.state,
          city: lookup.city,
        },
        settlements: lookup.settlements,
      }));
    } catch {
      if (digitsOnly(get().address.zip) !== cp) return;
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

    const cartItems = useCartStore.getState().items;
    const items = cartItems.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
    }));

    try {
      const result = await checkoutService.validateCoupon({
        code: trimmed,
        segment: CHECKOUT_SEGMENT,
        shipping_cost: SHIPPING_COST,
        items,
      });

      if (result.valid) {
        set({
          coupon: result,
          couponCode: trimmed,
          couponMessage: result.message,
          couponCartFingerprint: cartSignature(cartItems),
        });
      } else {
        set({
          coupon: null,
          couponCode: null,
          couponMessage: result.message,
          couponCartFingerprint: null,
        });
      }
    } catch (err) {
      set({
        coupon: null,
        couponCode: null,
        couponMessage: toErrorMessage(err, 'No pudimos validar el cupón. Intenta de nuevo.'),
        couponCartFingerprint: null,
      });
    }
  },

  clearCoupon: () =>
    set({ coupon: null, couponCode: null, couponMessage: null, couponCartFingerprint: null }),

  ensureIdempotencyKey: (fingerprint) => {
    const { idempotencyKey, idempotencyFingerprint } = get();
    if (idempotencyKey && idempotencyFingerprint === fingerprint) return idempotencyKey;

    const key = generateIdempotencyKey();
    set({ idempotencyKey: key, idempotencyFingerprint: fingerprint });
    return key;
  },

  submit: async (customer) => {
    if (get().submission.status === 'submitting') return null;

    const cartItems = useCartStore.getState().items;
    const items = cartItems.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
    }));

    if (items.length === 0) {
      set({
        submission: { status: 'error', error: 'Tu carrito está vacío.', result: null },
      });
      return null;
    }

    // Drop a coupon whose cart no longer matches the one it was validated
    // against; a stale fingerprint must not be submitted (#18).
    const fingerprintBefore = get().couponCartFingerprint;
    if (get().coupon && fingerprintBefore && fingerprintBefore !== cartSignature(cartItems)) {
      set({
        coupon: null,
        couponCode: null,
        couponMessage: null,
        couponCartFingerprint: null,
      });
    }

    const name = customer.name.trim();
    const email = customer.email.trim();
    const phone = customer.phone?.trim() || undefined;
    const housePaymentMethod = customer.housePaymentMethod;
    const couponCode = get().couponCode;

    const fingerprint = checkoutFingerprint({
      items,
      email,
      couponCode,
      housePaymentMethod: housePaymentMethod ?? null,
    });
    const idempotencyKey = get().ensureIdempotencyKey(fingerprint);

    const payload: RequestOrdersPayload = {
      segment: CHECKOUT_SEGMENT,
      items,
      customer_name: name,
      customer_email: email,
      shipping_address: get().address,
    };
    if (phone) payload.customer_phone = phone;
    if (couponCode) payload.coupon_code = couponCode;
    if (housePaymentMethod) payload.house_payment_method = housePaymentMethod;

    set({ submission: { status: 'submitting', error: null, result: null } });

    try {
      const result = await checkoutService.requestOrders(payload, idempotencyKey);
      set({
        submission: { status: 'success', error: null, result },
        // Kept in memory so the confirmation screen can deep-link to the
        // OXXO/SPEI instructions without asking the email again.
        lastCustomerEmail: email,
        // Terminal success → a future checkout must use a fresh key.
        idempotencyKey: null,
        idempotencyFingerprint: null,
      });
      return result;
    } catch (err) {
      if (err instanceof HttpError && err.status === 409) {
        set({
          submission: {
            status: 'error',
            error: submissionErrorMessage(
              err,
              'Esta compra ya se estaba procesando. Vuelve a intentarlo.',
            ),
            result: null,
          },
          // Key reused with another cart → rotate it before the next attempt.
          idempotencyKey: generateIdempotencyKey(),
          idempotencyFingerprint: fingerprint,
        });
        return null;
      }

      set({
        submission: {
          status: 'error',
          error: submissionErrorMessage(err, 'No pudimos crear tu pedido. Intenta de nuevo.'),
          result: null,
        },
      });
      return null;
    }
  },

  fetchPaymentInstructions: async (orderNumber, email) => {
    set({ instructionsStatus: 'loading', instructionsError: null });
    try {
      const paymentInstructions = await checkoutService.getPaymentInstructions(orderNumber, email);
      set({ paymentInstructions, instructionsStatus: 'ready', instructionsError: null });
    } catch (err) {
      set({
        instructionsStatus: 'error',
        instructionsError: toErrorMessage(
          err,
          'No pudimos cargar las instrucciones de pago. Intenta de nuevo.',
        ),
      });
    }
  },

  submitProof: async (orderNumber, email, asset) => {
    if (get().proof.status === 'submitting') return false;

    const validationError = paymentProofAssetError(asset);
    if (validationError) {
      set({ proof: { status: 'error', error: validationError, url: null } });
      return false;
    }

    const trimmedEmail = email.trim();
    set({ proof: { status: 'submitting', error: null, url: null } });

    try {
      const result = await checkoutService.uploadPaymentProof(orderNumber, trimmedEmail, asset);
      set({ proof: { status: 'success', error: null, url: result.paymentProofUrl ?? null } });
      // Re-read the order so the instructions screen reflects `proof_submitted`.
      await get().fetchPaymentInstructions(orderNumber, trimmedEmail);
      return true;
    } catch (err) {
      set({
        proof: {
          status: 'error',
          error: submissionErrorMessage(
            err,
            'No pudimos enviar tu comprobante. Intenta de nuevo.',
          ),
          url: null,
        },
      });
      return false;
    }
  },

  copyToClipboard: async (label, value) => {
    try {
      const copied = await Clipboard.setStringAsync(value);
      if (copied === false) {
        set({ copiedLabel: null, clipboardError: CLIPBOARD_ERROR });
        return;
      }
      set({ copiedLabel: label, clipboardError: null });
    } catch {
      set({ copiedLabel: null, clipboardError: CLIPBOARD_ERROR });
    }
  },

  reset: () => set({ ...initialState() }),
}));

/**
 * Clear a coupon as soon as the cart it was validated against changes (#18).
 * Only runs when there is an applied coupon, so it cannot loop: it mutates the
 * checkout store, never the cart store it is subscribed to.
 */
useCartStore.subscribe((state) => {
  const { coupon, couponCartFingerprint } = useCheckoutStore.getState();
  if (!coupon || !couponCartFingerprint) return;
  if (cartSignature(state.items) === couponCartFingerprint) return;

  useCheckoutStore.setState({
    coupon: null,
    couponCode: null,
    couponMessage: null,
    couponCartFingerprint: null,
  });
});
