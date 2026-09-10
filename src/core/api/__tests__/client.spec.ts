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
});
