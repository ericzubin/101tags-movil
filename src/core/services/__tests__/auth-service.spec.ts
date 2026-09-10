import * as SecureStore from 'expo-secure-store';

import { HttpError, httpClient } from '@/core/api/client';
import { AuthError, type AuthSession } from '@/core/models/auth';
import { authService } from '@/core/services/auth-service';

jest.mock('@/core/api/client', () => {
  const actual = jest.requireActual('@/core/api/client');
  return {
    ...actual,
    httpClient: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
    },
  };
});

const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

const baseUser = { id: 1, name: 'Ana', email: 'a@x.com', phone: null, role: 'customer' as const };
const baseSession: AuthSession = {
  accessToken: 'tok-abc',
  expires_at: '2026-12-31T00:00:00Z',
  user: baseUser,
};

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  describe('login', () => {
    it('posts to /auth/customer/login with default device_name and persists session (AC1, AC2)', async () => {
      mockedHttpClient.post.mockResolvedValueOnce(baseSession);

      const session = await authService.login('a@x.com', 'secret');

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/auth/customer/login', {
        email: 'a@x.com',
        password: 'secret',
        device_name: 'mobile-app',
      });
      expect(session).toEqual(baseSession);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('101tags.auth.token', 'tok-abc');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        '101tags.auth.user',
        JSON.stringify(baseSession.user),
      );
    });

    it('respects caller-provided device_name', async () => {
      mockedHttpClient.post.mockResolvedValueOnce(baseSession);

      await authService.login({ email: 'a@x.com', password: 'p', device_name: 'ipad-test' });

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/auth/customer/login', {
        email: 'a@x.com',
        password: 'p',
        device_name: 'ipad-test',
      });
    });

    it('throws AuthError(INVALID_CREDENTIALS) on 401', async () => {
      mockedHttpClient.post.mockRejectedValueOnce(
        new HttpError(401, 'Unauthorized', { message: 'Invalid credentials' }, 'HTTP 401'),
      );

      await expect(authService.login('a@x.com', 'wrong')).rejects.toMatchObject({
        name: 'AuthError',
        code: 'INVALID_CREDENTIALS',
        status: 401,
      });
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('throws AuthError(VALIDATION_ERROR) with details on 422', async () => {
      mockedHttpClient.post.mockRejectedValueOnce(
        new HttpError(
          422,
          'Unprocessable',
          { message: 'The email field is required', errors: { email: ['required'] } },
          'HTTP 422',
        ),
      );

      await expect(authService.register({ name: '', email: '', password: 'x', password_confirmation: 'x' })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        status: 422,
        details: { email: ['required'] },
      });
    });
  });

  describe('register', () => {
    it('posts to /auth/customer/register and persists session', async () => {
      mockedHttpClient.post.mockResolvedValueOnce(baseSession);

      const session = await authService.register({
        name: 'Ana',
        email: 'a@x.com',
        password: 'secret123',
        password_confirmation: 'secret123',
        phone: '+5255...',
      });

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/auth/customer/register', {
        name: 'Ana',
        email: 'a@x.com',
        password: 'secret123',
        password_confirmation: 'secret123',
        phone: '+5255...',
      });
      expect(session).toEqual(baseSession);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('101tags.auth.token', 'tok-abc');
    });
  });

  describe('logout', () => {
    it('clears local credentials even when backend logout fails', async () => {
      mockedHttpClient.post.mockRejectedValueOnce(new HttpError(500, 'Server', null, 'HTTP 500'));

      await expect(authService.logout()).resolves.toBeUndefined();

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/auth/customer/logout');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.user');
    });

    it('calls backend logout when it succeeds', async () => {
      mockedHttpClient.post.mockResolvedValueOnce(undefined);

      await authService.logout();

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/auth/customer/logout');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.user');
    });
  });

  describe('me', () => {
    it('gets /auth/customer/me and UNWRAPS { user } → user (AC3)', async () => {
      const wrapped = { user: baseSession.user };
      mockedHttpClient.get.mockResolvedValueOnce(wrapped);

      const user = await authService.me();

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/auth/customer/me');
      expect(user).toEqual(baseSession.user);
      expect(user).not.toHaveProperty('user');
    });
  });

  describe('refresh (AC4 — removed)', () => {
    it('refresh method does not exist on authService', () => {
      expect((authService as unknown as Record<string, unknown>).refresh).toBeUndefined();
    });
  });

  describe('error mapping', () => {
    it('maps network errors (status 0) to NETWORK_ERROR', async () => {
      mockedHttpClient.post.mockRejectedValueOnce(new HttpError(0, 'Timeout', null, 'Request timeout'));

      await expect(authService.login('a@x.com', 'p')).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        status: 0,
      });
    });

    it('maps HttpError(0, cause="timeout") to NETWORK_ERROR (M1.6 AC7)', async () => {
      mockedHttpClient.post.mockRejectedValueOnce(
        new HttpError(0, 'Timeout', null, 'Request timeout', 'timeout'),
      );

      await expect(authService.login('a@x.com', 'p')).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        status: 0,
      });
    });

    it('maps HttpError(0, cause="canceled") to CANCELED (M1.6 AC6)', async () => {
      mockedHttpClient.post.mockRejectedValueOnce(
        new HttpError(0, 'Canceled', null, 'Request canceled', 'canceled'),
      );

      await expect(authService.login('a@x.com', 'p')).rejects.toMatchObject({
        code: 'CANCELED',
        status: 0,
      });
    });

    it('passes through existing AuthError instances untouched', async () => {
      const original = new AuthError('UNKNOWN', 'Custom', 500);
      mockedHttpClient.post.mockRejectedValueOnce(original);

      await expect(authService.login('a@x.com', 'p')).rejects.toBe(original);
    });

    it('wraps non-HttpError native exceptions as NETWORK_ERROR', async () => {
      mockedHttpClient.post.mockRejectedValueOnce(new Error('boom'));

      await expect(authService.login('a@x.com', 'p')).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });
    });
  });

  describe('handleUnauthorized', () => {
    it('clears stored credentials and invokes the unauthorized handler', async () => {
      const handler = jest.fn();
      authService.setUnauthorizedHandler(handler);

      await authService.handleUnauthorized();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.user');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('clears credentials without throwing when no handler is registered', async () => {
      authService.setUnauthorizedHandler(jest.fn());
      await expect(authService.handleUnauthorized()).resolves.toBeUndefined();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.token');
    });

    it('does not propagate SecureStore clear failures (AC1 — 401 sync atomicity)', async () => {
      const handler = jest.fn().mockResolvedValueOnce(undefined);
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error('keystore locked'));
      authService.setUnauthorizedHandler(handler);

      await expect(authService.handleUnauthorized()).resolves.toBeUndefined();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does not propagate handler failures (AC1 — 401 sync atomicity)', async () => {
      const handler = jest.fn().mockRejectedValueOnce(new Error('handler boom'));
      authService.setUnauthorizedHandler(handler);

      await expect(authService.handleUnauthorized()).resolves.toBeUndefined();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('still invokes the handler after SecureStore clear failure (AC1 — order matters)', async () => {
      const handler = jest.fn().mockResolvedValueOnce(undefined);
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error('keystore locked'));
      authService.setUnauthorizedHandler(handler);

      await authService.handleUnauthorized();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    });
  });

  describe('storage helpers', () => {
    it('getStoredToken reads from secure storage', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('tok-x');

      await expect(authService.getStoredToken()).resolves.toBe('tok-x');
    });

    it('getStoredUser parses JSON or returns null', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(baseSession.user));
      await expect(authService.getStoredUser()).resolves.toEqual(baseSession.user);

      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('not-json');
      await expect(authService.getStoredUser()).resolves.toBeNull();
    });
  });

  describe('hydrate (boot restore)', () => {
    it('returns false without calling me() when no token is stored (AC3)', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

      const restored = await authService.hydrate();

      expect(restored).toBe(false);
      expect(mockedHttpClient.get).not.toHaveBeenCalled();
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('returns true and re-persists session when me() succeeds with stored token (AC1)', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) =>
        key === '101tags.auth.token' ? 'stored-tok' : null,
      );
      mockedHttpClient.get.mockResolvedValueOnce({ user: baseSession.user });

      const restored = await authService.hydrate();

      expect(restored).toBe(true);
      expect(mockedHttpClient.get).toHaveBeenCalledWith('/auth/customer/me');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('101tags.auth.token', 'stored-tok');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        '101tags.auth.user',
        JSON.stringify(baseSession.user),
      );
    });

    it('returns false and clears stored credentials when me() fails with 401 (M1.2 AC2 / M1.5 AC3)', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('expired-tok');
      mockedHttpClient.get.mockRejectedValueOnce(new HttpError(401, 'Unauthorized', null, 'HTTP 401'));

      const restored = await authService.hydrate();

      expect(restored).toBe(false);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.user');
    });

    it('returns false and clears stored credentials when me() fails with 422 (M1.5 AC3 — malformed token)', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('malformed-tok');
      mockedHttpClient.get.mockRejectedValueOnce(
        new HttpError(422, 'Unprocessable', null, 'HTTP 422'),
      );

      const restored = await authService.hydrate();

      expect(restored).toBe(false);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.token');
    });

    it('returns false WITHOUT clearing stored credentials when me() fails with network error (M1.5 AC4)', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('valid-tok');
      mockedHttpClient.get.mockRejectedValueOnce(
        new HttpError(0, 'Timeout', null, 'Request timeout'),
      );

      const restored = await authService.hydrate();

      expect(restored).toBe(false);
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('returns false WITHOUT clearing stored credentials when me() fails with 5xx (M1.5 AC5)', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('valid-tok');
      mockedHttpClient.get.mockRejectedValueOnce(
        new HttpError(503, 'Service Unavailable', null, 'HTTP 503'),
      );

      const restored = await authService.hydrate();

      expect(restored).toBe(false);
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('returns false WITHOUT clearing stored credentials when me() throws a non-HttpError (M1.5 AC4)', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('valid-tok');
      mockedHttpClient.get.mockRejectedValueOnce(new Error('DNS resolution failed'));

      const restored = await authService.hydrate();

      expect(restored).toBe(false);
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });
  });
});
