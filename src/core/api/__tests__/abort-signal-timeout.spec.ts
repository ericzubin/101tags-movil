import { createHttpClient, HttpError } from '@/core/api/client';

describe('http client — AbortSignal + global timeout (issue #55, AC1-AC4 + AC10)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  /**
   * Build a `fetch` mock that hangs forever, BUT reacts to an aborted
   * signal by rejecting with an AbortError. This mirrors how a real
   * fetch implementation behaves.
   */
  function fetchThatHangs(): jest.Mock {
    return jest.fn().mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_, reject) => {
        const sig = init?.signal;
        if (sig) {
          if (sig.aborted) {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
            return;
          }
          sig.addEventListener('abort', () => {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
          });
        }
      });
    });
  }

  it('AC1 — caller signal does NOT disable global timeout (timeout wins)', async () => {
    globalThis.fetch = fetchThatHangs();

    const client = createHttpClient(() => null);
    process.env.EXPO_PUBLIC_API_TIMEOUT_MS = '80';

    const promise = client.get('/test', { signal: new AbortController().signal });

    const assertion = expect(promise).rejects.toMatchObject({
      status: 0,
      statusText: 'Timeout',
      cause: 'timeout',
    });
    await assertion;
  });

  it('AC2 — caller signal abort → "canceled" (not "timeout")', async () => {
    globalThis.fetch = fetchThatHangs();

    const client = createHttpClient(() => null);
    process.env.EXPO_PUBLIC_API_TIMEOUT_MS = '5000';

    const controller = new AbortController();
    const promise = client.get('/test', { signal: controller.signal });

    setTimeout(() => controller.abort(), 10);

    await expect(promise).rejects.toMatchObject({
      status: 0,
      statusText: 'Canceled',
      cause: 'canceled',
    });
  });

  it('AC3 — timeout fires when no caller signal is passed', async () => {
    globalThis.fetch = fetchThatHangs();

    const client = createHttpClient(() => null);
    process.env.EXPO_PUBLIC_API_TIMEOUT_MS = '50';

    const promise = client.get('/test');

    await expect(promise).rejects.toMatchObject({
      status: 0,
      cause: 'timeout',
      message: 'Request timeout',
    });
  });

  it('AC4 — race between caller abort and timeout → first wins (caller abort at 10ms wins)', async () => {
    globalThis.fetch = fetchThatHangs();

    const client = createHttpClient(() => null);
    process.env.EXPO_PUBLIC_API_TIMEOUT_MS = '500';

    const controller = new AbortController();
    const promise = client.get('/test', { signal: controller.signal });

    setTimeout(() => controller.abort(), 10);

    await expect(promise).rejects.toMatchObject({
      cause: 'canceled',
    });
  });

  it('AC10 — pre-aborted caller signal → "canceled" without firing fetch', async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch;

    const client = createHttpClient(() => null);

    const controller = new AbortController();
    controller.abort();

    await expect(
      client.get('/test', { signal: controller.signal }),
    ).rejects.toMatchObject({
      status: 0,
      cause: 'canceled',
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('clears the timeout when the request resolves before it fires', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('null'),
    });
    globalThis.fetch = mockFetch;

    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout');

    const client = createHttpClient(() => null);
    process.env.EXPO_PUBLIC_API_TIMEOUT_MS = '5000';

    await client.get('/test');

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('removes the external abort listener on completion (no listener leak)', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('null'),
    });
    globalThis.fetch = mockFetch;

    const removeSpy = jest.fn();
    const fakeSignal = {
      aborted: false,
      addEventListener: jest.fn(),
      removeEventListener: removeSpy,
    } as unknown as AbortSignal;

    const client = createHttpClient(() => null);
    await client.get('/test', { signal: fakeSignal });

    expect(removeSpy).toHaveBeenCalledTimes(1);
  });

  it('still exposes the response when caller signal is passed and request succeeds', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve('{"ok":true}'),
    });
    globalThis.fetch = mockFetch;

    const client = createHttpClient(() => null);

    const controller = new AbortController();
    const data = await client.get<{ ok: boolean }>('/test', {
      signal: controller.signal,
    });

    expect(data).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeDefined();
  });

  it('HttpError thrown by fetch (e.g. 422) carries undefined cause', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      text: () => Promise.resolve('{"errors":{"email":["required"]}}'),
    });
    globalThis.fetch = mockFetch;

    const client = createHttpClient(() => null);

    const err = (await client
      .post('/login', { email: '' })
      .catch((e: unknown) => e)) as HttpError;

    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(422);
    expect(err.cause).toBeUndefined();
  });
});
