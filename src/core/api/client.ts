import { getApiBaseUrl, getApiTimeoutMs } from '@/constants/env';

/**
 * Endpoints that must NOT carry an `Authorization` header.
 *
 * Sanctum rejects `Authorization` on public auth endpoints when the token
 * is invalid/expired. Sending it anyway wastes a round-trip and produces
 * confusing 401s for credentials the server never asked for.
 *
 * Patterns match the path string exactly as the caller passes it to the
 * http client (relative — `getApiBaseUrl()` already terminates in `/api`,
 * so we do NOT include the `/api` prefix here).
 *
 * @see .spec/2026-09-10-m1-4-hardening.md §Bearer injection scope
 */
export const PUBLIC_PATH_PATTERNS: readonly RegExp[] = [
  /^\/auth\/customer\/(login|register)$/,
];

export function isPublicPath(path: string): boolean {
  return PUBLIC_PATH_PATTERNS.some((re) => re.test(path));
}

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
  setAuthTokenProvider(provider: () => string | null | Promise<string | null>): void;
  setOnUnauthorized(handler: () => void | Promise<void>): void;
}

type TokenProvider = () => string | null | Promise<string | null>;

type ClientConfig = {
  getToken?: TokenProvider;
  onUnauthorized?: () => void | Promise<void>;
};

export function createHttpClient(getToken: TokenProvider = () => null, config: ClientConfig = {}): HttpClient {
  let authTokenProvider = config.getToken ?? getToken;
  let onUnauthorized = config.onUnauthorized ?? null;

  async function request<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
    const { method = 'GET', body, query, headers = {}, signal } = options;
    const token = await authTokenProvider();
    const resolvedBaseUrl = getApiBaseUrl();
    const url = new URL(path.startsWith('http') ? path : `${resolvedBaseUrl}${path}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }

    const controller = signal ? null : new AbortController();
    const timeoutId = controller ? setTimeout(() => controller.abort(), getApiTimeoutMs()) : null;
    const finalHeaders: Record<string, string> = { Accept: 'application/json', ...headers };

    if (body !== undefined && !(body instanceof FormData)) finalHeaders['Content-Type'] = 'application/json';
    const authHeader = getAuthHeader(path, token, resolvedBaseUrl);
    if (authHeader) finalHeaders.Authorization = authHeader;

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: finalHeaders,
        body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
        signal: signal ?? controller?.signal,
      });

      const text = await response.text();
      const parsed = text ? safeJsonParse(text) : null;
      if (!response.ok) {
        const error = new HttpError(response.status, response.statusText, parsed, `HTTP ${response.status} ${response.statusText}`);
        if (response.status === 401 && onUnauthorized) await onUnauthorized();
        throw error;
      }
      return parsed as T;
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      if (err instanceof HttpError) throw err;
      if (err instanceof Error && err.name === 'AbortError') throw new HttpError(0, 'Timeout', null, 'Request timeout');
      throw err;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  return {
    request,
    get: (path, opts) => request(path, { ...opts, method: 'GET' }),
    post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
    put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
    patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
    delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
    setAuthTokenProvider: (provider) => {
      authTokenProvider = provider;
    },
    setOnUnauthorized: (handler) => {
      onUnauthorized = handler;
    },
  };
}

export const httpClient = createHttpClient();

function getAuthHeader(path: string, token: string | null, baseUrl: string): string | null {
  if (!token) return null;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const requestUrl = new URL(path);
      const baseHost = new URL(baseUrl).host;
      if (requestUrl.host !== baseHost) return null;
    } catch {
      return null;
    }
  }

  if (isPublicPath(path)) return null;
  return `Bearer ${token}`;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
