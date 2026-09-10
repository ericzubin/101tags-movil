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

export interface PaginatedMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedLinks {
  first_page_url: string;
  last_page_url: string;
  next_page_url: string | null;
  prev_page_url: string | null;
  path: string;
  links: { url: string | null; label: string; active: boolean; page?: number }[];
}

export interface Paginated<T> {
  data: T[];
  meta: PaginatedMeta;
  links: PaginatedLinks;
}
