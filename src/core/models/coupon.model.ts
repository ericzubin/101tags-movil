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

const MONTHS_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function formatCouponValue(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/**
 * Human-readable discount label for the cuponera card.
 *
 * Backend `discountType` mirrors the storefront union
 * (`percent` | `fixed` | `shipping`); anything else falls back to a generic
 * label so an unknown type never breaks the list (AC2).
 */
export function couponDiscountLabel(
  coupon: Pick<CouponDefinition, 'discountType' | 'value'>,
): string {
  switch ((coupon.discountType ?? '').toLowerCase()) {
    case 'percent':
      return `${formatCouponValue(coupon.value)}% de descuento`;
    case 'fixed':
      return `$${formatCouponValue(coupon.value)} de descuento`;
    case 'shipping':
      return 'Envío gratis';
    default:
      return 'Descuento';
  }
}

/**
 * `expiresAt` arrives as `YYYY-MM-DD` (backend `toDateString()`). We format it
 * deterministically in UTC so the rendered date never shifts a day by timezone.
 */
export function formatCouponExpiry(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) return null;
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  const month = MONTHS_ES[parsed.getUTCMonth()];
  return `${day} ${month} ${parsed.getUTCFullYear()}`;
}
