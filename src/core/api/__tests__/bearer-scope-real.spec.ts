import { createHttpClient, isPublicPath, PUBLIC_PATH_PATTERNS } from '@/core/api/client';

describe('http client — bearer scope REAL paths (no /api/ prefix; AC5-AC7)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('PUBLIC_PATH_PATTERNS only matches customer login/register (auth customer scope)', () => {
    expect(Array.isArray(PUBLIC_PATH_PATTERNS)).toBe(true);
    expect(PUBLIC_PATH_PATTERNS.length).toBeGreaterThan(0);

    expect(isPublicPath('/auth/customer/login')).toBe(true);
    expect(isPublicPath('/auth/customer/register')).toBe(true);

    expect(isPublicPath('/auth/customer/me')).toBe(false);
    expect(isPublicPath('/auth/customer/logout')).toBe(false);

    expect(isPublicPath('/auth/login')).toBe(false);
    expect(isPublicPath('/auth/refresh')).toBe(false);
  });

  it('does NOT inject Authorization on POST /auth/customer/login (real path, no /api/)', async () => {
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
  });

  it('does NOT inject Authorization on POST /auth/customer/register', async () => {
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

  it('DOES inject Authorization on POST /auth/customer/logout when token available', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('{}'),
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const client = createHttpClient(() => 'fresh-tok');
    await client.post('/auth/customer/logout', {});

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer fresh-tok');
  });

  it('DOES inject Authorization on GET /auth/customer/me when token available', async () => {
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

  it('rejects Bearer on absolute external URL (host != baseUrl) — AC7 defense in depth', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('null'),
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const client = createHttpClient(() => 'leak-candidate');
    await client.post('https://evil.com/api/auth/customer/me', {});

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('allows Bearer on absolute URL with matching host (baseUrl origin)', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('null'),
    });
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    const client = createHttpClient(() => 'tok-abc');
    await client.get('http://localhost:8000/api/auth/customer/me');

    const init = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok-abc');
  });

  it('still injects Authorization on arbitrary authenticated paths', async () => {
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
