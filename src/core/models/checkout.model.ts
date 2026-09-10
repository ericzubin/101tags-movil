/**
 * Checkout contracts — mirror of the authenticated Laravel endpoints:
 *   GET  /api/checkout/config      → CheckoutConfig
 *   GET  /api/policies             → CheckoutPolicies
 *   GET  /api/postal-codes/{cp}    → { data: PostalCodeLookup }
 *   POST /api/coupons/validate     → CouponValidation
 *
 * `httpClient` applies `toCamel`, so the backend's snake_case keys
 * (`payment_mode`, `house_payment_methods`, `postal_code`, …) arrive here
 * as camelCase. The coupon formatter already emits camelCase keys.
 *
 * @see .spec/2026-09-11-m3-2-checkout-address.md §Contratos
 */

export type PaymentMethod = 'card' | 'oxxo' | 'spei';

export interface PaymentMethodAvailability {
  readonly card: boolean;
  readonly oxxo: boolean;
  readonly spei: boolean;
}

export interface CheckoutConfig {
  readonly paymentMode: string;
  readonly paymentMethods: PaymentMethodAvailability;
  readonly housePaymentAvailable: boolean;
  readonly houseSupplierIds: number[];
  readonly housePaymentMethods: PaymentMethodAvailability;
  readonly oxxoDueHours: number;
  readonly speiDueHours: number;
  readonly demoMode: boolean;
  readonly manualPaymentDisclaimer: string | null;
  readonly openpayEnabled: boolean;
  readonly openpayMerchantId: string | null;
  readonly openpayPublicKey: string | null;
  readonly openpaySandbox: boolean;
  readonly platformOpenpayEnabled: boolean;
  readonly platformOpenpayPublicKey: string | null;
  readonly platformOpenpayMerchantId: string | null;
}

export interface CheckoutPolicies {
  readonly manualPaymentDisclaimer: string | null;
  readonly mediationWindowHours: number;
  readonly whatsappEnabled: boolean;
}

export interface PaymentInstructions {
  readonly type?: string;
  readonly method?: PaymentMethod | string;
  readonly reference?: string | null;
  readonly barcodeUrl?: string | null;
  readonly paybinReference?: string | null;
  readonly clabe?: string | null;
  readonly bank?: string | null;
  readonly agreement?: string | null;
  readonly recipientName?: string | null;
  readonly accountHolder?: string | null;
  readonly supplierName?: string | null;
  readonly oxxoReference?: string | null;
  readonly instructions?: string | null;
  readonly dueAt?: string | null;
  readonly amount?: number | null;
  readonly demo?: boolean;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  neighborhood?: string;
}

export type AddressField = keyof ShippingAddress;
export type AddressFieldErrors = Partial<Record<AddressField, string>>;

export interface PostalSettlement {
  readonly name: string;
  readonly type: string | null;
}

export interface PostalCodeLookup {
  readonly postalCode: string;
  readonly state: string;
  readonly stateCode: string | null;
  readonly municipality: string;
  readonly city: string;
  readonly settlements: PostalSettlement[];
}

export interface CouponDefinition {
  readonly id: string;
  readonly code: string;
  readonly issuer: string;
  readonly title: string;
  readonly description: string;
  readonly discountType: string;
  readonly value: number;
  readonly minSubtotal: number | null;
  readonly segment: string | null;
  readonly storeSlug: string | null;
  readonly storeName: string | null;
  readonly assignedEmails: string[];
  readonly expiresAt: string | null;
  readonly oneTime: boolean;
  readonly keywords: string[];
}

export interface CouponValidation {
  readonly valid: boolean;
  readonly message: string;
  readonly coupon?: CouponDefinition;
  readonly discountAmount: number;
  readonly shippingDiscount: number;
  readonly eligibleSubtotal: number;
}

/** Item for `POST /checkout/request-orders` — backend expects snake_case. */
export interface CheckoutOrderItem {
  variant_id: number;
  quantity: number;
}

/** Request body for `POST /checkout/request-orders` (snake_case). */
export interface RequestOrdersPayload {
  segment: 'basicos';
  items: CheckoutOrderItem[];
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  coupon_code?: string;
  shipping_address: ShippingAddress;
  house_payment_method?: PaymentMethod;
  source_id?: string;
  device_session_id?: string;
}

/** A single order returned by `POST /checkout/request-orders` (after `toCamel`). */
export interface RequestedOrder {
  readonly orderNumber: string;
  readonly supplierId: number;
  readonly status: string;
  readonly paymentStatus: string;
  readonly paymentMode?: string;
  readonly paymentMethod?: string | null;
  readonly paymentInstructions?: PaymentInstructions | null;
  readonly total: number;
}

export interface HousePaymentResult {
  readonly orderNumber: string;
  readonly status: 'paid' | 'pending' | 'failed';
  readonly message: string;
  readonly paymentInstructions?: PaymentInstructions | null;
}

/** Response of `POST /checkout/request-orders` (after `toCamel`). */
export interface RequestOrdersResult {
  readonly message: string;
  readonly purchaseNumber: string;
  readonly accessToken: string | null;
  readonly idempotentReplay?: boolean;
  readonly orders: RequestedOrder[];
  readonly housePayment?: HousePaymentResult | null;
}

/**
 * The storefront sells the `basicos` segment from the mobile app (AGENTS §Alcance).
 */
export const CHECKOUT_SEGMENT = 'basicos' as const;

/**
 * Flat shipping fee used for coupon validation and the order summary.
 * Mirrors `SHIPPING_COST` in the storefront checkout; the backend remains
 * the authority and recomputes it on `request-orders`.
 */
export const SHIPPING_COST = 99;

export const EMPTY_SHIPPING_ADDRESS: ShippingAddress = {
  street: '',
  city: '',
  state: '',
  zip: '',
  neighborhood: '',
};
