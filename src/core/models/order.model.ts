import type { Paginated } from './common.model';
import type { PaymentInstructions, ShippingAddress } from './checkout.model';

/**
 * Order contracts — mirror of the authenticated Laravel endpoint:
 *   GET /api/orders              → Laravel LengthAwarePaginator of OrderSummary
 *   GET /api/orders/{orderNumber} → OrderDetail
 *
 * `httpClient` applies `toCamel`, so the controller's snake_case keys
 * (`order_number`, `payment_status`, `tracking_carrier`, `supplier_rating`, …)
 * arrive here as camelCase. The server scopes every order to the authenticated
 * user (`where('user_id', $user->id)`) and returns 404 for foreign/missing
 * order numbers.
 *
 * @see .spec/2026-09-11-m4-1-orders.md §Contratos
 * @see 101tags.com- app/Http/Controllers/Api/CustomerOrderController.php
 */

/** A single step of `Order::trackingSteps()` (backend emits `key/label/completed/current`). */
export interface TrackingStep {
  readonly key: string;
  readonly label: string;
  readonly completed: boolean;
  readonly current: boolean;
}

/** `tracking` block — `timeline` is nullable and must be rendered defensively. */
export interface Tracking {
  readonly carrier: string | null;
  readonly number: string | null;
  readonly timeline: TrackingStep[] | null;
}

export interface SupplierRating {
  readonly stars: number;
  readonly comment: string | null;
  readonly createdAt: string | null;
}

/** `SupplierRatingService::formatForCustomer` — `rating` is null when not rated yet. */
export interface SupplierRatingState {
  readonly canRate: boolean;
  readonly hasRated: boolean;
  readonly rating: SupplierRating | null;
}

export interface OrderSummary {
  readonly id: number;
  readonly orderNumber: string;
  readonly status: string;
  readonly paymentStatus: string;
  readonly paymentMethod: string | null;
  readonly segment: string;
  readonly total: number;
  readonly itemsCount: number;
  readonly createdAt: string;
  readonly tracking: Tracking;
  readonly supplierRating: SupplierRatingState;
}

export interface OrderItem {
  readonly productName: string;
  readonly size: string | null;
  readonly color: string | null;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
}

export interface OrderDetail extends OrderSummary {
  readonly subtotal: number;
  readonly shippingCost: number;
  readonly discountAmount: number;
  readonly couponCode: string | null;
  readonly paymentDueAt: string | null;
  readonly paymentInstructions: PaymentInstructions | null;
  readonly shippingAddress: ShippingAddress | null;
  readonly items: OrderItem[];
}

/** Flat Laravel paginator of `OrderSummary` (see common.model `Paginated<T>`). */
export type OrderListResponse = Paginated<OrderSummary>;

/**
 * True when the order carries any shippable tracking data. Used by the detail
 * screen to render the tracking block only when it exists (AC4).
 */
export function hasTracking(tracking: Tracking | null | undefined): boolean {
  if (!tracking) return false;
  return Boolean(
    tracking.carrier || tracking.number || (tracking.timeline && tracking.timeline.length > 0),
  );
}
