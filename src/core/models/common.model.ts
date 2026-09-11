export type ISODateString = string;

export interface LaravelErrorPayload {
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Shape real del `LengthAwarePaginator` de Laravel tras `toCamel`
 * (`GET /api/catalog/products` → `response()->json($products)`).
 *
 * NO es el shape anidado `{ data, meta, links }` de los API Resources;
 * el paginador flat expone las claves en la raíz.
 *
 * @see .spec/2026-09-11-m2-3-list.md §Paginated<T> corregido
 */
export interface Paginated<T> {
  data: T[];
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  from: number | null;
  to: number | null;
  nextPageUrl: string | null;
  prevPageUrl: string | null;
}
