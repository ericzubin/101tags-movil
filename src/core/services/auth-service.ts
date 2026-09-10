import { HttpError, httpClient } from '@/core/api/client';
import {
  AuthError,
  type AuthSession,
  type CustomerUser,
  type LoginRequest,
  type RegisterRequest,
} from '@/core/models/auth';

import { secureStorageService } from './secure-storage-service';

const ENDPOINTS = {
  login: '/auth/login',
  register: '/auth/register',
  logout: '/auth/logout',
  me: '/auth/me',
  refresh: '/auth/refresh',
} as const;

type RefreshResponse = { access_token: string; expires_at?: string };

class AuthService {
  private unauthorizedHandler: (() => void | Promise<void>) | null = null;

  setUnauthorizedHandler(handler: () => void | Promise<void>): void {
    this.unauthorizedHandler = handler;
  }

  async login(email: string, password: string): Promise<AuthSession>;
  async login(payload: LoginRequest): Promise<AuthSession>;
  async login(emailOrPayload: string | LoginRequest, password?: string): Promise<AuthSession> {
    const payload: LoginRequest = typeof emailOrPayload === 'string'
      ? { email: emailOrPayload, password: password ?? '' }
      : emailOrPayload;
    const body = { ...payload, device_name: payload.device_name ?? 'mobile-app' };
    const response = await this.post<AuthSession>(ENDPOINTS.login, body);
    await this.persistSession(response);
    return response;
  }

  async register(payload: RegisterRequest): Promise<AuthSession> {
    const response = await this.post<AuthSession>(ENDPOINTS.register, payload);
    await this.persistSession(response);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await httpClient.post(ENDPOINTS.logout);
    } catch (err) {
      if (__DEV__) console.warn('[AuthService] logout network error (continuing to clear local)', err);
    } finally {
      await this.clearPersistedSession();
    }
  }

  async me(): Promise<CustomerUser> {
    return httpClient.get<CustomerUser>(ENDPOINTS.me);
  }

  /**
   * Restores a session from secure storage on app boot.
   *
   * Flow (per spec M1.2 §Auth session lifecycle):
   *   1. Read stored token. If absent → return `false` (guest boot).
   *   2. Call `GET /auth/me`. On 200 we have a valid user; persist the
   *      session back into storage and return `true`.
   *   3. On any error (401 expired token, network failure, etc.) we clear
   *      stored credentials and return `false` so the store can hydrate
   *      as a guest.
   *
   * Note: when step 2 fails with 401 the global `setOnUnauthorized`
   * handler (installed in `_layout.tsx`) also runs — it clears storage and
   * navigates to login. Our `catch` is idempotent and safe.
   */
  async hydrate(): Promise<boolean> {
    const token = await this.getStoredToken();
    if (!token) return false;
    try {
      const user = await this.me();
      await this.persistSession({ access_token: token, user });
      return true;
    } catch {
      await this.clearPersistedSession();
      return false;
    }
  }

  async refresh(): Promise<RefreshResponse> {
    const response = await httpClient.post<RefreshResponse>(ENDPOINTS.refresh);
    const tokenKey = secureStorageService.getKeys().authToken;
    await secureStorageService.setItem(tokenKey, response.access_token);
    const user = await this.getStoredUser();
    if (user) {
      const userKey = secureStorageService.getKeys().authUser;
      await secureStorageService.setItem(userKey, JSON.stringify(user));
    }
    return response;
  }

  async getStoredToken(): Promise<string | null> {
    return secureStorageService.getItem(secureStorageService.getKeys().authToken);
  }

  async getStoredUser(): Promise<CustomerUser | null> {
    const raw = await secureStorageService.getItem(secureStorageService.getKeys().authUser);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CustomerUser;
    } catch {
      return null;
    }
  }

  async persistSession(session: AuthSession): Promise<void> {
    const keys = secureStorageService.getKeys();
    await Promise.all([
      secureStorageService.setItem(keys.authToken, session.access_token),
      secureStorageService.setItem(keys.authUser, JSON.stringify(session.user)),
    ]);
  }

  async clearPersistedSession(): Promise<void> {
    await secureStorageService.clear();
  }

  async handleUnauthorized(): Promise<void> {
    await this.clearPersistedSession();
    if (this.unauthorizedHandler) await this.unauthorizedHandler();
  }

  private async post<T>(path: string, body?: unknown): Promise<T> {
    try {
      return await httpClient.post<T>(path, body);
    } catch (err) {
      throw this.toAuthError(err);
    }
  }

  private toAuthError(err: unknown): AuthError {
    if (err instanceof AuthError) return err;
    if (err instanceof HttpError) {
      const body = err.body as { message?: string; errors?: Record<string, string[]> } | null;
      if (err.status === 401) return new AuthError('INVALID_CREDENTIALS', body?.message ?? 'Credenciales inválidas', err.status, body?.errors);
      if (err.status === 422) return new AuthError('VALIDATION_ERROR', body?.message ?? 'Revisa los datos enviados', err.status, body?.errors);
      if (err.status === 0) return new AuthError('NETWORK_ERROR', 'No se pudo conectar con el servidor', err.status);
      return new AuthError('UNKNOWN', body?.message ?? 'Ocurrió un error inesperado', err.status, body?.errors);
    }
    return new AuthError('NETWORK_ERROR', 'No se pudo conectar con el servidor', 0);
  }
}

export const authService = new AuthService();
