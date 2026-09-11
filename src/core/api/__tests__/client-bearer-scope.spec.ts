import { createHttpClient, isPublicPath, PUBLIC_PATH_PATTERNS } from '@/core/api/client';

describe('http client — bearer scope (AC4 — customer namespace)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('PUBLIC_PATH_PATTERNS is exposed and matches /auth/customer/{login,register}', () => {
    expect(Array.isArray(PUBLIC_PATH_PATTERNS)).toBe(true);
    expect(PUBLIC_PATH_PATTERNS.length).toBeGreaterThan(0);
    expect(isPublicPath('/auth/customer/login')).toBe(true);
    expect(isPublicPath('/auth/customer/register')).toBe(true);
  });

  it('isPublicPath returns false for authenticated endpoints (no /auth/customer/me or /logout public)', () => {
    expect(isPublicPath('/auth/customer/me')).toBe(false);
    expect(isPublicPath('/auth/customer/logout')).toBe(false);
    expect(isPublicPath('/customer/orders')).toBe(false);
    expect(isPublicPath('/products')).toBe(false);
  });

  it('omits Authorization header on POST /auth/customer/login even when a token is available', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('{}'),
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const client = createHttpClient(() => 'super-secret-token');
    await client.post('/auth/customer/login', { email: 'a@x.com', password: 'secret' });

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
    expect(headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ email: 'a@x.com', password: 'secret' }));
  });

  it('omits Authorization header on POST /auth/customer/register even when a token is available', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('{}'),
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const client = createHttpClient(() => 'super-secret-token');
    await client.post('/auth/customer/register', {
      name: 'Ana',
      email: 'a@x.com',
      password: 'p',
      password_confirmation: 'p',
    });

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('still injects Authorization header on GET /auth/customer/me when a token is available', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('null'),
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const client = createHttpClient(() => 'tok-abc');
    await client.get('/auth/customer/me');

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok-abc');
  });

  it('still injects Authorization header on arbitrary authenticated paths', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('null'),
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const client = createHttpClient(() => 'tok-abc');
    await client.get('/customer/orders');

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok-abc');
  });
});
