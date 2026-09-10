import { create } from 'zustand';

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
  },

  hydrate: async (): Promise<boolean> => {
    set({ isLoading: true });
    try {
      const restored = await authService.hydrate();
      if (restored) {
        const [token, user] = await Promise.all([
          authService.getStoredToken(),
          authService.getStoredUser(),
        ]);
        set({ token, user, isHydrated: true, isLoading: false });
      } else {
        set({ token: null, user: null, isHydrated: true, isLoading: false });
      }
      return restored;
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
}));

export const getAuthToken: AuthTokenProvider = () => useAuthStore.getState().token;
