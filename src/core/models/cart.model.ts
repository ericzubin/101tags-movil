/**
 * Cart contract — mirror of the authenticated Laravel endpoints:
 *   GET    /api/cart               → { items }
 *   POST   /api/cart/sync          → { items }
 *   PUT    /api/cart/items         → { items }
 *   DELETE /api/cart/items/{id}    → { items }
 *
 * `httpClient` applies `toCamel`, so the backend's snake_case keys
 * (`variant_id`, `line_total`, …) arrive here as camelCase.
 *
 * @see .spec/2026-09-11-m3-1-cart.md §Contratos
 */
export interface CartItem {
  readonly variantId: number;
  readonly productId: number;
  readonly supplierId: number | null;
  readonly productName: string;
  readonly productSlug: string;
  readonly size: string | null;
  readonly color: string | null;
  readonly sku: string;
  readonly price: number;
  readonly stock: number;
  readonly quantity: number;
  readonly image: string | null;
  readonly lineTotal: number;
}

export interface CartResponse {
  readonly items: CartItem[];
}
