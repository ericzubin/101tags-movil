import { createHttpClient, isPublicPath, PUBLIC_PATH_PATTERNS } from '@/core/api/client';

describe('http client — bearer scope (AC4)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('PUBLIC_PATH_PATTERNS is exposed and matches /api/auth/login, /api/auth/register and /api/auth/refresh', () => {
    expect(Array.isArray(PUBLIC_PATH_PATTERNS)).toBe(true);
    expect(PUBLIC_PATH_PATTERNS.length).toBeGreaterThan(0);
    expect(isPublicPath('/api/auth/login')).toBe(true);
    expect(isPublicPath('/api/auth/register')).toBe(true);
    expect(isPublicPath('/api/auth/refresh')).toBe(true);
  });

  it('isPublicPath returns false for authenticated endpoints', () => {
    expect(isPublicPath('/api/auth/me')).toBe(false);
    expect(isPublicPath('/api/auth/logout')).toBe(false);
    expect(isPublicPath('/api/customer/orders')).toBe(false);
    expect(isPublicPath('/api/products')).toBe(false);
  });

  it('omits Authorization header on POST /api/auth/login even when a token is available', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('{}'),
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const client = createHttpClient(() => 'super-secret-token');
    await client.post('/api/auth/login', { email: 'a@x.com', password: 'secret' });

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
    expect(headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ email: 'a@x.com', password: 'secret' }));
  });

  it('omits Authorization header on POST /api/auth/register even when a token is available', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('{}'),
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const client = createHttpClient(() => 'super-secret-token');
    await client.post('/api/auth/register', {
      name: 'Ana',
      email: 'a@x.com',
      password: 'p',
      password_confirmation: 'p',
    });

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('omits Authorization header on POST /api/auth/refresh even when a token is available', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('{}'),
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const client = createHttpClient(() => 'super-secret-token');
    await client.post('/api/auth/refresh');

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('still injects Authorization header on GET /api/auth/me when a token is available', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('null'),
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const client = createHttpClient(() => 'tok-abc');
    await client.get('/api/auth/me');

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
    await client.get('/api/customer/orders');

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok-abc');
  });
});
