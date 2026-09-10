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

const baseSession: AuthSession = {
  access_token: 'tok-abc',
  expires_at: '2026-12-31T00:00:00Z',
  user: { id: 1, name: 'Ana', email: 'a@x.com', phone: null },
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
    it('posts to /auth/login with default device_name and persists session', async () => {
      mockedHttpClient.post.mockResolvedValueOnce(baseSession);

      const session = await authService.login('a@x.com', 'secret');

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/auth/login', {
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

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/auth/login', {
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
    it('posts payload and persists session', async () => {
      mockedHttpClient.post.mockResolvedValueOnce(baseSession);

      const session = await authService.register({
        name: 'Ana',
        email: 'a@x.com',
        password: 'secret123',
        password_confirmation: 'secret123',
        phone: '+5255...',
      });

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/auth/register', {
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

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.user');
    });

    it('calls backend logout when it succeeds', async () => {
      mockedHttpClient.post.mockResolvedValueOnce(undefined);

      await authService.logout();

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.user');
    });
  });

  describe('me', () => {
    it('gets /auth/me and returns the parsed user', async () => {
      mockedHttpClient.get.mockResolvedValueOnce(baseSession.user);

      const user = await authService.me();

      expect(mockedHttpClient.get).toHaveBeenCalledWith('/auth/me');
      expect(user).toEqual(baseSession.user);
    });
  });

  describe('refresh', () => {
    it('posts to /auth/refresh and persists new token while keeping stored user', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
        if (key === '101tags.auth.user') return JSON.stringify(baseSession.user);
        return null;
      });
      mockedHttpClient.post.mockResolvedValueOnce({ access_token: 'tok-new', expires_at: '2027-01-01T00:00:00Z' });

      const response = await authService.refresh();

      expect(mockedHttpClient.post).toHaveBeenCalledWith('/auth/refresh');
      expect(response).toEqual({ access_token: 'tok-new', expires_at: '2027-01-01T00:00:00Z' });
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('101tags.auth.token', 'tok-new');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('101tags.auth.user', JSON.stringify(baseSession.user));
    });

    it('updates token even when no user is stored', async () => {
      mockedHttpClient.post.mockResolvedValueOnce({ access_token: 'tok-new' });

      const response = await authService.refresh();

      expect(response.access_token).toBe('tok-new');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('101tags.auth.token', 'tok-new');
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
      mockedHttpClient.get.mockResolvedValueOnce(baseSession.user);

      const restored = await authService.hydrate();

      expect(restored).toBe(true);
      expect(mockedHttpClient.get).toHaveBeenCalledWith('/auth/me');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('101tags.auth.token', 'stored-tok');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        '101tags.auth.user',
        JSON.stringify(baseSession.user),
      );
    });

    it('returns false and clears stored credentials when me() fails with 401 (AC2)', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('expired-tok');
      mockedHttpClient.get.mockRejectedValueOnce(new HttpError(401, 'Unauthorized', null, 'HTTP 401'));

      const restored = await authService.hydrate();

      expect(restored).toBe(false);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.user');
    });

    it('returns false and clears stored credentials when me() throws a network error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('any-tok');
      mockedHttpClient.get.mockRejectedValueOnce(new Error('boom'));

      const restored = await authService.hydrate();

      expect(restored).toBe(false);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.token');
    });
  });
});
