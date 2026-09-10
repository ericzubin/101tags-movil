/**
 * M7.4-qa-regression (#35) — Estados de error y recuperación.
 *
 * Afirma que `httpClient`, `authService` y los stores mapean cada status
 * (401/403/404/422/409/429/5xx), timeout, cancelación y offline a un estado
 * definido con mensaje de recuperación: nunca éxito silencioso, nunca crash.
 *
 * La verificación en dispositivo (offline real) queda BLOQUEADA.
 *
 * @see .spec/2026-09-11-m7-4-qa-regression.md
 */

import { createHttpClient, HttpError } from '@/core/api/client';
import { getApiTimeoutMs } from '@/constants/env';
import { AuthError } from '@/core/models/auth';
import { authService } from '@/core/services/auth-service';
import { useCartStore } from '@/stores/cart-store';
import { useCheckoutStore } from '@/stores/checkout-store';

import type { CartItem } from '@/core/models/cart.model';

const mockRequest = jest.fn();
const mockPost = jest.fn();

jest.mock('@/core/api/client', () => {
  const actual = jest.requireActual('@/core/api/client');
  return {
    ...actual,
    httpClient: {
      request: (path: string, options?: unknown) => mockRequest(path, options),
      get: (path: string, options?: unknown) =>
        mockRequest(path, { ...(options as object), method: 'GET' }),
      post: (path: string, body?: unknown) => mockPost(path, body),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      setAuthTokenProvider: jest.fn(),
      setOnUnauthorized: jest.fn(),
    },
  };
});

const makeItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  variantId: 5,
  productId: 1,
  supplierId: null,
  productName: 'Playera Negra',
  productSlug: 'playera-negra',
  size: 'M',
  color: 'Negro',
  sku: 'P-M-N',
  price: 80,
  stock: 10,
  quantity: 2,
  image: null,
  lineTotal: 160,
  ...overrides,
});

describe('M7.4 — httpClient mapea status a HttpError tipado', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
  });

  it.each([400, 401, 403, 404, 409, 422, 429, 500, 503])(
    'status %i → HttpError con status y body parseado (nunca resuelve éxito)',
    async (status) => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status,
        statusText: 'Error',
        text: () => Promise.resolve(JSON.stringify({ message: `err-${status}` })),
      }) as unknown as typeof fetch;

      const client = createHttpClient(() => null);

      await expect(client.get('/any')).rejects.toMatchObject({
        name: 'HttpError',
        status,
        body: { message: `err-${status}` },
      });
    },
  );

  it('401 dispara el handler de no autorizado y aún así lanza HttpError', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve('{"message":"unauthenticated"}'),
    }) as unknown as typeof fetch;

    const onUnauthorized = jest.fn();
    const client = createHttpClient(() => 'tok', { onUnauthorized });

    await expect(client.get('/protected')).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('timeout → HttpError(0, cause="timeout") con mensaje de recuperación', async () => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn((_url, init) => {
      return new Promise((_resolve, reject) => {
        (init as RequestInit).signal?.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    }) as unknown as typeof fetch;

    const client = createHttpClient(() => null);
    const pending = client.get('/slow');
    const assertion = expect(pending).rejects.toMatchObject({
      name: 'HttpError',
      status: 0,
      cause: 'timeout',
    });
    await jest.advanceTimersByTimeAsync(getApiTimeoutMs() + 1);
    await assertion;
  });

  it('señal ya cancelada → HttpError(0, cause="canceled")', async () => {
    const controller = new AbortController();
    controller.abort();
    globalThis.fetch = jest.fn() as unknown as typeof fetch;

    const client = createHttpClient(() => null);

    await expect(
      client.get('/any', { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'HttpError', status: 0, cause: 'canceled' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('offline (fetch rechaza TypeError) → rechaza sin resolver éxito', async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;

    const client = createHttpClient(() => null);

    await expect(client.get('/any')).rejects.toThrow('Network request failed');
  });
});

describe('M7.4 — authService mapea status a AuthError con mensaje', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [401, 'INVALID_CREDENTIALS'],
    [403, 'UNKNOWN'],
    [404, 'UNKNOWN'],
    [409, 'UNKNOWN'],
    [422, 'VALIDATION_ERROR'],
    [429, 'RATE_LIMITED'],
    [500, 'SERVER_ERROR'],
    [503, 'SERVER_ERROR'],
  ])('status %i → AuthError(%s) con mensaje legible', async (status, code) => {
    mockPost.mockRejectedValueOnce(
      new HttpError(status, 'Error', { message: `mensaje-${status}` }, 'HTTP error'),
    );

    await expect(authService.login('a@b.com', 'p')).rejects.toMatchObject({
      name: 'AuthError',
      code,
      status,
      message: `mensaje-${status}`,
    });
  });

  it('status 0 timeout → NETWORK_ERROR con mensaje de recuperación', async () => {
    mockPost.mockRejectedValueOnce(
      new HttpError(0, 'Timeout', null, 'Request timeout', 'timeout'),
    );

    await expect(authService.login('a@b.com', 'p')).rejects.toMatchObject({
      name: 'AuthError',
      code: 'NETWORK_ERROR',
      status: 0,
      message: 'No se pudo conectar con el servidor',
    });
  });

  it('status 0 canceled → CANCELED', async () => {
    mockPost.mockRejectedValueOnce(
      new HttpError(0, 'Canceled', null, 'Request canceled', 'canceled'),
    );

    await expect(authService.login('a@b.com', 'p')).rejects.toMatchObject({
      code: 'CANCELED',
      status: 0,
    });
  });

  it('offline (TypeError crudo) → NETWORK_ERROR (nunca se propaga crudo)', async () => {
    mockPost.mockRejectedValueOnce(new TypeError('Network request failed'));

    const rejection = authService.login('a@b.com', 'p');
    await expect(rejection).rejects.toBeInstanceOf(AuthError);
    await expect(rejection).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});

describe('M7.4 — stores exponen estado de error con mensaje (nunca success)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCartStore.setState({ items: [], status: 'idle', error: null });
    useCheckoutStore.getState().reset();
  });

  it('cart fetchCart con 500 → status error + mensaje, items intactos', async () => {
    mockRequest.mockRejectedValueOnce(
      new HttpError(500, 'Server Error', null, 'HTTP 500 Server Error'),
    );

    await useCartStore.getState().fetchCart();

    const state = useCartStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).toBeTruthy();
    expect(state.items).toEqual([]);
  });

  it('cart fetchCart offline → status error + mensaje', async () => {
    mockRequest.mockRejectedValueOnce(new TypeError('Network request failed'));

    await useCartStore.getState().fetchCart();

    expect(useCartStore.getState().status).toBe('error');
    expect(useCartStore.getState().error).toBe('Network request failed');
  });

  it('checkout fetchConfig 5xx → status error + mensaje', async () => {
    mockRequest.mockRejectedValueOnce(new HttpError(503, 'Unavailable', null, 'HTTP 503'));

    await useCheckoutStore.getState().fetchConfig();

    const state = useCheckoutStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).toBeTruthy();
  });

  it('checkout submit 422 → guarda message del backend, no crea pedido local', async () => {
    useCartStore.setState({ items: [makeItem()] });
    useCheckoutStore.getState().setAddress({
      street: 'Av. Juárez 123',
      city: 'CDMX',
      state: 'CDMX',
      zip: '06600',
    });
    mockRequest.mockRejectedValueOnce(
      new HttpError(422, 'Unprocessable', { message: 'El correo no es válido.' }, 'HTTP 422'),
    );

    const result = await useCheckoutStore.getState().submit({
      name: 'Ana',
      email: 'bad',
    });

    expect(result).toBeNull();
    const state = useCheckoutStore.getState();
    expect(state.submission.status).toBe('error');
    expect(state.submission.error).toBe('El correo no es válido.');
    expect(state.submission.result).toBeNull();
  });

  it('checkout submit 409 → error de conflicto y rota la Idempotency-Key', async () => {
    useCartStore.setState({ items: [makeItem()] });
    useCheckoutStore.getState().setAddress({
      street: 'Av. Juárez 123',
      city: 'CDMX',
      state: 'CDMX',
      zip: '06600',
    });
    mockRequest.mockRejectedValueOnce(
      new HttpError(409, 'Conflict', { message: 'Compra en curso.' }, 'HTTP 409'),
    );

    await useCheckoutStore.getState().submit({ name: 'Ana', email: 'ana@example.com' });

    const usedKey = mockRequest.mock.calls[0][1].headers['Idempotency-Key'];
    const state = useCheckoutStore.getState();
    expect(state.submission.status).toBe('error');
    expect(state.submission.error).toBe('Compra en curso.');
    expect(state.idempotencyKey).not.toBe(usedKey);
    expect(state.idempotencyKey).toMatch(/^[A-Za-z0-9._:-]{8,100}$/);
  });

  it('checkout submit 429 → error con mensaje de espera, no crea pedido', async () => {
    useCartStore.setState({ items: [makeItem()] });
    useCheckoutStore.getState().setAddress({
      street: 'Av. Juárez 123',
      city: 'CDMX',
      state: 'CDMX',
      zip: '06600',
    });
    mockRequest.mockRejectedValueOnce(
      new HttpError(429, 'Too Many Requests', { message: 'Demasiadas solicitudes.' }, 'HTTP 429'),
    );

    await useCheckoutStore.getState().submit({ name: 'Ana', email: 'ana@example.com' });

    const state = useCheckoutStore.getState();
    expect(state.submission.status).toBe('error');
    expect(state.submission.error).toBe('Demasiadas solicitudes.');
    expect(state.submission.result).toBeNull();
  });

  it('checkout fetchPaymentInstructions 5xx → instructionsStatus error + mensaje', async () => {
    mockRequest.mockRejectedValueOnce(new HttpError(500, 'Server', null, 'HTTP 500'));

    await useCheckoutStore.getState().fetchPaymentInstructions('ORD-1', 'ana@example.com');

    const state = useCheckoutStore.getState();
    expect(state.instructionsStatus).toBe('error');
    expect(state.instructionsError).toBeTruthy();
  });
});
