/**
 * Auth store (Zustand).
 *
 * Mantiene user + token en memoria. La persistencia cifrada se delega a
 * src/core/storage/secure-store.ts (expo-secure-store). El logout limpia
 * tanto el store en memoria como las credenciales en Keychain/Keystore.
 *
 * NUNCA loggear el token ni la password. Ver AGENTS.md §Seguridad.
 */

import { create } from 'zustand';

import { secureClearAuth, secureGet, secureKeys, secureSet } from '@/core/storage/secure-store';

export interface CustomerUser {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly role: 'customer';
}

export type AuthTokenProvider = () => string | null;

export interface AuthState {
  user: CustomerUser | null;
  token: string | null;
  isHydrated: boolean;
  isLoading: boolean;
  setSession: (token: string, user: CustomerUser) => Promise<void>;
  clearSession: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,
  isLoading: false,

  setSession: async (token, user) => {
    await Promise.all([
      secureSet(secureKeys.authToken, token),
      secureSet(secureKeys.authUser, JSON.stringify(user)),
    ]);
    set({ user, token, isHydrated: true });
  },

  clearSession: async () => {
    await secureClearAuth();
    set({ user: null, token: null, isHydrated: true });
  },

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const [token, userJson] = await Promise.all([
        secureGet(secureKeys.authToken),
        secureGet(secureKeys.authUser),
      ]);
      const user = userJson ? (JSON.parse(userJson) as CustomerUser) : null;
      set({ user, token, isHydrated: true, isLoading: false });
    } catch {
      set({ user: null, token: null, isHydrated: true, isLoading: false });
    }
  },
}));

export const getAuthToken: AuthTokenProvider = () => useAuthStore.getState().token;
