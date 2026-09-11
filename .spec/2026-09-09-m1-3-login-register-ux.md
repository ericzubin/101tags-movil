# Spec: M1.3 — Login y registro funcionales (UX polish + validaciones)

**Status**: DONE (PR #TBD contra `developer`, pendiente de merge)
**Spec ID**: 2026-09-09-m1-3-login-register-ux
**Author**: Agente (issue M1.3)
**Date**: 2026-09-09
**Related specs**: `.spec/2026-09-09-m1-2-session-restore-guards.md` (DONE — base session), `.spec/2026-09-09-m1-1-auth-models-service.md` (DONE — auth services)

**GitHub issue (interno)**: M1.3 — rama `chore/m1-3-login-register-ux`.

---

## Contexto

- M1.1 implementó `login.tsx` y `register.tsx` con handlers reales que llaman `useAuthStore().login/register`, capturan `AuthError`, y hacen `router.replace('/(tabs)')` en éxito.
- M1.2 añadió hidratación al boot, guards de navegación y bearer selectivo.
- Las pantallas funcionan end-to-end, pero faltan las UX polish típicas de formularios serios:
  - Sin **validación cliente** (email vacío, formato email, password corto, confirmación no coincide).
  - Sin **estado de loading** que deshabilite el botón y evite doble submit.
  - Sin **errores por campo** del backend (422) — sólo se muestra el mensaje global.
  - Sin **diferenciación de errores** (401 vs 422 vs 429 vs 5xx vs red) — siempre se muestra `err.message`.
  - Sin **auto-focus** al siguiente input al presionar Enter.

## Problema

Sin M1.3, el usuario:
- Puede mandar formularios vacíos al backend (round-trip innecesario).
- Puede doble-tap "Entrar" → 2 requests a `/api/auth/login`.
- Ve sólo un mensaje genérico cuando el backend ya le devolvió un error por campo (ej. "El campo email es requerido").
- No recibe feedback durante el request (botón sigue activo).

Necesitamos:
1. **Validación cliente** antes de llamar al backend: email regex + password ≥ 8 chars + password_confirmation === password en register; email + password no vacíos en login.
2. **Loading state** per-pantalla: `isSubmitting: boolean`; mientras true, button disabled + spinner, campos disabled, submit no se vuelve a llamar.
3. **Mapeo de errores backend** (`AuthError.code` ya existe: `INVALID_CREDENTIALS`, `VALIDATION_ERROR`, `RATE_LIMITED`, `SERVER_ERROR`, `NETWORK_ERROR`, `UNKNOWN`). Mapear cada uno a mensaje UX en español-MX.
4. **Errores por campo** cuando `AuthError.code === 'VALIDATION_ERROR'` y `error.fields` está populado (Laravel 422 devuelve `{ message, errors: { field: [msg] } }`).
5. **Auto-focus** al siguiente input al presionar Enter en login (email → password → submit).
6. **Hints inline** debajo de cada campo con error.
7. **A11y**: `accessibilityLabel` + `accessibilityHint` en inputs y buttons.

## Objetivo

Llevar las pantallas de login y register a UX de producción: validación cliente, loading state, errores específicos por código y por campo, navegación fluida entre inputs, accesibilidad básica.

## Fuera de alcance

- Forgot/reset password (M1.4).
- Splash animado / branding visual (M1.5).
- Internacionalización más allá de español-MX (sólo es-MX por ahora).
- Persistir último email para pre-fill (decisión de UX futura).
- Social login (Google/Apple) — fuera del MVP.
- 2FA / MFA — fuera del MVP.
- Modificar backend Laravel (prohibido por `AGENTS.md`).

## Arquitectura afectada

### Crear

- `src/core/i18n/errors.ts` — mapa `AuthErrorCode → mensaje UX es-MX`. Exporta `formatAuthError(error: AuthError): string` que retorna mensaje localizado.
- `src/core/i18n/__tests__/errors.spec.ts` (≥6 tests, uno por código + casos borde).
- `src/core/validation/auth.ts` — funciones puras: `validateLogin({ email, password })`, `validateRegister({ name, email, password, passwordConfirmation })`. Retornan `{ ok: boolean, fieldErrors: Record<string, string>, summary?: string }`.
- `src/core/validation/__tests__/auth.spec.ts` (≥10 tests: emails válidos/inválidos, passwords cortos/largos, confirmaciones coincidentes/no, campos vacíos).
- `.spec/2026-09-09-m1-3-login-register-ux.md` (esta spec).

### Modificar

- `src/app/(auth)/login.tsx`:
  - Estado: `isSubmitting: boolean`, `fieldErrors: { email?, password? }`.
  - `validateLogin` antes de llamar `login()`; si falla, setea `fieldErrors` y retorna.
  - `onSubmit`: set `isSubmitting=true`; try/catch `login`; mapea `AuthError` con `formatAuthError`; setea `fieldErrors` si `error.code === 'VALIDATION_ERROR'`; finally `isSubmitting=false`.
  - Button `disabled={isSubmitting}` + `accessibilityState={{ busy: isSubmitting }}`.
  - Inputs `editable={!isSubmitting}` + `accessibilityLabel` + `accessibilityHint`.
  - Auto-focus: en email `onSubmitEditing` enfoca password; en password `onSubmitEditing` dispara `onSubmit`.
  - Render `{fieldErrors.email && <Text>{fieldErrors.email}</Text>}` debajo del input.
- `src/app/(auth)/register.tsx`:
  - Estado: `isSubmitting`, `fieldErrors: { name?, email?, password?, passwordConfirmation? }`.
  - `validateRegister` antes de llamar `register()`.
  - Idéntica lógica de error mapping y loading.
  - Auto-focus secuencial: name → email → password → passwordConfirmation → submit.
- `src/core/models/auth.ts`: asegurar que `AuthError` tiene `fields?: Record<string, string[]>` (probablemente ya existe en M1.1; verificar).

### No tocar

- `package.json`, `app.json`, `eas.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `tsconfig.json`, `jest.config.js`, `jest.setup.js`, `eslint.config.js`.
- `src/core/api/client.ts`, `src/core/services/*`, `src/stores/*`, `src/core/navigation/*` (M1.2 cerrado).
- Backend Laravel.

## Contratos

### AuthError UX mapping

```ts
// src/core/i18n/errors.ts
const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  VALIDATION_ERROR: 'Revisa los campos marcados.',
  RATE_LIMITED: 'Demasiados intentos. Intenta de nuevo en unos minutos.',
  SERVER_ERROR: 'No pudimos contactar al servidor. Intenta más tarde.',
  NETWORK_ERROR: 'Sin conexión. Verifica tu internet.',
  UNKNOWN: 'Algo salió mal. Intenta de nuevo.',
};

export function formatAuthError(error: AuthError): string {
  return AUTH_ERROR_MESSAGES[error.code] ?? AUTH_ERROR_MESSAGES.UNKNOWN;
}
```

### Validation contract

```ts
// src/core/validation/auth.ts
type FieldErrors = Partial<Record<'email' | 'password' | 'name' | 'passwordConfirmation', string>>;

export type ValidationResult =
  | { ok: true }
  | { ok: false; fieldErrors: FieldErrors };

export function validateLogin(input: { email: string; password: string }): ValidationResult;
export function validateRegister(input: {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}): ValidationResult;
```

Reglas:
- email no vacío + regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
- password ≥ 8 chars.
- name ≥ 2 chars (register).
- passwordConfirmation === password (register).
- Sin normalizar input (no trim) — el backend lo hará; aquí sólo bloquea los obviously wrong.

### Loading state UX

| Estado | Button | Inputs | Spinner | Submit handler |
|---|---|---|---|---|
| Idle | enabled | enabled | no | runs |
| Submitting | disabled + label "Entrando…" / "Registrando…" | disabled | yes | no-op |
| Error | enabled | enabled | no | runs (reintento) |
| Hydration | (n/a, splash lógico) | (n/a) | (n/a) | (n/a) |

## Acceptance Criteria (BDD)

### AC1: Login con email vacío muestra error inline

```gherkin
Scenario: Usuario abre login y presiona Entrar sin escribir email
  Given pantalla /login renderizada
  When presiona el botón "Entrar"
  Then NO se llama a useAuthStore().login
  And debajo del input email aparece "El correo es obligatorio"
  And el botón "Entrar" sigue habilitado (no loading)
```

### AC2: Login con email inválido muestra error inline

```gherkin
Scenario: Email mal formado
  Given email = "no-es-email"
  When presiona "Entrar"
  Then NO se llama a useAuthStore().login
  And debajo de email aparece "Ingresa un correo válido"
```

### AC3: Login con password corto

```gherkin
Scenario: password < 8 chars
  Given email = "user@x.com", password = "123"
  When presiona "Entrar"
  Then NO se llama a useAuthStore().login
  And debajo de password aparece "La contraseña debe tener al menos 8 caracteres"
```

### AC4: Login con credenciales inválidas (401)

```gherkin
Scenario: Backend responde 401 INVALID_CREDENTIALS
  Given useAuthStore().login mockeado para rechazar con AuthError(INVALID_CREDENTIALS, "...")
  When usuario llena email/password válidos y presiona Entrar
  Then el botón pasa a loading durante la request
  And al terminar, button vuelve a enabled
  And se muestra el mensaje "Correo o contraseña incorrectos." (es-MX)
  And useAuthStore().login fue llamado exactamente una vez
```

### AC5: Login con 422 muestra errores por campo

```gherkin
Scenario: Backend responde 422 VALIDATION_ERROR con fields
  Given useAuthStore().login mockeado para rechazar con AuthError(VALIDATION_ERROR, "...", { fields: { email: ["El email es obligatorio"], password: ["..."] } })
  When usuario presiona Entrar
  Then debajo de email aparece "El email es obligatorio" (mensaje del backend)
  And debajo de password aparece el mensaje del backend
  And el botón vuelve a enabled
```

### AC6: Login con 429 RATE_LIMITED

```gherkin
Scenario: Backend responde 429
  Given useAuthStore().login mockeado para rechazar con AuthError(RATE_LIMITED, "...")
  When usuario presiona Entrar
  Then se muestra "Demasiados intentos. Intenta de nuevo en unos minutos."
  And NO se muestra error en campo específico
```

### AC7: Login con error de red

```gherkin
Scenario: Network error
  Given useAuthStore().login mockeado para rechazar con AuthError(NETWORK_ERROR, "...")
  When usuario presiona Entrar
  Then se muestra "Sin conexión. Verifica tu internet."
```

### AC8: Loading evita doble submit

```gherkin
Scenario: Doble tap rápido
  Given useAuthStore().login mockeado con delay de 200ms
  When usuario presiona Entrar dos veces en <100ms
  Then useAuthStore().login es llamado exactamente una vez
  And durante los 200ms el botón muestra "Entrando…" y está disabled
```

### AC9: Auto-focus secuencial en login

```gherkin
Scenario: Enter en email enfoca password
  Given usuario en /login
  When input email tiene foco y presiona Enter (returnKeyType="next")
  Then input password recibe foco
  When input password tiene foco y presiona Enter (returnKeyType="go")
  Then se dispara onSubmit del formulario
```

### AC10: Register con name corto

```gherkin
Scenario: name = "a"
  Given name = "a", email = "user@x.com", password = "12345678", passwordConfirmation = "12345678"
  When presiona Registrarme
  Then NO se llama a useAuthStore().register
  And debajo de name aparece "El nombre debe tener al menos 2 caracteres"
```

### AC11: Register con confirmación no coincidente

```gherkin
Scenario: password !== passwordConfirmation
  Given password = "12345678", passwordConfirmation = "12345679"
  When presiona Registrarme
  Then NO se llama a useAuthStore().register
  And debajo de passwordConfirmation aparece "Las contraseñas no coinciden"
```

### AC12: Register éxito navega a /(tabs)

```gherkin
Scenario: Registro OK
  Given useAuthStore().register mockeado para resolver con AuthSession válida
  When usuario llena todos los campos válidos y presiona Registrarme
  Then el botón pasa a loading
  And al resolver, router.replace("/(tabs)") se ejecuta
  And ningún mensaje de error se muestra
```

### AC13: Accesibilidad básica

```gherkin
Scenario: Inputs tienen labels accesibles
  Given pantalla /login
  Then input email tiene accessibilityLabel="Correo electrónico"
  And input password tiene accessibilityLabel="Contraseña"
  And botón Entrar tiene accessibilityLabel="Iniciar sesión"
  And durante loading, button tiene accessibilityState.busy = true
```

## Acceptance Criteria (Definition of Done)

- [ ] Spec escrita.
- [ ] TDD Red: 4 archivos de tests nuevos (`errors.spec.ts`, `auth.spec.ts`, plus augmentation de `login/register` specs con tests de UX) — todos rojos antes de Green.
- [ ] TDD Green: implementación hace pasar todos los nuevos tests sin romper los ~136 existentes.
- [ ] Refactor: sin hex literales en componentes (regla `no-restricted-syntax`).
- [ ] Verificación low-I/O:
  - `pnpm typecheck` exit 0
  - `pnpm lint` exit 0
  - `pnpm test <cada archivo nuevo>` exit 0
  - `pnpm test src/app/__tests__/splash-theme.spec.ts` (regresión) exit 0
- [ ] `STATE.md` y `TASKS.md` actualizados con delta.
- [ ] Commit, push, PR contra `developer`.
- [ ] NO hacer merge — el agente principal lo hace.

## Riesgos y pendientes

- **Traducción hardcoded a es-MX**: futuro i18n requerirá refactor; aceptable para MVP.
- **No persistir último email**: decisión consciente de no incluirla; podría añadirse en M6.1 (settings).
- **Backend puede devolver HTML en 5xx** (no JSON): el cliente debería capturar esto y mapear a `SERVER_ERROR` con mensaje "Algo salió mal". Si el spec de M1.1 ya lo cubre, OK; sino, extender en `auth-service.ts` sin modificar el spec M1.1 (sólo un fix mínimo).
- **Testing library `fireEvent.press` puede no disparar handlers disabled**: usar `userEvent` o invocar handler directamente. Aceptar workaround en tests.

## Handover

Al cerrar esta spec:
- 4 archivos de tests nuevos (≥22 tests adicionales).
- Total tests estimado: 136 + ~22 = **~158 tests verdes**.
- Próximo issue: **M1.4 — Forgot/reset password + deep links** o **M1.5 — Splash animado + tabs base**.
