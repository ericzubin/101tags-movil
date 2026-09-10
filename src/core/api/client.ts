/**
 * HTTP client wrapper.
 *
 * Inyecta el bearer token Sanctum desde el auth store. Maneja timeout y errores tipados.
 * NO loggear tokens, passwords, ni datos sensibles. Ver AGENTS.md §Seguridad.
 */

import { environment } from '@/constants/env';
import type { AuthTokenProvider } from '@/stores/auth-store';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface HttpClient {
  request<T = unknown>(path: string, options?: HttpRequestOptions): Promise<T>;
  get<T = unknown>(path: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<T>;
  post<T = unknown>(path: string, body?: unknown, options?: Omit<HttpRequestOptions, 'method'>): Promise<T>;
  put<T = unknown>(path: string, body?: unknown, options?: Omit<HttpRequestOptions, 'method'>): Promise<T>;
  patch<T = unknown>(path: string, body?: unknown, options?: Omit<HttpRequestOptions, 'method'>): Promise<T>;
  delete<T = unknown>(path: string, options?: Omit<HttpRequestOptions, 'method' | 'body'>): Promise<T>;
}

export function createHttpClient(getToken: AuthTokenProvider): HttpClient {
  async function request<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query, headers = {}, signal } = options;
    const token = getToken();
    const url = new URL(path.startsWith('http') ? path : `${environment.apiBaseUrl}${path}`);

    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }

    const controller = signal ? null : new AbortController();
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), environment.apiTimeoutMs)
      : null;

    const finalHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...headers,
    };
    if (body !== undefined && !(body instanceof FormData)) {
      finalHeaders['Content-Type'] = 'application/json';
    }
    if (token) {
      finalHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(url.toString(), {
        method,
        headers: finalHeaders,
        body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
        signal: signal ?? controller?.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      const text = await res.text();
      const parsed = text ? safeJsonParse(text) : null;

      if (!res.ok) {
        throw new HttpError(res.status, res.statusText, parsed, `HTTP ${res.status} ${res.statusText}`);
      }

      return parsed as T;
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      if (err instanceof HttpError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new HttpError(0, 'Timeout', null, 'Request timeout');
      }
      throw err;
    }
  }

  return {
    request,
    get: (path, opts) => request(path, { ...opts, method: 'GET' }),
    post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
    put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
    patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
    delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  };
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
