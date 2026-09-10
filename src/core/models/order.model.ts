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

/* ------------------------------------------------------------------ *
 * Returns / cancellations (M4.2) — mirror of ReturnRequestController
 *   GET  /api/return-requests
 *   POST /api/orders/{orderNumber}/returns
 *   POST /api/orders/{orderNumber}/cancellations
 * @see .spec/2026-09-11-m4-2-returns.md §Contratos
 * ------------------------------------------------------------------ */

/** `ReturnRequest::TYPE_*` — backend emits the raw string. */
export type ReturnType = 'return' | 'cancellation';

/** `ReturnRequest::STATUS_*` — `(string & {})` keeps unknown statuses renderable. */
export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'refunded';

/** `ReturnRequestService::format()` after `toCamel`. */
export interface ReturnRequest {
  readonly id: number;
  readonly folio: string;
  readonly type: ReturnType;
  readonly orderNumber: string | null;
  readonly orderStatus: string | null;
  readonly reason: string;
  readonly description: string | null;
  readonly status: ReturnStatus | string;
  readonly resolutionNotes: string | null;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
}

/** Flat Laravel paginator of `ReturnRequest`. */
export type ReturnListResponse = Paginated<ReturnRequest>;

/** Body shared by returns and cancellations (`reason` required, ≤255; `description` ≤2000). */
export interface ReturnRequestInput {
  readonly reason: string;
  readonly description?: string;
}

/** `POST /orders/{orderNumber}/returns` → `201 { message, data }`. */
export interface ReturnSubmissionResponse {
  readonly message: string;
  readonly data: ReturnRequest;
}

/** `POST /orders/{orderNumber}/cancellations` → `201 { message, applied, data }`. */
export interface CancellationSubmissionResponse extends ReturnSubmissionResponse {
  readonly applied: boolean;
}

/**
 * Cancellation is offered for any state except `cancelled`. `shipped`/`delivered`
 * still reach the backend, which answers 422 and the UI surfaces the message —
 * the client only hides the action once the order is already cancelled.
 */
export function canCancelOrder(status: string | null | undefined): boolean {
  return status !== 'cancelled';
}

/**
 * Returns are rejected by `createReturn` when the order is `cancelled` or
 * `pending`, so the action is hidden in those states (AC2).
 */
export function canReturnOrder(status: string | null | undefined): boolean {
  return status !== 'cancelled' && status !== 'pending';
}

const RETURN_TYPE_LABELS: Record<ReturnType, string> = {
  return: 'Devolución',
  cancellation: 'Cancelación',
};

const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  requested: 'Solicitada',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  refunded: 'Reembolsada',
};

export function returnTypeLabel(type: string): string {
  return RETURN_TYPE_LABELS[type as ReturnType] ?? type;
}

export function returnStatusLabel(status: string): string {
  return RETURN_STATUS_LABELS[status as ReturnStatus] ?? status;
}

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
