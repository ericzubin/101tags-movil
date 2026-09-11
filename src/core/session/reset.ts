/**
 * Session reset registry.
 *
 * Feature stores register a reset callback here so that signing out can wipe
 * every in-memory slice of session-scoped state (cart, checkout, queries, …)
 * without `auth-store` importing each store directly. The registry is owned by
 * this module and executed by `auth-store.clearSession`.
 *
 * @see .spec/2026-09-11-m3-3-request-orders.md §Auth
 */
export type SessionReset = () => void | Promise<void>;

const resetters: SessionReset[] = [];

export function registerSessionReset(fn: SessionReset): void {
  resetters.push(fn);
}

/**
 * Run every registered reset in registration order. A failing reset must not
 * prevent the remaining resets from running, so each error is swallowed.
 */
export async function runSessionResets(): Promise<void> {
  for (const reset of resetters) {
    try {
      await reset();
    } catch {
      // Intentionally ignored: one store failing to reset must not block others.
    }
  }
}

export function __resetRegistryForTests(): void {
  resetters.length = 0;
}
