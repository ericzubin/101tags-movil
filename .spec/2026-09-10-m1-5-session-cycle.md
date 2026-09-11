# Spec: M1.5-session-cycle — 401/Zustand sync + hydrate error discrimination + secure-store error propagation

**Status**: APPROVED (auto-aprobado)
**Spec ID**: 2026-09-10-m1-5-session-cycle
**Author**: Agente principal (Architect)
**Date**: 2026-09-10
**Banda**: Tier 2 — antes de F2
**Issue auditada que resuelve**: #53 (ALTA) + extensiones halladas en auditoría #52/#53 (session cycle + token source-of-truth split).

---

## Contexto

Auditoría externa (otra IA) reportó issue #53 y dos extensiones halladas:

- **#53 core** — `handleUnauthorized()` borra SecureStore pero **NO** sincroniza Zustand `auth-store`. Tras un 401: SecureStore vacío + Zustand con `token`/`user` vivos → `guestGuard({ isAuthenticated: true })` rebota al usuario desde `/(auth)/login` de vuelta a `/(tabs)` → 401 otra vez → loop infinito.
- **#53 extensión 1** — `authService.hydrate()` usa `catch {}` que borra la sesión en CUALQUIER error (network, 5xx, timeout). El usuario pierde su token Sanctum válido sólo porque el server tuvo un blip transitorio.
- **#53 extensión 2** — `secure-storage-service.setItem`/`removeItem` swallow errores con `console.warn`. Callers no saben si persistió. Si `SecureStore.setItemAsync` falla por Keystore lock, la próxima boot ve "no token" y vuelve a login.
- **Hallazgo transversal** — hay DOS fuentes de token divergentes: `SecureStore` (leída por httpClient) y Zustand (leída por guards). Cualquier update unilateral de una crea divergencia.
- **Hallazgo adicional O.3** — `app/index.tsx:7` usa `isAuth = token !== null` mientras guards usan `!!token && !!user`. Foot-gun latente.

El fix **#51 ya mergeado** (PR #60) actualizó los endpoints a customer pero NO arregló el flujo 401. El bounce loop sigue latente; sólo se manifestará cuando algún servicio empiece a llamar endpoints autenticados (F2+).

## Problema

Sin este PR, el primer endpoint autenticado que retorne 401 (ej. `me()` con token revocado, sesión expirada tras 30 días) crea:
- Borrado de SecureStore.
- Zustand intacto (token + user siguen vivos).
- `router.replace('/(auth)/login')` ejecuta.
- `(auth)/_layout.tsx` re-renderiza; `guestGuard({ isAuthenticated: true, isHydrated: true })` retorna `{ redirect: '/(tabs)' }`.
- `(tabs)/_layout.tsx` re-renderiza; `authGuard({ isAuthenticated: true, isHydrated: true })` retorna `true`; tabs muestran.
- Cualquier tab screen que intente un endpoint autenticado → 401 → loop.

Adicionalmente:
- Boot con red caída → usuario pierde sesión Sanctum.
- Login OK pero `SecureStore.setItemAsync` falla por Keystore lock → app muestra "logged in" pero SecureStore vacío → próximo boot = guest → mismo problema.

## Objetivo

1. **Token source-of-truth único.** Zustand es la única fuente de verdad para guards y UI; SecureStore es el mirror durable. httpClient lee de Zustand (no de SecureStore directamente).
2. **401 sync atómico.** `handleUnauthorized()` borra SecureStore Y Zustand en una sola transacción lógica; router.push ejecuta después de confirmar ambas limpiezas.
3. **`hydrate()` discrimina errores.** 401 (token inválido/revocado) → clear. Status 0/5xx/timeout/network → mantener token en SecureStore, retornar `false` (guest en memoria), reintento en próximo boot.
4. **`secure-storage-service` propaga errores.** `setItem`/`removeItem` lanzan en lugar de `console.warn`. Wrapper `setItemSafe`/`removeItemSafe` mantiene compatibilidad para callers que no quieren manejar errores explícitamente.
5. **`isAuthenticated` unificado.** Guard helper `isAuthenticated(state)` exportado de auth-store; tanto guards como `app/index.tsx` lo usan.
6. **`setUnauthorizedHandler` finalmente wired.** `authService.setUnauthorizedHandler` se usa para que `handleUnauthorized` sepa qué hacer (en lugar del wiring actual a `httpClient.setOnUnauthorized` que deja `authService.unauthorizedHandler` nulo).

## Fuera de alcance

- Modificar backend Laravel.
- Renombrar claves SecureStore (`101tags.auth.token`/`user`) — sin cambio.
- Modificar `client.ts` bearer scope — cerrado en M1.4-hardening.
- Implementar refresh token — Sanctum no lo tiene.
- Implementar 401 → pantalla de "sesión expirada, vuelve a login" — fuera del MVP.

## Arquitectura afectada

### Crear
- `src/stores/__tests__/isAuthenticated.spec.ts` — tests del helper `isAuthenticated(state)`.

### Modificar

- `src/stores/auth-store.ts`:
  - Export nuevo helper: `export function isAuthenticated(s: Pick<AuthState, 'token' | 'user'>): boolean { return !!s.token && !!s.user; }`.
  - Acción nueva: `clearSession(): Promise<void>` ya existe; verificar que llama `secureStorageService.clear()` ANTES de `set(...)` (orden para que si `clear()` falla, Zustand NO mienta).
  - Acción nueva opcional: `setUser(user)` para sync parcial.
- `src/core/services/auth-service.ts`:
  - `handleUnauthorized()`:
    ```ts
    async handleUnauthorized(): Promise<void> {
      try {
        await this.clearPersistedSession();
      } catch (err) {
        if (__DEV__) console.warn('[AuthService] clearPersistedSession failed during 401', err);
      }
      // Sync Zustand via registered handler
      if (this.unauthorizedHandler) {
        try {
          await this.unauthorizedHandler();
        } catch (err) {
          if (__DEV__) console.warn('[AuthService] unauthorizedHandler failed', err);
        }
      }
    }
    ```
  - `hydrate()`:
    ```ts
    async hydrate(): Promise<boolean> {
      const token = await this.getStoredToken();
      if (!token) return false;
      try {
        const wrapped = await httpClient.get<{ user: CustomerUser }>(ENDPOINTS.me);
        const user = wrapped.user;
        await this.persistSession({ accessToken: token, user });
        return true;
      } catch (err) {
        if (err instanceof HttpError && err.status === 401) {
          // Token definitively invalid — clear
          await this.clearPersistedSession();
          return false;
        }
        // Transient (network, 5xx, timeout) — keep token for next boot
        if (__DEV__) console.warn('[AuthService] hydrate transient error (keeping token)', err);
        return false;
      }
    }
    ```
- `src/core/services/secure-storage-service.ts`:
  - Renombrar métodos actuales a `setItemSafe`/`removeItemSafe`/`clearSafe` (warn + return).
  - Nuevos `setItem`/`removeItem`/`clear` que **lanzan** el error (re-throw) después de loggear en dev.
  - `getItem` mantiene comportamiento (null en fallo, ya que la falta de token no es "error duro").
- `src/app/_layout.tsx`:
  - Wire: `authService.setUnauthorizedHandler(async () => { await useAuthStore.getState().clearSession(); })`.
  - httpClient provider: `httpClient.setAuthTokenProvider(() => useAuthStore.getState().token)` (NO `authService.getStoredToken`).
  - Esto unifica la fuente: una sola escritura (a SecureStore Y Zustand via `setSession`/`clearSession`) → ambas actualizadas.
- `src/app/(tabs)/_layout.tsx` y `src/app/(auth)/_layout.tsx`:
  - Importar `isAuthenticated` de `@/stores/auth-store`.
  - Usar `isAuthenticated({ token, user })` en lugar de `!!token && !!user`.
- `src/app/index.tsx`:
  - `const isAuth = isAuthenticated({ token: useAuthStore(s => s.token), user: useAuthStore(s => s.user) });`
- `src/core/services/__tests__/auth-service.spec.ts`:
  - Tests nuevos: 401 durante `hydrate()` llama `clearPersistedSession`; network error NO llama `clearPersistedSession`.
  - Tests de `handleUnauthorized()` llaman `unauthorizedHandler` y no falla si handler throws.
- `src/core/services/__tests__/secure-storage-service.spec.ts`:
  - Tests nuevos: `setItem` propaga error; `setItemSafe` swallow.
  - Tests de error scenarios.
- `src/stores/__tests__/auth-store.spec.ts`:
  - Test de `clearSession()` con SecureStore que falla → Zustand igual se limpia (o NO? — decidir).
- `src/stores/__tests__/auth-store-hydration.spec.ts`:
  - Test: `authService.hydrate()` returns false con 401 → store limpia. Returns false con network error → store queda con token/user null pero SecureStore intacto (mock).
- `src/app/__tests__/_layout.spec.tsx` (si no existe, crear):
  - Verifica que `_layout.tsx` registra `authService.setUnauthorizedHandler` y `httpClient.setAuthTokenProvider` apuntando a Zustand.

### No tocar
- `package.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `tsconfig.json`, `jest.config.js`, `eslint.config.js`.
- `src/core/api/client.ts` (cambios de bearer ya cerrados en M1.4).
- `src/core/services/is-secure-storage-available.ts`.
- Backend Laravel.

## Contratos

### Token source-of-truth (NUEVO)

```
┌─────────────────┐
│ SecureStore     │ ← durable mirror (Keychain/Keystore AES-GCM)
│  auth.token     │
│  auth.user      │
└────────┬────────┘
         │ persistSession / clearPersistedSession
         │
┌────────▼────────┐    read by    ┌─────────────┐
│ auth-store.ts   │ ─────────────►│ httpClient  │  (Authorization header)
│ (Zustand)       │               └─────────────┘
│  token, user    │
└────────┬────────┘
         │ read by
         │
┌────────▼────────┐
│ guards.ts       │
│ index.tsx       │
│ app/_layout.tsx │
└─────────────────┘
```

### handleUnauthorized sequence

```
1. httpClient receives 401
2. await onUnauthorized() — installed handler:
   async () => {
     await authService.handleUnauthorized();  // SecureStore clear
     await useAuthStore.getState().clearSession();  // Zustand clear (via handler)
     router.replace('/(auth)/login');
   }
3. authService.handleUnauthorized():
   - clearPersistedSession() (SecureStore)
   - this.unauthorizedHandler() — calls store.clearSession()
4. router.replace fires
5. (auth)/_layout.tsx renders
6. guestGuard({ isAuthenticated: false, isHydrated: true }) → no redirect
7. (auth)/login visible
```

### hydrate error discrimination

| Error | Action |
|---|---|
| `token === null` | Return `false`, no clear (SecureStore ya está vacío). |
| `HttpError(401)` | `clearPersistedSession()` + return `false`. |
| `HttpError(status 0)` (network) | Keep SecureStore, return `false`. |
| `HttpError(5xx)` | Keep SecureStore, return `false`. |
| `HttpError(422)` (rare, malformed token) | `clearPersistedSession()` + return `false`. |
| Other `Error` (DNS, etc.) | Keep SecureStore, return `false`. |

### isAuthenticated helper

```ts
// src/stores/auth-store.ts
export function isAuthenticated(
  s: Pick<AuthState, 'token' | 'user'>,
): boolean {
  return !!s.token && !!s.user;
}
```

## Acceptance Criteria (BDD)

### AC1: 401 sync atómico (SecureStore + Zustand)

```gherkin
Scenario: 401 limpia ambas fuentes
  Given SecureStore tiene token "t1" y user <U1>
  And useAuthStore tiene { token: "t1", user: <U1>, isHydrated: true }
  When httpClient recibe 401 (simulado en test)
  Then onUnauthorized handler ejecuta
  And SecureStore.auth.token === null
  And SecureStore.auth.user === null
  And useAuthStore.token === null
  And useAuthStore.user === null
  And useAuthStore.isHydrated === true
  And router.replace fue llamado con "/(auth)/login"
```

### AC2: post-401 guards NO rebotan

```gherkin
Scenario: Tras 401 + clear, guestGuard permite login
  Given 401 ocurrió (AC1)
  When (auth)/_layout.tsx renderiza
  Then guestGuard({ isAuthenticated: false, isHydrated: true }) retorna true
  And NO redirect a /(tabs)
```

### AC3: hydrate() con 401 limpia sesión

```gherkin
Scenario: Boot con token revocado
  Given SecureStore tiene token "expired-tok"
  And httpClient.get(/auth/customer/me) mockeado para tirar HttpError(401)
  When authService.hydrate()
  Then clearPersistedSession fue llamado
  And retorna false
```

### AC4: hydrate() con network error NO limpia

```gherkin
Scenario: Boot con red caída pero token válido
  Given SecureStore tiene token "valid-tok"
  And httpClient.get(/auth/customer/me) mockeado para tirar HttpError(0, "Timeout")
  When authService.hydrate()
  Then clearPersistedSession NO fue llamado
  And retorna false
  And SecureStore.auth.token sigue siendo "valid-tok"
```

### AC5: hydrate() con 5xx NO limpia

```gherkin
Scenario: Boot con server 500
  Given SecureStore tiene token "valid-tok"
  And httpClient.get(/auth/customer/me) mockeado para tirar HttpError(503)
  When authService.hydrate()
  Then clearPersistedSession NO fue llamado
  And retorna false
```

### AC6: secure-storage-service setItem propaga error

```gherkin
Scenario: Keystore lock
  Given SecureStore.setItemAsync mockeado para rechazar con Error("keystore locked")
  When secureStorageService.setItem("101tags.auth.token", "tok")
  Then la promesa rechaza con Error("keystore locked")
  And NO se llamó console.warn
```

### AC7: secure-storage-service setItemSafe swallow (compat)

```gherkin
Scenario: setItemSafe no rompe caller
  Given SecureStore.setItemAsync mockeado para rechazar
  When secureStorageService.setItemSafe("101tags.auth.token", "tok")
  Then la promesa resuelve (no rechaza)
  And console.warn fue llamado
```

### AC8: httpClient token provider lee de Zustand

```gherkin
Scenario: Provider unificado
  Given useAuthStore.token === "t1"
  And useAuthStore.user === <U1>
  When httpClient.get(/auth/customer/orders) es llamado
  Then el header Authorization es "Bearer t1" (no "Bearer <SecureStore-read>")
```

### AC9: isAuthenticated helper unifica definición

```gherkin
Scenario: Helper isAuthenticated
  Then isAuthenticated({ token: "t1", user: null }) === false
  And isAuthenticated({ token: null, user: <U1> }) === false
  And isAuthenticated({ token: null, user: null }) === false
  And isAuthenticated({ token: "t1", user: <U1> }) === true
```

### AC10: index.tsx usa isAuthenticated unificado

```gherkin
Scenario: index.tsx redirect coherente
  Given useAuthStore.token === null
  And useAuthStore.user === <U1> (huérfano, no debería pasar pero el test cubre)
  When app/index.tsx renderiza
  Then isAuth === false
  And redirect a /(auth)/login
```

### AC11: setUnauthorizedHandler wired

```gherkin
Scenario: authService.unauthorizedHandler no es null en runtime
  Given _layout.tsx montado
  When algún código inspecciona authService.unauthorizedHandler
  Then NO es null (handler está registrado)
  And handler invoca useAuthStore.getState().clearSession()
```

### AC12: clearSession con SecureStore error NO bloquea Zustand clear

```gherkin
Scenario: Persist falló pero queremos limpiar Zustand igual
  Given secureStorageService.clear mockeado para rechazar
  When useAuthStore.getState().clearSession()
  Then la promesa rechaza con el error de clear
  Y/O: la acción debe reintentar y loggear (decisión de implementación)
```

NOTA: AC12 tiene dos interpretaciones posibles. **Decisión:** clearSession loggea el error en dev pero NO rechaza la promesa; siempre limpia Zustand. Test verifica que Zustand queda limpio.

## Definition of Done

- [ ] Spec escrita.
- [ ] TDD Red: 1 archivo nuevo (`isAuthenticated.spec.ts`) + augmentations en 6 archivos existentes.
- [ ] TDD Green: implementación pasa todos los tests nuevos sin romper los 188 existentes.
- [ ] Refactor: sin hex literales.
- [ ] Verificación low-I/O:
  - `pnpm typecheck` exit 0
  - `pnpm lint` exit 0
  - `pnpm test <cada archivo tocado>` exit 0
  - Regresión: auth-service, auth-store, auth-store-hydration, secure-storage-service, _layout (si test existe), client.spec.ts (cambia provider).
- [ ] `STATE.md`, `TASKS.md`, spec marcados DONE; commit docs a `developer`.
- [ ] PR contra `developer`, NO merge.

## Riesgos y pendientes

- **Race condition entre setOnUnauthorized y setUnauthorizedHandler:** el httpClient ya tiene un handler (instalado en M1.2). Si lo desinstalamos y movemos a `authService.setUnauthorizedHandler`, hay un breve gap donde ningún handler corre. **Decisión:** mantener el handler en httpClient, pero hacer que llame a `authService.handleUnauthorized()` que internamente llama al handler registrado en `authService.setUnauthorizedHandler`. Dos capas pero sin gap.
- **El test `_layout.spec.tsx` no existe** — crearlo o cubrir el wiring en `auth-store.spec.ts` o `auth-service.spec.ts`. Preferible crear `_layout.spec.tsx` con mocks del httpClient y authService.
- **Mocks de SecureStore** deben distinguir entre read/write errors; los tests actuales probablemente no mockean fallos de `setItemAsync`. Necesario añadir.
- **Bug latente #55 sigue** (AbortSignal desactiva timeout) — agendado para M1.6.
- **Montserrat #56 sigue pendiente** — agendado para M1.8.

## Handover

Al cerrar este spec:
- ~15 tests nuevos / actualizados.
- Total tests estimado: 188 → **~203**.
- Token source-of-truth unificado en Zustand.
- Bounce loop tras 401 cerrado.
- Hydrate error discrimination funcional.
- Próximo issue: **M1.6-abort-timeout (issue #55)**.
