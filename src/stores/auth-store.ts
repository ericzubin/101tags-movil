import { create } from 'zustand';

import { runSessionResets } from '@/core/session/reset';
import { authService } from '@/core/services/auth-service';
import type { AuthSession, CustomerUser, RegisterRequest } from '@/core/models/auth';

export type AuthTokenProvider = () => string | null;

export interface AuthState {
  user: CustomerUser | null;
  token: string | null;
  isHydrated: boolean;
  isLoading: boolean;
  setSession: (session: AuthSession) => Promise<void>;
  clearSession: () => Promise<void>;
  hydrate: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<boolean>;
}

/**
 * Single source of truth for "do we have a valid session?".
 *
 * Used by every navigation guard and `app/index.tsx`. Keeping it here (vs.
 * inlined `!!token && !!user` checks) prevents the M1.5 audit foot-gun
 * where one site could drift to `token !== null` and silently bypass the
 * "user must also be present" requirement.
 */
export function isAuthenticated(s: Pick<AuthState, 'token' | 'user'>): boolean {
  return !!s.token && !!s.user;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,
  isLoading: false,

  setSession: async (session) => {
    await authService.persistSession(session);
    set({ user: session.user, token: session.accessToken, isHydrated: true });
  },

  /**
   * AC12 — Always wipe in-memory state, even if SecureStore fails.
   * If we left `token`/`user` alive after a SecureStore failure the
   * boot path would re-hydrate as authenticated from the next call to
   * `authService.getStoredToken()` only on the next app launch — but
   * in this session the user is logically signed out, so we mirror that.
   * The SecureStore error is logged in dev only.
   */
  clearSession: async () => {
    try {
      await authService.clearPersistedSession();
    } catch (err) {
      if (__DEV__) console.warn('[auth-store] clearPersistedSession failed', err);
    }
    set({ user: null, token: null, isHydrated: true });
    await runSessionResets();
  },

  /**
   * Hydrate the session from secure storage on app boot.
   *
   * Flow:
   *   1. Read the stored token. If absent → return false (guest boot).
   *   2. Seed Zustand with `{ token: storedToken, user: null,
   *      isHydrated: false, isLoading: true }` so the httpClient provider
   *      can attach `Authorization: Bearer <token>` to the next request
   *      (the /me call made by authService.hydrate()).
   *   3. Call authService.hydrate(). On 200 we have a valid user; persist
   *      the user back into storage and return true.
   *   4. On HttpError(401) or HttpError(422) (token definitively invalid)
   *      → clear stored credentials and return false.
   *   5. On any other error (network status 0, 5xx, timeout, non-HttpError)
   *      → keep stored token intact (transient failure) and return false.
   *
   * During step 2 the user is null while the token is set; this is a
   * valid intermediate state. isAuthenticated() requires BOTH token AND
   * user to be truthy, so guards correctly treat this as "not
   * authenticated" and the user remains gated in /(auth) until /me
   * confirms the session.
   *
   * @returns true if a valid session was restored, false otherwise.
   */
  hydrate: async (): Promise<boolean> => {
    set({ isLoading: true });
    try {
      const storedToken = await authService.getStoredToken();

      if (storedToken) {
        set({ token: storedToken, user: null, isHydrated: false, isLoading: true });
      }

      const restored = await authService.hydrate();

      if (restored) {
        const user = await authService.getStoredUser();
        set({ token: storedToken, user, isHydrated: true, isLoading: false });
        return true;
      }
      set({ token: null, user: null, isHydrated: true, isLoading: false });
      return false;
    } catch {
      set({ token: null, user: null, isHydrated: true, isLoading: false });
      return false;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const session = await authService.login(email, password);
      set({ user: session.user, token: session.accessToken });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (payload) => {
    set({ isLoading: true });
    try {
      const session = await authService.register(payload);
      set({ user: session.user, token: session.accessToken });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, token: null, isHydrated: true });
  },

  /**
   * M6.1 — Refresca el `user` desde `GET /auth/customer/me`.
   *
   * No es bloqueante: si la red falla, conserva el `user` cacheado y el
   * token intactos, y resuelve `false` para que la UI muestre un aviso sin
   * desloguear al usuario. Nunca propaga el error ni renderiza el token.
   *
   * @returns true si el `user` se actualizó, false si se mantuvo el cache.
   */
  refreshUser: async (): Promise<boolean> => {
    try {
      const user = await authService.getMe();
      set({ user });
      return true;
    } catch (err) {
      if (__DEV__) console.warn('[auth-store] refreshUser failed (keeping cached user)', err);
      return false;
    }
  },
}));

export const getAuthToken: AuthTokenProvider = () => useAuthStore.getState().token;
