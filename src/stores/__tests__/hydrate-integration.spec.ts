/**
 * Integration test for the P0 hydrate-boot-bearer fix.
 *
 * This is the ONLY test that exercises the full SecureStore → useAuthStore →
 * authService → httpClient → bearer-token-provider → fetch chain end-to-end.
 * Without it, the P0 bug (token not seeded into Zustand before /me) is
 * undetectable: auth-service.spec.ts mocks httpClient as a whole and
 * auth-store-hydration.spec.ts mocks authService.hydrate — both bypass
 * the provider mechanism that the bug actually breaks.
 *
 * Mocks are placed ONLY at the storage and network boundaries:
 *   - `expo-secure-store` (jest.setup.js + per-test override)
 *   - `globalThis.fetch` (per-test)
 *
 * Everything else is REAL: useAuthStore, getAuthToken, authService, httpClient.
 * We wire `httpClient.setAuthTokenProvider(getAuthToken)` in beforeEach to
 * mimic `app/_layout.tsx`.
 */

import * as SecureStore from 'expo-secure-store';

import { getAuthToken, isAuthenticated, useAuthStore } from '@/stores/auth-store';
import { httpClient } from '@/core/api/client';

const baseUser = {
  id: 1,
  name: 'Juan',
  email: 'j@x.com',
  phone: '',
  role: 'customer' as const,
};
const baseMeBody = { user: baseUser };
const baseToken = 'abc123';

interface MockFetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  text: () => Promise<string>;
}

describe('hydrate boot bearer integration (P0)', () => {
  let mockFetch: jest.Mock;
  const originalFetch = globalThis.fetch;

  function mockFetchError(status: number, body: unknown = null) {
    mockFetch.mockImplementation(
      () =>
        Promise.resolve({
          ok: false,
          status,
          statusText: 'Error',
          text: () => Promise.resolve(body === null ? '' : JSON.stringify(body)),
        }) as unknown as Promise<Response>,
    );
  }

  function mockFetchNetworkError() {
    mockFetch.mockImplementation(
      () => Promise.reject(new Error('Network failed')),
    );
  }

  function mockFetchHangs(): (v: MockFetchResponse) => void {
    let resolveFetch!: (v: MockFetchResponse) => void;
    mockFetch.mockReset();
    mockFetch.mockImplementation(
      () => new Promise<MockFetchResponse>((resolve) => {
        resolveFetch = resolve;
      }) as unknown as Promise<Response>,
    );
    return (v: MockFetchResponse) => resolveFetch(v);
  }

  function seedSecureStore(token: string | null = baseToken, user: unknown = baseUser) {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
      if (key === '101tags.auth.token') return token;
      if (key === '101tags.auth.user') return user ? JSON.stringify(user) : null;
      return null;
    });
  }

  function getLastFetchHeaders(): Record<string, string> {
    expect(mockFetch).toHaveBeenCalled();
    const init = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][1] as RequestInit;
    return init.headers as Record<string, string>;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, token: null, isHydrated: false, isLoading: false });

    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);

    mockFetch = jest.fn().mockImplementation(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve(JSON.stringify(baseMeBody)),
    }));
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    // Mimic app/_layout.tsx wiring: provider reads from the REAL Zustand store.
    httpClient.setAuthTokenProvider(getAuthToken);
    httpClient.setOnUnauthorized(() => undefined);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('AC1: storedToken leído ANTES de /me, AND Zustand.token seeded ANTES de /me', async () => {
    seedSecureStore();
    let zustandTokenAtFetchTime: string | null = 'unset';
    mockFetch.mockReset();
    mockFetch.mockImplementation(
      (() =>
        new Promise<MockFetchResponse>((resolve) => {
          // Capture the Zustand token at the exact moment the httpClient
          // produces the fetch request. If the new hydrate() order is in
          // effect, the token must already be `baseToken`. If the buggy
          // ordering is still there, it will be `null`.
          zustandTokenAtFetchTime = useAuthStore.getState().token;
          resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: () => Promise.resolve(JSON.stringify(baseMeBody)),
          });
        })) as unknown as () => Promise<Response>,
    );

    await useAuthStore.getState().hydrate();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/auth/customer/me');
    expect(zustandTokenAtFetchTime).toBe(baseToken);
  });

  it('AC2: /me lleva Authorization Bearer stored-token', async () => {
    seedSecureStore();

    await useAuthStore.getState().hydrate();

    expect(mockFetch).toHaveBeenCalled();
    const headers = getLastFetchHeaders();
    expect(headers.Authorization).toBe(`Bearer ${baseToken}`);
  });

  it('AC3: /me 200 → Zustand final completo', async () => {
    seedSecureStore();

    const result = await useAuthStore.getState().hydrate();

    expect(result).toBe(true);
    const s = useAuthStore.getState();
    expect(s.token).toBe(baseToken);
    expect(s.user).toMatchObject({ id: 1, name: 'Juan' });
    expect(s.isHydrated).toBe(true);
    expect(s.isLoading).toBe(false);
  });

  it('AC4: /me 401 → SecureStore limpiado, Zustand vacío', async () => {
    seedSecureStore();
    mockFetchError(401);

    const result = await useAuthStore.getState().hydrate();

    expect(result).toBe(false);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.user');

    const s = useAuthStore.getState();
    expect(s.token).toBeNull();
    expect(s.user).toBeNull();
    expect(s.isHydrated).toBe(true);
  });

  it('AC5: /me network error → SecureStore intacto, Zustand vacío', async () => {
    seedSecureStore();
    mockFetchNetworkError();

    const result = await useAuthStore.getState().hydrate();

    expect(result).toBe(false);
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();

    const s = useAuthStore.getState();
    expect(s.token).toBeNull();
    expect(s.user).toBeNull();
    expect(s.isHydrated).toBe(true);
  });

  it('AC6: mid-boot invariant — token set but user null mientras /me está pendiente', async () => {
    seedSecureStore();
    const resolveFetch = mockFetchHangs();

    const promise = useAuthStore.getState().hydrate();
    await new Promise<void>((r) => setImmediate(r));

    const midBoot = useAuthStore.getState();
    expect(midBoot.token).toBe(baseToken);
    expect(midBoot.user).toBeNull();
    expect(midBoot.isHydrated).toBe(false);
    expect(isAuthenticated(midBoot)).toBe(false);

    resolveFetch({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve(JSON.stringify(baseMeBody)),
    });
    await promise;

    const final = useAuthStore.getState();
    expect(final.token).toBe(baseToken);
    expect(final.user).toMatchObject({ id: 1, name: 'Juan' });
    expect(final.isHydrated).toBe(true);
  });
});
