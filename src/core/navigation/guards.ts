/**
 * Navigation guards for /(auth) and /(tabs) layout groups.
 *
 * Pure functions — no React, no expo-router. Layouts map the result into
 * `<Redirect href="..." />`. Keeping them pure makes them trivially testable
 * (see `__tests__/guards.spec.ts`) and avoids side effects during render.
 *
 * Contract:
 *  - While `isHydrated === false` we are still in the splash phase; both
 *    guards return `true` (allow) so the layout renders nothing of import
 *    until `_layout.tsx` finishes hydrating.
 *  - `authGuard` blocks unauthenticated users from `(tabs)` and sends them
 *    to `/(auth)/login`.
 *  - `guestGuard` blocks already-authenticated users from `/(auth)/login` /
 *    `/(auth)/register` and sends them to `/(tabs)`.
 *
 * @see .spec/2026-09-09-m1-2-session-restore-guards.md §Guards
 */

export type GuardResult = true | { redirect: string };

export type GuardContext = {
  isAuthenticated: boolean;
  isHydrated: boolean;
};

export function authGuard(opts: GuardContext): GuardResult {
  if (!opts.isHydrated) return true;
  if (opts.isAuthenticated) return true;
  return { redirect: '/(auth)/login' };
}

export function guestGuard(opts: GuardContext): GuardResult {
  if (!opts.isHydrated) return true;
  if (!opts.isAuthenticated) return true;
  return { redirect: '/(tabs)' };
}
