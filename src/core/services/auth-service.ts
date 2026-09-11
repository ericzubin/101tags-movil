import { HttpError, httpClient } from '@/core/api/client';
import {
  AuthError,
  type AuthSession,
  type CustomerUser,
  type ForgotPasswordResponse,
  type LoginRequest,
  type RegisterRequest,
} from '@/core/models/auth';

import { secureStorageService } from './secure-storage-service';

const ENDPOINTS = {
  login: '/auth/customer/login',
  register: '/auth/customer/register',
  logout: '/auth/customer/logout',
  me: '/auth/customer/me',
  forgotPassword: '/auth/customer/forgot-password',
} as const;

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
      await this.clearPersistedSessionSafe();
    }
  }

  async getMe(): Promise<CustomerUser> {
    const response = await httpClient.get<{ user: CustomerUser }>(ENDPOINTS.me);
    return response.user;
  }

  async me(): Promise<CustomerUser> {
    return this.getMe();
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    return this.post<ForgotPasswordResponse>(ENDPOINTS.forgotPassword, { email });
  }

  /**
   * Restores a session from secure storage on app boot.
   *
   * Flow (per spec M1.5 §hydrate error discrimination):
   *   1. Read stored token. If absent → return `false` (guest boot).
   *   2. Call `GET /auth/customer/me`. On 200 we have a valid user; persist
   *      the session back into storage and return `true`.
   *   3. On `HttpError(401)` or `HttpError(422)` (token definitively
   *      invalid) → clear stored credentials and return `false`.
   *   4. On any other error (network status 0, 5xx, timeout, non-HttpError)
   *      → keep stored token intact (transient failure) and return `false`.
   */
  async hydrate(): Promise<boolean> {
    const token = await this.getStoredToken();
    if (!token) return false;
    try {
      const wrapped = await httpClient.get<{ user: CustomerUser }>(ENDPOINTS.me);
      const user = wrapped.user;
      await this.persistSession({ accessToken: token, user });
      return true;
    } catch (err) {
      if (err instanceof HttpError && (err.status === 401 || err.status === 422)) {
        try {
          await this.clearPersistedSession();
        } catch (clearErr) {
          if (__DEV__) console.warn('[AuthService] clearPersistedSession failed during hydrate 401/422', clearErr);
        }
        return false;
      }
      if (__DEV__) console.warn('[AuthService] hydrate transient error (keeping token)', err);
      return false;
    }
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
      secureStorageService.setItem(keys.authToken, session.accessToken),
      secureStorageService.setItem(keys.authUser, JSON.stringify(session.user)),
    ]);
  }

  async clearPersistedSession(): Promise<void> {
    await secureStorageService.clear();
  }

  async clearPersistedSessionSafe(): Promise<void> {
    await secureStorageService.clearSafe();
  }

  /**
   * Atomic 401 sequence (spec M1.5 §handleUnauthorized):
   *   1. Clear SecureStore (throwing variant — surfaces Keystore errors).
   *   2. Invoke the registered Zustand handler so the in-memory store is
   *      wiped in the same logical transaction.
   *
   * Both steps are best-effort: a failure in either is logged in dev but
   * NEVER propagated, so the httpClient can complete its `await onUnauthorized`
   * and the UI can navigate to login regardless of underlying storage state.
   */
  async handleUnauthorized(): Promise<void> {
    try {
      await this.clearPersistedSession();
    } catch (err) {
      if (__DEV__) console.warn('[AuthService] clearPersistedSession failed during 401', err);
    }
    if (this.unauthorizedHandler) {
      try {
        await this.unauthorizedHandler();
      } catch (err) {
        if (__DEV__) console.warn('[AuthService] unauthorizedHandler failed', err);
      }
    }
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
      if (err.status === 429) return new AuthError('RATE_LIMITED', body?.message ?? 'Demasiados intentos', err.status, body?.errors);
      if (err.status >= 500 && err.status <= 599) return new AuthError('SERVER_ERROR', body?.message ?? 'Error del servidor', err.status, body?.errors);
      if (err.status === 0) {
        if (err.cause === 'canceled') return new AuthError('CANCELED', 'Operación cancelada', err.status);
        return new AuthError('NETWORK_ERROR', 'No se pudo conectar con el servidor', err.status);
      }
      return new AuthError('UNKNOWN', body?.message ?? 'Ocurrió un error inesperado', err.status, body?.errors);
    }
    return new AuthError('NETWORK_ERROR', 'No se pudo conectar con el servidor', 0);
  }
}

export const authService = new AuthService();
