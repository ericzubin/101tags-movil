# Spec: M1.2 — Auth service, interceptor y restauración de sesión

**Status**: APPROVED (auto-aprobado por secuencia M0→F1; revisar antes de Green)
**Spec ID**: 2026-09-09-m1-2-session-restore-guards
**Author**: Agente (issue M1.2)
**Date**: 2026-09-09
**Related specs**: `.spec/2026-09-09-m1-1-auth-models-service.md` (DONE — base), `.spec/2026-09-09-m0-1-auditar-contratos.md` (Sanctum), `.spec/00-rn-expo-scaffold.md`

**GitHub issue (interno)**: M1.2 — rama `chore/m1-2-session-restore-guards`.

---

## Contexto

- M1.1 dejó una capa auth completa: 7 modelos, `SecureStorageService`, `AuthService`, `HttpClient` con `setAuthTokenProvider` + `setOnUnauthorized`, `auth-store` refactorizado, login/register con handlers reales.
- El wiring en `src/app/_layout.tsx` invoca `httpClient.setAuthTokenProvider(() => authService.getStoredToken())` y `setOnUnauthorized` que limpia el store. Pero:
  - **No hay hidratación al boot**: si el usuario abre la app con un token en Keychain, el `auth-store` arranca vacío. Las pantallas protegidas redirigirían a login.
  - **No hay navegación reactiva al 401**: el handler limpia sesión pero no navega a `/(auth)/login`.
  - **No hay guards de navegación**: cualquier ruta es accesible sin chequeo de sesión.
  - **El interceptor agrega bearer a TODAS las requests**: `/api/auth/login` y `/register` no deben llevar Authorization header (backend Sanctum rechaza si el endpoint es público).
  - **No hay pantalla Splash que decida antes de mostrar rutas**: M1.5 cubrirá visual, pero la decisión (loading → home o login) debe existir ya.

## Problema

Sin M1.2, la app tiene los "ladrillos" de auth pero ningún flujo de sesión continuo. Necesitamos:

1. **Hidratación al boot**: si existe token en Keychain, llamar `GET /api/auth/me` para validar. Si 200 → restaurar `AuthSession`. Si 401 → limpiar y quedar como guest.
2. **Inyección selectiva del bearer**: sólo en endpoints autenticados. Endpoints públicos (`/auth/login`, `/auth/register`) NO deben llevar `Authorization`.
3. **Navegación reactiva al 401**: cuando `setOnUnauthorized` se dispara, además de limpiar sesión debe navegar a `/(auth)/login` (manteniendo la ruta intent para redirect post-login opcional).
4. **Guards de navegación**:
   - `authGuard`: rutas bajo `(tabs)/` y otras protegidas requieren sesión activa. Si no → `/(auth)/login`.
   - `guestGuard`: rutas bajo `(auth)/` (login/register) requieren sesión inactiva. Si ya hay sesión → `/(tabs)`.
   - Sin loops: un redirect legítimo no debe volver a ser interceptado por el mismo guard.
5. **Estado de hidratación expuesto**: `useAuthStore()` debe exponer `isHydrated: boolean` para que la UI no parpadee entre login y home durante el boot.
6. **No loggear tokens ni passwords**: verificación por código y por test (asegurar que ningún logger emite valores de `Authorization` o `password`).

## Objetivo

Convertir la base auth de M1.1 en una sesión restaurable automáticamente, con guards de navegación, inyección selectiva de bearer y manejo reactivo del 401, dejando todo listo para M1.3 (UX polish) y M1.5 (splash visual).

## Fuera de alcance

- Formularios de login/register con validación UX detallada (M1.3).
- Splash screen animada con branding (M1.5). El "splash lógico" (decisión de sesión antes de mostrar rutas) sí va aquí.
- Forgot/reset password + deep links (M1.4).
- Push notifications.
- Modificar el backend Laravel (prohibido por `AGENTS.md`).
- OpenPay / pagos.
- Refresh proactivo (queda `authService.refresh()` implementado en M1.1 pero no se programa polling aquí).

## Arquitectura afectada

### Crear

- `src/core/navigation/guards.ts` — helpers `authGuard()` y `guestGuard()` (funciones puras que devuelven `true | { redirect: string }`).
- `src/core/navigation/__tests__/guards.spec.ts` (≥6 tests).
- `src/core/api/__tests__/client-bearer-scope.spec.ts` (≥4 tests) — verifica bearer solo en endpoints autenticados.
- `src/stores/__tests__/auth-store-hydration.spec.ts` (≥6 tests) — `hydrate()` setea `isHydrated`, llama `me`, maneja 401.
- `.spec/2026-09-09-m1-2-session-restore-guards.md` (esta spec).

### Modificar

- `src/core/api/client.ts`:
  - Lista interna `PUBLIC_PATHS: RegExp[]` (e.g. `^\/api\/auth\/(login|register|refresh)$`).
  - `getAuthHeader()` retorna `null` si el path matchea `PUBLIC_PATHS`, sino `Bearer <token>`.
  - `setAuthTokenProvider(provider)` guarda provider; `setOnUnauthorized(handler)` guarda handler. (Ya existen en M1.1.)
  - Exponer `PUBLIC_PATHS` (o un getter `isPublicPath(path)`) para tests.
- `src/core/services/auth-service.ts`:
  - `hydrate(): Promise<boolean>` — lee token; si no hay, retorna false. Si hay, llama `me()`; si 200 setea sesión y retorna true; si 401, limpia y retorna false.
- `src/stores/auth-store.ts`:
  - Estado: añadir `isHydrated: boolean` (default `false`).
  - Acción: `hydrate(): Promise<boolean>` que llama `authService.hydrate()` y actualiza estado.
  - Selector: `selectIsHydrated`, `selectIsAuthenticated` (derivable de `session !== null`).
- `src/app/_layout.tsx`:
  - `useEffect` al mount: `await useAuthStore.getState().hydrate()`.
  - Mientras `!isHydrated`, renderizar un splash lógico (View vacío o ActivityIndicator) en lugar del Stack.
  - Wiring del `setOnUnauthorized`: además de `clearSession`, hacer `router.replace('/(auth)/login')`.
- `src/app/(auth)/_layout.tsx`:
  - Wrap con `guestGuard()`: si `isAuthenticated` → `<Redirect href="/(tabs)" />`.
- `src/app/(tabs)/_layout.tsx`:
  - Wrap con `authGuard()`: si `!isAuthenticated && isHydrated` → `<Redirect href="/(auth)/login" />`.

### No tocar

- `package.json` (versiones, dependencias).
- `app.json`, `eas.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `tsconfig.json`.
- Backend Laravel.
- `src/core/models/auth.ts`, `src/core/services/secure-storage-service.ts` (sauf cambios menores si son inevitables y documentados en la spec).

## Contratos

### Auth session lifecycle

| Estado | Disparador | Resultado |
|---|---|---|
| App boot | `useAuthStore.getState().hydrate()` | `isHydrated = true`. Si token válido → `session` populado. Si no → `session = null`. |
| 401 en fetch autenticado | `httpClient.setOnUnauthorized` | `clearSession()` + `router.replace('/(auth)/login')`. |
| Login OK | `useAuthStore().login(...)` | `session` populado + `router.replace('/(tabs)')`. |
| Logout | `useAuthStore().logout()` | `session = null` + `router.replace('/(auth)/login')`. |

### Bearer injection scope

| Endpoint | Path | Bearer | Notas |
|---|---|---|---|
| Login | `/api/auth/login` | NO | público |
| Register | `/api/auth/register` | NO | público |
| Logout | `/api/auth/logout` | SÍ | requiere sesión |
| Me | `/api/auth/me` | SÍ | requiere sesión |
| Refresh | `/api/auth/refresh` | NO | público (intercambia refresh token) |
| (otros endpoints) | `/api/...` | SÍ | requiere sesión |

Implementación:
```ts
const PUBLIC_PATH_PATTERNS: RegExp[] = [
  /^\/api\/auth\/(login|register|refresh)$/,
];
function isPublicPath(path: string): boolean {
  return PUBLIC_PATH_PATTERNS.some((re) => re.test(path));
}
```

### Guards

```ts
// src/core/navigation/guards.ts
type GuardResult = true | { redirect: string };

export function authGuard(opts: { isAuthenticated: boolean; isHydrated: boolean }): GuardResult {
  if (!opts.isHydrated) return true; // splash aún decidiendo
  if (opts.isAuthenticated) return true;
  return { redirect: '/(auth)/login' };
}

export function guestGuard(opts: { isAuthenticated: boolean; isHydrated: boolean }): GuardResult {
  if (!opts.isHydrated) return true;
  if (!opts.isAuthenticated) return true;
  return { redirect: '/(tabs)' };
}
```

En los `_layout.tsx` se usan como:
```tsx
const session = useAuthStore((s) => s.session);
const isHydrated = useAuthStore((s) => s.isHydrated);
const guard = authGuard({ isAuthenticated: !!session, isHydrated });
if (guard !== true) return <Redirect href={guard.redirect} />;
```

## Acceptance Criteria (BDD)

> Los BDD a continuación son el set mínimo de escenarios que cubren los AC del backlog. Cada uno debe tener al menos un test Jest que valide el comportamiento.

### AC1: Hidratación al boot restaura sesión válida

```gherkin
Scenario: App boot con token válido en Keychain
  Given expo-secure-store contiene "101tags.auth.token" = "<valid-token>"
  And GET /api/auth/me retorna 200 con CustomerUser "Eric"
  When useAuthStore.getState().hydrate() ejecuta
  Then isHydrated === true
  And session contiene { token: "<valid-token>", user: { name: "Eric", ... } }
  And auth-store llama authService.me() exactamente una vez
```

### AC2: Hidratación al boot limpia sesión inválida

```gherkin
Scenario: App boot con token expirado
  Given expo-secure-store contiene "101tags.auth.token" = "<expired-token>"
  And GET /api/auth/me retorna 401
  When useAuthStore.getState().hydrate() ejecuta
  Then isHydrated === true
  And session === null
  And expo-secure-store.deleteItemAsync("101tags.auth.token") fue llamado
```

### AC3: Hidratación sin token marca app como guest

```gherkin
Scenario: App boot sin token
  Given expo-secure-store NO contiene "101tags.auth.token"
  When useAuthStore.getState().hydrate() ejecuta
  Then isHydrated === true
  And session === null
  And authService.me() NO es llamado
```

### AC4: Bearer NO se inyecta en endpoints públicos

```gherkin
Scenario: POST /api/auth/login sin Authorization header
  Given auth-store tiene sesión activa
  When httpClient.post("/api/auth/login", { email, password }) ejecuta
  Then el request NO incluye header "Authorization"
  And el body contiene { email, password }
```

```gherkin
Scenario: POST /api/auth/register sin Authorization header
  Given auth-store tiene sesión activa
  When httpClient.post("/api/auth/register", { name, email, password, password_confirmation }) ejecuta
  Then el request NO incluye header "Authorization"
```

```gherkin
Scenario: GET /api/auth/me CON Authorization header
  Given auth-store tiene sesión activa
  And auth-store.token = "<token>"
  When httpClient.get("/api/auth/me") ejecuta
  Then el request incluye header "Authorization: Bearer <token>"
```

### AC5: 401 limpia sesión y navega a login

```gherkin
Scenario: 401 en endpoint autenticado
  Given user navega a /(tabs)/account y authStore tiene sesión activa
  And GET /api/customer/orders retorna 401
  When httpClient procesa la respuesta
  Then auth-store.session === null
  And expo-secure-store.deleteItemAsync("101tags.auth.token") fue llamado
  And router.replace("/(auth)/login") fue llamado
```

### AC6: Guard auth protege rutas autenticadas

```gherkin
Scenario: Usuario sin sesión intenta acceder a /(tabs)
  Given authStore.session === null
  And isHydrated === true
  When /(tabs)/_layout renderiza
  Then <Redirect href="/(auth)/login" /> se ejecuta
```

```gherkin
Scenario: Usuario autenticado accede a /(tabs)
  Given authStore.session !== null
  And isHydrated === true
  When /(tabs)/_layout renderiza
  Then no hay redirect; el contenido de (tabs) se muestra
```

### AC7: Guard guest protege login/register

```gherkin
Scenario: Usuario autenticado intenta acceder a /(auth)/login
  Given authStore.session !== null
  When /(auth)/_layout renderiza
  Then <Redirect href="/(tabs)" /> se ejecuta
```

### AC8: Splash lógico evita parpadeo

```gherkin
Scenario: App boot con token en storage
  Given Keychain contiene token válido
  And hydrate() aún no termina
  When _layout renderiza por primera vez
  Then NO se muestra /(tabs) ni /(auth)/login todavía
  And se muestra un splash placeholder (View vacío o ActivityIndicator)
  When hydrate() termina (isHydrated === true)
  Then /(tabs) se renderiza (porque session es válido)
```

### AC9: No se loggean tokens ni passwords

```gherkin
Scenario: Logger recibe un request que contiene token
  Given un logger captura console.log/error/warn
  When httpClient hace un GET /api/auth/me con token "<secret-token>"
  Then el logger NO contiene la cadena "<secret-token>"
```

```gherkin
Scenario: AuthError serializa mensaje sin token
  Given AuthError(message="Invalid credentials")
  When JSON.stringify(error) ejecuta
  Then el JSON NO contiene el token que disparó el 401
```

### AC10: Sin loops de redirect

```gherkin
Scenario: Redirect a login no vuelve a ser interceptado
  Given usuario sin sesión navega a /(tabs)
  When authGuard redirige a /(auth)/login
  Then guestGuard en /(auth)/_layout permite la ruta (porque !isAuthenticated)
  And no se genera un loop de redirects
```

## Acceptance Criteria (Definition of Done)

- [ ] Spec escrita y revisada.
- [ ] TDD Red: 6 archivos de tests nuevos (auth-store-hydration, client-bearer-scope, guards, plus augmentation de auth-store y client) — todos rojos antes de Green.
- [ ] TDD Green: implementación mínima hace pasar todos los tests nuevos sin romper los 90 existentes.
- [ ] Refactor: ningún hex literal en componentes (`#999` → tokens), ninguna regresión de quality tests.
- [ ] Verificación low-I/O (sin pnpm test:ci full):
  - `pnpm typecheck` exit 0
  - `pnpm lint` exit 0
  - `pnpm test <archivo.spec.ts>` por cada archivo nuevo + smoke del archivo tocado, exit 0
  - Suite del archivo `auth-store.spec.ts` (existente) sigue verde
- [ ] `STATE.md` actualizado con delta de tests.
- [ ] `TASKS.md` marca M1.2 como `DONE`.
- [ ] `spec/2026-09-09-m1-2-session-restore-guards.md` marcada `DONE`.
- [ ] Commit en rama `chore/m1-2-session-restore-guards`, push, PR, merge.
- [ ] `git status` limpio en main.

## Riesgos y pendientes

- **Web fallback**: `expo-secure-store` retorna `false` en web. La hidratación debe manejar esto sin throw (warn once + tratar como guest). Ya cubierto por M1.1.
- **Race condition entre hydrate y renders**: el splash lógico cubre esto. Test AC8 lo valida.
- **Router replace durante render**: usar `<Redirect>` en lugar de `router.replace` cuando estamos dentro de un `_layout`. Para 401 (que sucede async), `router.replace` desde un handler sí es seguro.
- **Tests de `_layout.tsx`**: probar navigation guards a nivel de funciones puras (`authGuard`/`guestGuard`) es más fiable que renderizar layouts con expo-router. Los tests de layout son bonus, no bloqueantes.

## Handover

Al cerrar esta spec:
- 6 archivos de tests nuevos (≥30 tests adicionales esperados).
- Total tests estimado: 90 + ~30 = **~120 tests verdes**.
- Próximo issue: **M1.3 — Login y registro funcionales** (validaciones UX, loading states, error UX). Depende de esta spec.
