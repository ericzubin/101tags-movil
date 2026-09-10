import { createHttpClient, HttpError } from '@/core/api/client';

describe('http client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('injects bearer token from auth provider', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('{"ok":true}'),
    });
    globalThis.fetch = mockFetch as any;

    const client = createHttpClient(() => 'test-token-123');
    await client.get('/me');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const call = mockFetch.mock.calls[0];
    const init = call[1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token-123');
  });

  it('omits Authorization header when token is null', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('null'),
    });
    globalThis.fetch = mockFetch as any;

    const client = createHttpClient(() => null);
    await client.get('/public');

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('throws HttpError on non-2xx with parsed body', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      text: () => Promise.resolve('{"errors":{"email":["invalid"]}}'),
    });
    globalThis.fetch = mockFetch as any;

    const client = createHttpClient(() => null);

    try {
      await client.post('/login', { email: 'bad' });
      throw new Error('expected to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      const err = e as HttpError;
      expect(err.status).toBe(422);
      expect(err.body).toEqual({ errors: { email: ['invalid'] } });
    }
  });

  it('returns parsed JSON on success', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('{"a":1,"b":2}'),
    });
    globalThis.fetch = mockFetch as any;

    const client = createHttpClient(() => null);
    const data = await client.get<{ a: number; b: number }>('/x');
    expect(data).toEqual({ a: 1, b: 2 });
  });

  it('setAuthTokenProvider re-assigns the bearer token without re-instantiating', async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK', text: () => Promise.resolve('null') })
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK', text: () => Promise.resolve('null') });
    globalThis.fetch = mockFetch as any;

    const client = createHttpClient(() => 'initial');
    await client.get('/a');

    client.setAuthTokenProvider(() => 'rotated');
    await client.get('/b');

    const firstInit = mockFetch.mock.calls[0][1] as RequestInit;
    const secondInit = mockFetch.mock.calls[1][1] as RequestInit;
    expect((firstInit.headers as Record<string, string>).Authorization).toBe('Bearer initial');
    expect((secondInit.headers as Record<string, string>).Authorization).toBe('Bearer rotated');
  });

  it('setAuthTokenProvider supports async providers', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('null'),
    });
    globalThis.fetch = mockFetch as any;

    const client = createHttpClient(() => null);
    client.setAuthTokenProvider(async () => 'async-token');

    await client.get('/a');
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer async-token');
  });

  it('invokes setOnUnauthorized handler on 401 and still throws HttpError', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve('{"message":"unauthenticated"}'),
    });
    globalThis.fetch = mockFetch as any;

    const handler = jest.fn();
    const client = createHttpClient(() => 'tok', { onUnauthorized: handler });

    await expect(client.get('/protected')).rejects.toBeInstanceOf(HttpError);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('setOnUnauthorized can be re-assigned at runtime', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: () => Promise.resolve('null'),
    });
    globalThis.fetch = mockFetch as any;

    const first = jest.fn();
    const second = jest.fn();
    const client = createHttpClient(() => null, { onUnauthorized: first });
    client.setOnUnauthorized(second);

    await expect(client.get('/x')).rejects.toBeInstanceOf(HttpError);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onUnauthorized for non-401 errors', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: () => Promise.resolve('null'),
    });
    globalThis.fetch = mockFetch as any;

    const handler = jest.fn();
    const client = createHttpClient(() => null, { onUnauthorized: handler });

    await expect(client.get('/x')).rejects.toBeInstanceOf(HttpError);
    expect(handler).not.toHaveBeenCalled();
  });
});
