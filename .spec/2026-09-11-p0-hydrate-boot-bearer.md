# Spec: P0 — Hydrate boot bearer (session restoration rota)

**Status**: APPROVED (auto-aprobado por severidad P0)
**Spec ID**: 2026-09-11-p0-hydrate-boot-bearer
**Author**: Agente principal (Architect)
**Date**: 2026-09-11
**Banda**: **🔴 P0 — Blocker** (auditoría externa 2026-09-10)
**Issue GitHub**: nueva — `[101M][P0] Restauración de sesión al abrir la app está rota: /me sale sin Authorization y borra una sesión válida`

---

## Contexto (severidad P0)

Auditoría externa descubrió un bug crítico en la cadena de hidratación al boot:

```
_layout.tsx (M1.2):
  1. httpClient.setAuthTokenProvider(() => useAuthStore.getState().token)   ← provider OK
  2. useAuthStore.getState().hydrate()                                      ← arranca
     └─ authService.hydrate()                                               ← M1.5
        ├─ secureStorageService.getItem('auth.token') → 'abc123'            ← lee token
        └─ httpClient.get('/auth/customer/me')                              ← pide token
           └─ provider() → useAuthStore.getState().token → null             💥 VACÍO
              └─ /me sale SIN Authorization → backend responde 401
                 └─ httpClient.onUnauthorized() → authService.handleUnauthorized()
                    └─ secureStorageService.clear()                         💥 SESIÓN VÁLIDA BORRADA
```

**Resultado:** cada vez que un usuario abre la app con un token válido persistido, el sistema lo borra automáticamente y lo expulsa a login. La restauración de sesión no funciona.

### Por qué los tests no lo detectan

- `auth-service.spec.ts` mockea `httpClient` completo (no ve el provider real).
- `useAuthStore` tests mockean `authService.hydrate` (no ven el SecureStore→Zustand gap).
- **No existe un integration test que conecte SecureStore → auth-service → httpClient (provider real) → Zustand.**

---

## Objetivo

1. **Reordenar `useAuthStore.hydrate()`** para seedear el token en Zustand ANTES de llamar `authService.hydrate()`. Cuando `authService.hydrate()` invoque `/me`, el provider devolverá el token y el header `Authorization: Bearer ...` se adjuntará correctamente.
2. **Mantener el invariant**: durante el seed, `user` permanece `null` → `isAuthenticated(state)` retorna `false` → los guards siguen bloqueando al usuario en `(auth)` mientras corre `/me`. No hay ventana donde se renderice UI autenticada sin user.
3. **Integration test nuevo** (`hydrate-integration.spec.ts`) que conecte SecureStore real + httpClient real con provider + useAuthStore real + mocks solo en el fetch boundary. Cubre happy path / 401 / network error / mid-boot invariant.

---

## Fuera de alcance

- Refactor de `auth-service.hydrate()` para pasar token explícito en headers. El fix es solo en `useAuthStore.hydrate()`. `auth-service.hydrate()` permanece self-contained.
- Cambios a `app/_layout.tsx`. El orden del provider ya está bien.
- Cambios a `core/api/client.ts`. El mecanismo de provider ya está bien.
- Cambios a guards de navegación.
- Tests visuales de boot con device.

---

## Arquitectura afectada

### Modificar

- `src/stores/auth-store.ts` — reordenar método `hydrate()`.

### Crear

- `src/stores/__tests__/hydrate-integration.spec.ts` — integration test completo.

### Actualizar (si es necesario)

- `src/stores/__tests__/isAuthenticated.spec.ts` — añadir test defensivo "token sin user → isAuthenticated=false".
- `src/app/__tests__/_layout.spec.tsx` — verificar que el orden de mocks no asuma ordering antiguo.

---

## Contratos

### `useAuthStore.hydrate()` (nueva implementación)

```ts
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
    // Step 1: Read the stored token first.
    const storedToken = await authService.getStoredToken();

    // Step 2: Seed Zustand so the httpClient provider can attach the
    // bearer for the /me request.
    if (storedToken) {
      set({ token: storedToken, user: null, isHydrated: false, isLoading: true });
    }

    // Step 3-5: Delegate to authService (it owns the SecureStore logic).
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
```

### `authService.hydrate()` (sin cambios)

Permanece self-contained. Sigue siendo invocable desde tests sin pasar por store. El fix está solo en `useAuthStore.hydrate()` que ahora prepara el provider antes de invocarlo.

---

## Acceptance Criteria (BDD)

### AC1: Token leído antes de /me

```gherkin
Scenario: Hydrate corre
  Given SecureStore tiene auth.token = "abc123"
  When useAuthStore.hydrate() corre
  Then authService.getStoredToken() se llama ANTES de httpClient.get('/me')
```

### AC2: /me lleva Authorization Bearer stored-token

```gherkin
Scenario: Header presente
  Given SecureStore tiene token = "abc123"
  When hydrate corre
  Then httpClient captura headers del /me request
  And Authorization header = "Bearer abc123"
```

### AC3: /me 200 → Zustand completo

```gherkin
Scenario: Happy path
  Given SecureStore tiene token = "abc123"
  And /me responde 200 con {user: {id:1, name:"Juan", email:"j@x.com", role:"customer"}}
  When hydrate corre
  Then Zustand final = {token: "abc123", user: {...}, isHydrated: true, isLoading: false}
```

### AC4: /me 401 → SecureStore limpio, Zustand vacío

```gherkin
Scenario: Token inválido
  Given SecureStore tiene token = "abc123"
  And /me responde 401
  When hydrate corre
  Then SecureStore.clear() llamado
  And Zustand final = {token: null, user: null, isHydrated: true, isLoading: false}
```

### AC5: /me network error → SecureStore intacto, Zustand vacío

```gherkin
Scenario: Sin conexión
  Given SecureStore tiene token = "abc123"
  And /me throws NetworkError
  When hydrate corre
  Then SecureStore.clear() NO llamado
  And Zustand final = {token: null, user: null, isHydrated: true, isLoading: false}
```

### AC6: Mid-boot invariant — token sin user

```gherkin
Scenario: Estado intermedio
  Given SecureStore tiene token = "abc123"
  And /me está pendiente (nunca resuelve)
  When capturo el estado mid-boot
  Then token = "abc123"
  And user = null
  And isHydrated = false
  And isAuthenticated(state) = false
```

### AC7: Guards bloquean durante seed

```gherkin
Scenario: Guard durante boot
  Given SecureStore tiene token = "abc123"
  And /me está pendiente
  When (tabs)/_layout renderiza
  And authGuard({isAuthenticated, isHydrated}) evalúa
  Then isAuthenticated = false (porque user es null)
  And isHydrated = false
  And guard retorna true (sin redirect — splash gate)
```

### AC8: Tests existentes no rompen

```gherkin
Scenario: Regresión
  When pnpm typecheck
  Then exit 0
  When pnpm lint
  Then exit 0
  When pnpm test src/stores/__tests__/isAuthenticated.spec.ts
  Then exit 0
  When pnpm test src/core/services/__tests__/auth-service.spec.ts
  Then exit 0
  When pnpm test src/app/__tests__/_layout.spec.tsx
  Then exit 0
```

---

## Definition of Done

- [ ] Spec escrita.
- [ ] `useAuthStore.hydrate()` reordenado (seed antes de `authService.hydrate()`).
- [ ] `src/stores/__tests__/hydrate-integration.spec.ts` creado (≥6 tests cubriendo AC1-AC6).
- [ ] `src/stores/__tests__/isAuthenticated.spec.ts` actualizado con test defensivo AC6.
- [ ] `pnpm typecheck` exit 0.
- [ ] `pnpm lint` exit 0.
- [ ] Cada test listado arriba exit 0.
- [ ] Regresión: suite `(auth)`, `(tabs)`, `core/services` verde.
- [ ] STATE.md, spec DONE; commit docs a `developer`.
- [ ] PR contra `developer`, merge con `--squash --delete-branch --admin`.
- [ ] Issue P0 creada y cerrada en GitHub con link al PR.

---

## Riesgos / caveats

1. **Tests que mockean `authService.hydrate` directamente** en `useAuthStore` specs podrían no cubrir este escenario. Verificar que la suite completa pasa.
2. **Nuevo invariant**: `token` puede estar set mientras `user` y `isHydrated` son null. El helper `isAuthenticated` ya respeta esto (requiere ambos).
3. **`_layout.tsx:68`** sigue mostrando splash mientras `!isHydrated || !fontsLoaded`. Durante el seed, `isHydrated=false` → splash persiste → UI no se monta → no hay ventana donde se renderice UI autenticada con estado parcial. ✓
4. **No hay cambio de contrato** para `authService.hydrate()` — sigue siendo self-contained.
5. **No hay cambio de contrato** para `httpClient` provider — sigue leyendo de Zustand.

---

## Handover

Al cerrar:
- ~6-8 tests nuevos (integration + defensivo).
- Total tests: ~263 → **~270**.
- P0 fix aplicado.
- Sesión persistente ahora funciona correctamente al abrir la app.
- Próximo: retomar F2 (M2.0-setup).
