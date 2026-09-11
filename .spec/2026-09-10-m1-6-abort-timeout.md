# Spec: M1.6-abort-timeout — AbortSignal compatible con timeout global + distinción cancel vs timeout

**Status**: APPROVED (auto-aprobado)
**Spec ID**: 2026-09-10-m1-6-abort-timeout
**Author**: Agente principal (Architect)
**Date**: 2026-09-10
**Banda**: Tier 3 — antes de F2
**Issue auditada que resuelve**: #55 (MEDIA-ALTA)

---

## Contexto

Issue #55 de la auditoría: en `src/core/api/client.ts:76-77` el código desactiva el timeout global si el caller pasa un `AbortSignal`:

```ts
// Línea 76 — BUG
const controller = signal ? null : new AbortController();
const timeoutId = controller ? setTimeout(() => controller.abort(), getApiTimeoutMs()) : null;
// Línea 89
signal: signal ?? controller?.signal,
```

Cuando TanStack Query (F2+) pasa su propio signal (built-in AbortController interno), el timeout global desaparece. Si una query tarda más de 15s (dev) o 30s (prod), queda colgada.

Adicionalmente, línea 103 mapea cualquier `AbortError` (incluyendo user-cancel y query-cancel) a `HttpError(0, 'Timeout', 'Request timeout')`. La downstream `toAuthError` mapea status 0 → `NETWORK_ERROR`. Una cancelación manual del usuario aparece como "Sin conexión. Verifica tu internet." — UX confuso.

## Problema

Sin este PR:
- F2+ agrega primer `useQuery` → signal se pasa automáticamente → timeout global desaparece → queries lentas cuelgan 60+ segundos.
- Usuario cancela manualmente un fetch largo (ej. en retry) → ve "Sin conexión" en lugar de "Cancelado".
- No hay manera de distinguir los 3 orígenes de AbortError (timeout interno, query cancel de TanStack, user cancel externo).

## Objetivo

1. **Timeout global SIEMPRE activo**, independiente de si el caller pasa signal.
2. **Si caller pasa signal + ocurre abort externo** → request aborta con distinción "canceled" (no "timeout").
3. **Si ocurre abort por timeout interno** → request aborta con distinción "timeout".
4. **HttpError distingue cancel vs timeout** vía flag `cause: 'timeout' | 'canceled' | 'network'`.
5. **TanStack Query** (cuando llegue F2) puede pasar su signal y seguirá respetando el timeout global.

## Fuera de alcance

- Modificar backend Laravel.
- Reescribir el wrapper a `axios` o similar — sigue siendo `fetch` + `AbortController`.
- Wirear `httpClient` a TanStack Query — eso es F2.
- Implementar retry policy — fuera del MVP.
- Modificar SecureStore o auth-store.

## Arquitectura afectada

### Crear
- `src/core/api/__tests__/abort-signal-timeout.spec.ts` — tests del nuevo comportamiento (≥10 tests).
- `src/core/api/__tests__/error-cause.spec.ts` — tests del campo `cause` en `HttpError` (≥6 tests).

### Modificar

- `src/core/api/client.ts`:
  - `HttpError` añade campo `cause?: 'timeout' | 'canceled' | 'unknown'` (opcional).
  - `request()`:
    ```ts
    const internalController = new AbortController();
    const timeoutId = setTimeout(() => {
      internalController.abort(new Error('timeout'));
    }, getApiTimeoutMs());
    
    if (signal) {
      signal.addEventListener('abort', () => internalController.abort(new Error('canceled')));
    }
    
    try {
      const response = await fetch(url, { ..., signal: internalController.signal });
      // ...
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof HttpError) throw err;
      if (err instanceof Error) {
        if (err.message === 'timeout') {
          throw new HttpError(0, 'Timeout', null, 'Request timeout', 'timeout');
        }
        if (err.message === 'canceled') {
          throw new HttpError(0, 'Canceled', null, 'Request canceled', 'canceled');
        }
        if (err.name === 'AbortError') {
          throw new HttpError(0, 'Canceled', null, 'Request canceled', 'canceled');
        }
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
    ```
- `src/core/services/auth-service.ts`:
  - `toAuthError` distingue status 0 + `cause === 'timeout'` → mapear a `NETWORK_ERROR` (mantener UX actual).
  - `toAuthError` distingue status 0 + `cause === 'canceled'` → lanzar `AuthError('CANCELED', 'La solicitud fue cancelada', 0)`. NO es error duro — el caller (TanStack Query) lo descarta silenciosamente.
  - Añadir `'CANCELED'` a `AuthErrorCode` enum.
- `src/core/models/auth.ts`:
  - Añadir `'CANCELED'` al `AuthErrorCode` type.
  - `AuthError.cause?: string` opcional para preservar info.
- `src/core/i18n/errors.ts`:
  - Añadir mensaje es-MX para `CANCELED`: `'Operación cancelada.'`.
- Tests actualizados:
  - `src/core/api/__tests__/client.spec.ts` — añadir tests del nuevo path de AbortSignal.
  - `src/core/services/__tests__/auth-service.spec.ts` — añadir test de `CANCELED` mapping.
  - `src/core/i18n/__tests__/errors.spec.ts` — añadir test del mensaje CANCELED.
  - `src/core/models/__tests__/auth.spec.ts` — añadir test de `AuthErrorCode` includes `CANCELED`.

### No tocar
- `package.json` (no deps nuevas).
- `secure-storage-service.ts`, `auth-store.ts`, `navigation/guards.ts`.
- `tanstack` integration — F2.
- Backend Laravel.

## Contratos

### HttpError shape

```ts
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown,
    message: string,
    public readonly cause?: 'timeout' | 'canceled' | 'unknown',
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
```

### Abort behavior matrix

| Scenario | `signal` interno | Result | `cause` |
|---|---|---|---|
| Request completes normally | timeout cleared | 200/4xx/5xx | n/a |
| Timeout fires | timeout fires, internal aborts | HttpError(0, 'Timeout') | `'timeout'` |
| Caller signal aborts (user cancel / query cancel) | external listener fires internal abort | HttpError(0, 'Canceled') | `'canceled'` |
| Caller signal + timeout races | first one wins | whichever fired first | depends |
| Caller signal already aborted | internal aborts immediately on listener | HttpError(0, 'Canceled') | `'canceled'` |

### AuthError mapping

```ts
// toAuthError additions
if (err.status === 0) {
  if (err.cause === 'canceled') return new AuthError('CANCELED', 'Operación cancelada', 0);
  return new AuthError('NETWORK_ERROR', 'No se pudo conectar con el servidor', 0);
}
```

### AuthErrorCode enum

```ts
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'CANCELED'       // NEW
  | 'UNKNOWN';
```

## Acceptance Criteria (BDD)

### AC1: Caller signal NO desactiva timeout global

```gherkin
Scenario: Signal pasado pero timeout sigue activo
  Given httpClient con timeout 100ms
  And caller pasa un signal (fake, never aborts)
  And fetch mockeado para tardar 200ms sin responder
  When httpClient.get(/test)
  Then la promesa rechaza en ~100ms con HttpError(0, 'Timeout', ..., 'timeout')
  And NO se queda esperando 200ms
```

### AC2: Caller signal abort → "canceled"

```gherkin
Scenario: Caller aborts manually
  Given httpClient con timeout 5s
  And caller pasa un signal
  And fetch mockeado para tardar 10s
  When caller llama signal.abort()
  Then la promesa rechaza con HttpError(0, 'Canceled', ..., 'canceled')
  And NO se queda esperando 5s del timeout
```

### AC3: Timeout distingue de cancel

```gherkin
Scenario: Timeout fires (no caller abort)
  Given httpClient con timeout 50ms
  And NO caller signal
  And fetch mockeado para tardar 200ms
  When httpClient.get(/test)
  Then la promesa rechaza con HttpError(0, 'Timeout', ..., 'timeout')
  And el campo cause === 'timeout'
```

### AC4: Caller signal + timeout race — first wins

```gherkin
Scenario: Race
  Given httpClient con timeout 50ms
  And caller pasa signal
  And fetch mockeado para tardar 200ms
  And caller llama signal.abort() en 10ms (antes del timeout)
  When httpClient.get(/test)
  Then la promesa rechaza con HttpError(0, 'Canceled', ..., 'canceled')
  And el timeout NO disparó después (cause === 'canceled', no 'timeout')
```

### AC5: HttpError tiene campo cause

```gherkin
Scenario: HttpError shape
  Then new HttpError(0, 'X', null, 'msg') tiene cause === undefined
  And new HttpError(0, 'X', null, 'msg', 'timeout') tiene cause === 'timeout'
  And new HttpError(0, 'X', null, 'msg', 'canceled') tiene cause === 'canceled'
```

### AC6: toAuthError mapea canceled → AuthError(CANCELED)

```gherkin
Scenario: User cancel mapea a CANCELED
  Given HttpError(0, 'Canceled', null, 'msg', 'canceled')
  When toAuthError(err)
  Then retorna AuthError('CANCELED', 'Operación cancelada', 0)
```

### AC7: toAuthError mapea timeout → NETWORK_ERROR

```gherkin
Scenario: Timeout mapea a NETWORK_ERROR
  Given HttpError(0, 'Timeout', null, 'msg', 'timeout')
  When toAuthError(err)
  Then retorna AuthError('NETWORK_ERROR', 'No se pudo conectar con el servidor', 0)
```

### AC8: AuthErrorCode incluye CANCELED

```gherkin
Scenario: Enum actualizado
  Then AuthErrorCode incluye 'CANCELED'
  And formatAuthError(AuthError('CANCELED', ...)) === 'Operación cancelada.'
```

### AC9: formatAuthError localiza CANCELED

```gherkin
Scenario: Mensaje es-MX
  Given AuthError('CANCELED', 'Operación cancelada', 0)
  When formatAuthError(err)
  Then retorna 'Operación cancelada.'
```

### AC10: Caller signal ya abortado al inicio → canceled inmediato

```gherkin
Scenario: Pre-aborted signal
  Given caller pasa AbortSignal que ya está aborted
  When httpClient.get(/test)
  Then la promesa rechaza con HttpError(0, 'Canceled', ..., 'canceled')
  And NO se hizo fetch
```

## Definition of Done

- [ ] Spec escrita.
- [ ] TDD Red: 2 archivos nuevos (`abort-signal-timeout.spec.ts`, `error-cause.spec.ts`) + augmentations en 4 archivos existentes.
- [ ] TDD Green: pasa todos los tests nuevos sin romper los 214 existentes.
- [ ] Refactor: sin hex literales.
- [ ] Verificación low-I/O:
  - `pnpm typecheck` exit 0
  - `pnpm lint` exit 0
  - Cada `pnpm test <archivo>` exit 0
- [ ] STATE.md, TASKS.md, spec DONE; commit docs a `developer`.
- [ ] PR contra `developer`, NO merge.

## Riesgos y pendientes

- **AbortController listener cleanup:** si el request termina antes de timeout, el `signal.addEventListener('abort', ...)` queda colgado si caller no remueve el listener. Solución: en `finally`, remover el listener via `signal.removeEventListener`. Asegurar tests cubren esto.
- **Multiple abort signals chained:** si caller pasa un signal que ya tiene su propio listener attached, no debe romper el flujo. Test AC10 cubre el caso "ya aborted".
- **Tests con `setTimeout` real** pueden ser flaky. Usar `jest.useFakeTimers()` o `setTimeout(..., 0)` con delays suficientemente grandes para que timeout test no sea flaky.
- **#57 (.gitignore) sigue pendiente** — agendado para M1.7.
- **#56 (Montserrat) sigue pendiente** — agendado para M1.8.

## Handover

Al cerrar este spec:
- ~16 tests nuevos / actualizados.
- Total tests estimado: 214 → **~230**.
- Timeout global robusto + distinción cancel/timeout.
- Próximo issue: **M1.7-gitignore (#57)**.
