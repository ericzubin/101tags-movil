# Spec: M1.1 — Auth models + SecureStorageService + AuthService + interceptor

**Status**: APPROVED
**Spec ID**: 2026-09-09-m1-1-auth-models-service
**Author**: Agente (issue M1.1 — `chore/m1-1-pivot`)
**Date**: 2026-09-09
**Related specs**: `.spec/2026-09-09-m0-1-auditar-contratos.md` (auth contracts), `.spec/00-rn-expo-scaffold.md`

**GitHub issue**: `#7` en la rama `chore/m1-1-pivot`.

---

## Contexto

- El scaffold RN+Expo SDK 57 ya está generado (M0.5-PIVOT cerrado en `chore/m0-5-pivot`).
- El wrapper actual `src/core/storage/secure-store.ts` es procedural (funciones sueltas) y depende de `expo-secure-store` con un fallback explícito a no-op cuando `isAvailableAsync() === false` (jsdom/web).
- El HTTP client (`src/core/api/client.ts`) ya inyecta bearer token desde el store pero no tiene interceptor 401 ni mecanismo para reasignar el provider post-instanciación.
- El auth-store (`src/stores/auth-store.ts`) llama directamente a `secureSet`/`secureGet`/`secureDelete`, mezclando estado de UI con persistencia.
- Las pantallas `src/app/(auth)/login.tsx` y `register.tsx` aún hacen `router.replace('/(tabs)')` sin invocar auth, así que M1.3 (login funcional) depende de esta base.
- El backend Laravel expone Sanctum bearer tokens contra `POST /api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/refresh`. Ver `DISCOVERY.md §3` y `.spec/2026-09-09-m0-1-auditar-contratos.md` (M0.1 DONE).

## Problema

Necesitamos una capa auth lista para producción que:

1. Modele explícitamente los contratos Sanctum (`CustomerUser`, `LoginRequest`, `RegisterRequest`, `AuthSession`, `AuthError`).
2. Encapsule `expo-secure-store` en una clase singleton con fallback web seguro (no throw, no persist).
3. Encapsule los cinco endpoints Sanctum en una clase singleton con persistencia, mapeo de `HttpError → AuthError` y manejo de 401.
4. Permita al HTTP client inyectar el bearer desde un provider externo y reaccionar al 401 invocando un handler que limpia sesión.
5. Refactorice el Zustand store para delegar a `authService` (no más llamadas directas a storage) y exponer `login/register/logout` listos para M1.3.
6. Cablee el wiring en `src/app/_layout.tsx` para que cualquier fetch autenticado lleve token y un 401 redirija al login.

Sin esta base, M1.3 (login real), M1.4 (forgot/reset) y M1.5 (splash + guards) quedan bloqueados.

## Objetivo

Entregar la base de autenticación lista para M1.3: 7 modelos TS, `SecureStorageService` singleton, `AuthService` singleton, interceptor 401 en el HTTP client, `auth-store` refactorizado y wiring en `_layout.tsx`.

## Fuera de alcance

- Formularios de login/register con validación UX detallada (M1.3).
- Splash, guards, tabs y navegación base (M1.5).
- Forgot/reset password + deep links (M1.4).
- Refresh proactivo de tokens (M5 — pendiente; `refresh` queda implementado pero no se programa polling).
- Modificar el backend Laravel (prohibido por `AGENTS.md`).
- Reemplazar `AsyncStorage` por `expo-secure-store` en datos no sensibles (sólo aplica al token; el resto del MVP usará `AsyncStorage` o lo que decida specs posteriores).

## Arquitectura afectada

- **Crear**:
  - `src/core/models/auth.ts` (7 modelos: `CustomerUser`, `LoginRequest`, `RegisterRequest`, `AuthSession`, `AuthErrorCode`, `AuthError`, `RefreshResponse` derivado).
  - `src/core/models/__tests__/auth.spec.ts` (≥3 tests).
  - `src/core/services/is-secure-storage-available.ts` (helper compartido).
  - `src/core/services/secure-storage-service.ts` (singleton con `getItem/setItem/removeItem/clear` + `getKeys`).
  - `src/core/services/__tests__/secure-storage-service.spec.ts` (≥6 tests).
  - `src/core/services/auth-service.ts` (singleton `login/register/logout/me/refresh/persistSession/clearPersistedSession/getStoredToken/getStoredUser/handleUnauthorized/setUnauthorizedHandler`).
  - `src/core/services/__tests__/auth-service.spec.ts` (≥10 tests, mock `httpClient`).
  - `.spec/2026-09-09-m1-1-auth-models-service.md` (esta spec).
- **Modificar**:
  - `src/core/api/client.ts` → `HttpClient.setAuthTokenProvider(provider)` + `HttpClient.setOnUnauthorized(handler)`, `Authorization` async, 401 invoca handler.
  - `src/core/storage/secure-store.ts` → shim delgado que re-exporta `secureKeys`, `secureSet/Get/Delete/ClearAuth` y `isSecureStorageAvailable` (compatibilidad con M0.5 + tests pre-existentes). NO se elimina: queda como fachada procedural; el código nuevo usa `SecureStorageService` directo.
  - `src/stores/auth-store.ts` → usa `authService`, expone `setSession(AuthSession)`, `login(email, password)`, `register(payload)`, `logout()`, `clearSession()`, `hydrate()`, `getAuthToken()`.
  - `src/stores/__tests__/auth-store.spec.ts` → mock `authService`, asserts sobre la nueva shape.
  - `src/core/api/__tests__/client.spec.ts` → añadir tests para `setAuthTokenProvider` (re-asignación) y `setOnUnauthorized` (401 → handler).
  - `src/app/(auth)/login.tsx` + `register.tsx` → handlers reales con `useAuthStore().login/register`, manejo de `AuthError`, redirect a `/(tabs)` en éxito.
  - `src/app/_layout.tsx` → wiring del interceptor 401.
- **No tocar**:
  - `package.json` (versiones, dependencias).
  - `app.json`, `eas.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `tsconfig.json`.
  - Backend Laravel.

## Contratos

### API endpoints consumidos (Sanctum, no cambian)

| Método | Path | Auth | Request | Response | Errores |
|---|---|---|---|---|---|
| POST | `/api/auth/login` | — | `{ email, password, device_name? }` | `{ access_token, user, expires_at? }` | 401, 422, 5xx |
| POST | `/api/auth/register` | — | `{ name, email, password, password_confirmation, phone? }` | `{ access_token, user }` | 422, 5xx |
| POST | `/api/auth/logout` | Bearer | — | 204 No Content | 401, 5xx |
| GET | `/api/auth/me` | Bearer | — | `CustomerUser` | 401, 5xx |
| POST | `/api/auth/refresh` | Bearer | — | `{ access_token, expires_at? }` | 401, 5xx |

> Fuente: `routes/api.php` del backend Laravel en `101tags.com-` (NO se modifica). El prefijo `/api` lo aplica el `getApiBaseUrl()` configurado en `src/constants/env.ts`.

### Storage local (Keychain/Keystore)

Claves en `expo-secure-store` (built-in Expo SDK 57, iOS Keychain / Android Keystore AES-GCM):

| Clave | Tipo | Contenido |
|---|---|---|
| `101tags.auth.token` | string | bearer Sanctum |
| `101tags.auth.user` | JSON | `CustomerUser` serializado |

> En web/jsdom `isAvailableAsync() === false` → `SecureStorageService` retorna `null` (no-op + warn once en DEV). Coherente con que web no tiene sesión real. NO usar `AsyncStorage` ni `localStorage` como fallback (prohibido por `AGENTS.md §Token Sanctum`).

### Señales / estado

`useAuthStore()` (Zustand) expone:

```ts
{
  user: CustomerUser | null;
  token: string | null;
  isHydrated: boolean;
  isLoading: boolean;
  setSession(session: AuthSession): Promise<void>;
  clearSession(): Promise<void>;
  hydrate(): Promise<void>;
  login(email: string, password: string): Promise<void>;
  register(payload: RegisterRequest): Promise<void>;
  logout(): Promise<void>;
}
```

### Rutas / navegación

- `/login` → M1.3 (UI completa, ya cableada en M0.4).
- `/register` → M1.3.
- `/(tabs)` → destino tras login/register OK.
- `/(auth)/login` → destino forzado por el handler 401.

## Modelos / DTOs

```ts
// src/core/models/auth.ts
export type CustomerUser = {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly phone?: string | null;
  readonly email_verified_at?: string | null;
  readonly created_at?: string;
  readonly updated_at?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
  device_name?: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
};

export type AuthSession = {
  access_token: string;
  user: CustomerUser;
  expires_at?: string;
};

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'TOKEN_EXPIRED'
  | 'UNKNOWN';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;
  readonly details?: Record<string, string[]>;

  constructor(
    code: AuthErrorCode,
    message: string,
    status: number,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
```

> `expires_at` opcional: si el backend lo emite, se persiste como parte de `AuthSession` para futura decisión de refresh proactivo (fuera de esta spec).

## Seguridad

- El bearer Sanctum nunca se loggea. El HTTP client sólo lo usa en el header `Authorization: Bearer <token>`.
- `AuthService.logout()` limpia SIEMPRE las credenciales locales aunque el endpoint falle (best-effort, como `storefront/src/api/auth.ts`).
- `SecureStorageService` no expone el storage plano; sólo claves tipadas (`getKeys().authToken`, `getKeys().authUser`).
- `HttpError.body` (que contiene el JSON crudo del backend) se descarta en logs (sólo se mapea a `AuthError`).
- NO usar `AsyncStorage` ni `localStorage` como fallback de `expo-secure-store`. Web/jsdom retorna `null` y la sesión simplemente no persiste (esperado).
- 401 en cualquier endpoint autenticado dispara `handleUnauthorized()` (clear local + handler externo).

## Compatibilidad

- El wrapper procedural `src/core/storage/secure-store.ts` se conserva como shim para no romper tests pre-existentes (`secure-store.spec.ts` con 7 tests verdes). El código nuevo NO debe usarlo.
- El HTTP client pre-existente (`createHttpClient(getToken)`) sigue aceptando un `getToken` opcional en el constructor; el wiring real usa `setAuthTokenProvider` después del mount para evitar import circular contra `authService`.
- Backend Laravel NO se modifica. Contratos leídos de `routes/api.php` y tests backend existentes.

## Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | `isAvailableAsync()` devuelve `false` en jsdom/web → tests rotos | Mock explícito `jest.mock('expo-secure-store', ...)` en setup + cada test que lo necesite lo configura con `mockResolvedValue(true)`. Ya funciona en `secure-store.spec.ts`. |
| R2 | Import circular entre `authService` y `httpClient` | `authService` importa `httpClient`; el wiring del provider se hace vía `setAuthTokenProvider` en `_layout.tsx` (no en construcción). |
| R3 | `refresh` queda implementado pero no se programa polling → token muerto después de expirar | Fuera de alcance; M1.5 / M5 deberán cablear el polling o redirect. Documentado en §Fuera de alcance. |
| R4 | `secure-store.ts` (shim) puede confundir (¿cuál uso?) | Convención explícita en código nuevo: `import { secureStorageService } from '@/core/services/secure-storage-service';`. El shim queda sólo para no romper M0.5. |
| R5 | `expo-secure-store.isAvailableAsync()` puede tirar excepción en algún edge case | `isSecureStorageAvailable()` envuelve en `try/catch` y retorna `false` (ver `src/core/services/is-secure-storage-available.ts`). |
| R6 | El HTTP client no tenía interceptor 401 → 401 no limpiaba sesión | Se añade `setOnUnauthorized`; wiring en `_layout.tsx` llama a `authService.handleUnauthorized()` + `router.replace('/(auth)/login')`. |
| R7 | `setSession(session: AuthSession)` cambia la firma → tests pre-existentes rompen | Se actualiza `auth-store.spec.ts` con la nueva shape + mock de `authService`. |

## Plan de implementación

1. **Spec** — escribir/actualizar esta spec (DRAFT → APPROVED).
2. **TDD Red** — escribir `auth.spec.ts`, `secure-storage-service.spec.ts` (≥6), `auth-service.spec.ts` (≥10) y actualizar `auth-store.spec.ts` + `client.spec.ts`. Correr `pnpm test:ci` → deben fallar.
3. **TDD Green** — implementar `src/core/models/auth.ts`, `src/core/services/is-secure-storage-available.ts`, `src/core/services/secure-storage-service.ts`, `src/core/services/auth-service.ts`, modificar `src/core/api/client.ts`, refactorizar `src/stores/auth-store.ts`. Correr tests → deben pasar.
4. **Refactor** — extraer constantes, asegurar `strict mode`, sin código muerto.
5. **UI + wiring** — actualizar `login.tsx`, `register.tsx` y `_layout.tsx` con handlers reales e interceptor.
6. **Verification** — `pnpm typecheck && pnpm lint && pnpm test:ci && pnpm exec expo prebuild --no-install --clean` → exit 0 todos.
7. **Commit local** en `chore/m1-1-pivot` (NO push, NO PR).

---

## Escenarios BDD

Cada comportamiento observable se valida con un test Jest. El target es **≥70 tests verdes totales** tras la tarea (era 53 antes; +17 nuevos/extendidos).

### BDD-1 — Modelos TS de auth

**Dado** que el cliente móvil consume los endpoints Sanctum del backend Laravel
**Cuando** se importa `src/core/models/auth.ts`
**Entonces** se exportan los 7 modelos: `CustomerUser`, `LoginRequest`, `RegisterRequest`, `AuthSession`, `AuthErrorCode` (union), `AuthError` (class), `RefreshResponse` (derivado).
**Y** `CustomerUser` tiene los campos `id`, `name`, `email`, `phone?`, `email_verified_at?`, `created_at?`, `updated_at?`.
**Y** `AuthError` extiende `Error`, expone `code`, `status` y `details?` (con `{ field: string[] }`).
**Y** `LoginRequest` requiere `email` + `password` y opcional `device_name`.
**Y** `RegisterRequest` requiere `name`, `email`, `password`, `password_confirmation` y opcional `phone`.
**Y** `AuthSession` requiere `access_token` + `user`, opcional `expires_at`.

### BDD-2 — SecureStorageService expone keys estables

**Dado** que la app necesita persistir token Sanctum
**Cuando** se llama `secureStorageService.getKeys()`
**Entonces** retorna `{ authToken: '101tags.auth.token', authUser: '101tags.auth.user' }`.
**Y** los strings NO cambian entre ejecuciones.

### BDD-3 — SecureStorageService.setItem usa SecureStore.setItemAsync

**Dado** que `SecureStore.isAvailableAsync() === true`
**Cuando** se llama `secureStorageService.setItem(key, value)`
**Entonces** se invoca `SecureStore.setItemAsync(key, value)`.
**Y** `SecureStore.setItemAsync` se llama exactamente una vez.

### BDD-4 — SecureStorageService.getItem usa SecureStore.getItemAsync

**Dado** que `SecureStore.isAvailableAsync() === true`
**Y** `SecureStore.getItemAsync(key) === 'abc'`
**Cuando** se llama `secureStorageService.getItem(key)`
**Entonces** retorna `'abc'`.
**Y** `SecureStore.getItemAsync` se llama con `key`.

### BDD-5 — SecureStorageService.removeItem + clear borran token y user

**Dado** que `SecureStore.isAvailableAsync() === true`
**Cuando** se llama `secureStorageService.removeItem(authToken)` o `secureStorageService.clear()`
**Entonces** se invoca `SecureStore.deleteItemAsync` con la(s) clave(s) correcta(s).
**Y** `clear()` borra AMBAS claves (`authToken` y `authUser`) en paralelo.

### BDD-6 — SecureStorageService degrada en web/jsdom

**Dado** que `SecureStore.isAvailableAsync() === false`
**Cuando** se llama cualquier método (`getItem`, `setItem`, `removeItem`, `clear`)
**Entonces** NO se invoca `SecureStore.*Async` (ni `get`, ni `set`, ni `delete`).
**Y** `getItem` retorna `null`; `setItem`/`removeItem`/`clear` no tiran.
**Y** se emite un warning una sola vez en DEV.

### BDD-7 — AuthService.login persiste token + user

**Dado** que el backend responde 200 con `{ access_token, user }` a `POST /api/auth/login`
**Cuando** se llama `authService.login('a@x.com', 'pwd')`
**Entonces** se hace `POST /api/auth/login` con `{ email, password, device_name: 'mobile-app' }`.
**Y** se persiste `access_token` bajo `101tags.auth.token` y `user` (JSON) bajo `101tags.auth.user`.
**Y** retorna `{ access_token, user }`.

### BDD-8 — AuthService.login acepta payload tipado

**Dado** que el caller quiere pasar `LoginRequest` completo
**Cuando** se llama `authService.login({ email, password, device_name: 'ipad' })`
**Entonces** se envía ese `device_name` literal (no se sobreescribe con `'mobile-app'`).
**Y** retorna `AuthSession`.

### BDD-9 — AuthService.register persiste session

**Dado** que el backend responde 200 con `{ access_token, user }` a `POST /api/auth/register`
**Cuando** se llama `authService.register({ name, email, password, password_confirmation, phone })`
**Entonces** se hace `POST /api/auth/register` con ese body.
**Y** se persiste token + user en `expo-secure-store`.
**Y** retorna `AuthSession`.

### BDD-10 — AuthService.logout limpia incluso si el backend falla

**Dado** que la app tiene token + user persistidos
**Cuando** se llama `authService.logout()` y `POST /api/auth/logout` tira `HttpError`
**Entonces** `authService.logout()` no re-lanza la excepción (best-effort).
**Y** se borran AMBAS claves del secure-store.
**Y** el estado en memoria queda limpio (vía `useAuthStore.logout`).

### BDD-11 — AuthService.me devuelve CustomerUser

**Dado** que el backend responde 200 con `CustomerUser` a `GET /api/auth/me`
**Cuando** se llama `authService.me()`
**Entonces** se hace `GET /api/auth/me` con Bearer.
**Y** retorna el `CustomerUser` parseado.

### BDD-12 — AuthService.refresh renueva token persistido

**Dado** que la app tiene user persistido (sin token muerto)
**Cuando** se llama `authService.refresh()` y el backend responde `{ access_token, expires_at }`
**Entonces** se hace `POST /api/auth/refresh` con Bearer.
**Y** se actualiza `101tags.auth.token` con el nuevo `access_token`.
**Y** se conserva el `user` persistido.

### BDD-13 — AuthService mapea HttpError → AuthError

**Dado** que el backend responde 401 a `POST /api/auth/login`
**Cuando** se llama `authService.login(email, password)`
**Entonces** se lanza `AuthError` con `code === 'INVALID_CREDENTIALS'`, `status === 401` y `message` del backend.
**Y** NO se persiste nada en secure-store.

**Dado** que el backend responde 422 a `POST /api/auth/register`
**Cuando** se llama `authService.register(payload)`
**Entonces** se lanza `AuthError` con `code === 'VALIDATION_ERROR'`, `status === 422` y `details` con los `errors` del backend.

**Dado** que el network falla (`HttpError.status === 0` o excepción nativa)
**Cuando** se llama cualquier método de auth
**Entonces** se lanza `AuthError` con `code === 'NETWORK_ERROR'`.

### BDD-14 — httpClient.setAuthTokenProvider re-asigna el provider

**Dado** que `httpClient` ya fue instanciado sin token
**Cuando** se llama `httpClient.setAuthTokenProvider(() => 'new-token')`
**Y** se hace `GET /api/auth/me`
**Entonces** el header `Authorization: Bearer new-token` se envía.
**Y** el cambio es dinámico (no requiere reinstanciar el client).

### BDD-15 — httpClient.setOnUnauthorized reacciona a 401

**Dado** que `httpClient.setOnUnauthorized(handler)` está configurado
**Cuando** un endpoint autenticado responde 401
**Entonces** se invoca `handler()` (sync o async).
**Y** el `HttpError(401)` se lanza igual para que el caller lo maneje.

### BDD-16 — auth-store.login delega en authService

**Dado** que `useAuthStore.login` se invoca con email + password
**Cuando** el usuario envía el formulario
**Entonces** `authService.login(email, password)` se llama exactamente una vez.
**Y** `isLoading` pasa a `true` antes y a `false` después.
**Y** en éxito: `state.user = session.user`, `state.token = session.access_token`.
**Y** en error (`AuthError`): se re-lanza para que la UI lo muestre (no se swallow).

### BBD-17 — auth-store.hydrate lee del secure-storage

**Dado** que la app arranca en frío
**Cuando** se llama `useAuthStore.hydrate()`
**Entonces** se leen `token` y `user` desde `secureStorageService` en paralelo.
**Y** `isHydrated` pasa a `true`.
**Y** `isLoading` pasa a `true` durante la lectura y a `false` al terminar.

### BDD-18 — ≥70 tests verdes en `pnpm test:ci`

**Dado** que el repositorio ejecuta Jest 29 con `jest-expo` preset
**Cuando** se corre `pnpm test:ci`
**Entonces** exit 0.
**Y** al menos 70 tests pasan (era 53 antes de M1.1).

### BDD-19 — `pnpm validate` exit 0

**Dado** que `validate` = `typecheck + lint + test:ci`
**Cuando** se corre `pnpm validate`
**Entonces** exit 0.

### BDD-20 — `pnpm exec expo prebuild --no-install --clean` exit 0

**Dado** que `expo prebuild` regenera `ios/` + `android/`
**Cuando** se corre con `--no-install --clean`
**Entonces** exit 0.
**Y** `ios/` y `android/` se regeneran sin errores (NO se commitean).

### BDD-21 — Sin AsyncStorage para datos sensibles

**Dado** que la app almacena credenciales
**Cuando** se greps `@react-native-async-storage/async-storage` en `src/`
**Entonces** NO aparece importado en `src/core/services/secure-storage-service.ts`, `src/core/services/auth-service.ts`, `src/stores/auth-store.ts`, ni `src/core/api/client.ts`.
**Y** AsyncStorage queda disponible sólo para datos NO sensibles (carrito local, UI prefs) — fuera de alcance de M1.1.

---

## Checklist

- [x] Spec aprobada (status APPROVED)
- [x] BDD completo (21 escenarios)
- [x] Tests escritos (RED) — creados auth.spec.ts, secure-storage-service.spec.ts, auth-service.spec.ts, actualizados auth-store.spec.ts y client.spec.ts
- [x] Tests fallando correctamente — verificado antes de TDD Green
- [x] Implementación (GREEN) — modelos, SecureStorageService, AuthService, interceptor, wiring
- [x] Refactor — strict mode, sin código muerto, sin imports innecesarios
- [x] Verification completa — `pnpm validate` exit 0 + `expo prebuild` exit 0 + ≥70 tests verdes
- [x] STATE.md actualizado (en commit siguiente o como parte de M1.2)

## Notas finales

- Esta spec NO modifica el backend Laravel (ver `AGENTS.md §Compatibilidad y backend`).
- El wrapper legacy `src/core/storage/secure-store.ts` se conserva como shim de compatibilidad (no se elimina) para no romper `src/core/storage/__tests__/secure-store.spec.ts` (7 tests verdes pre-existentes). El código nuevo usa `secureStorageService` directo.
- El método `refresh` queda implementado pero NO se programa polling automático (fuera de alcance; queda para M1.5 o M5).
- `AuthService.logout` es best-effort: si el endpoint falla, igual limpia el storage local (consistente con el patrón de `storefront/src/api/auth.ts`).
- El `device_name` por defecto es `'mobile-app'` para login; si el caller pasa uno explícito en `LoginRequest`, se respeta.
