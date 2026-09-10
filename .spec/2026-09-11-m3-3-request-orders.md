# Spec: M3.3-request-orders — Idempotencia y guest checkout (#19)

**Status**: APPROVED · **Spec ID**: 2026-09-11-m3-3-request-orders
**Issue**: #19 · **Branch**: `feat/f3` · **Depends**: M3.2

---

## Objetivo

Crear pedidos con `POST /checkout/request-orders` garantizando **idempotencia** (sin duplicados por reintento/timeout) y soportando **auth y guest**.

## Contratos

`POST /checkout/request-orders` (auth **opcional**; `guest` permitido)
- Header `Idempotency-Key` opcional, regex `^[A-Za-z0-9._:-]{8,100}$`.
- Body: `{ segment:'basicos', items:[{variant_id,quantity}], customer_name, customer_email, customer_phone?, coupon_code?, shipping_address:{street,city,state,zip,neighborhood?}, house_payment_method?, source_id?, device_session_id? }`.
- `201` → `{ message, purchase_number, access_token, idempotent_replay?, orders:[{order_number, supplier_id, status, payment_status, payment_mode?, payment_method?, payment_instructions?, total}], house_payment? }`.
- Errores: `422` validación / key inválida; `409` key reusada con otro carrito; `429` throttle; `5xx/timeout`.

## Idempotencia (regla)

- Un `Idempotency-Key` **estable por intento lógico** de checkout: se genera al entrar a la pantalla de revisión (o al primer submit) y **se reutiliza en todos los reintentos** hasta obtener respuesta terminal.
- Se regenera **solo** si cambia el contenido del carrito (fingerprint local: items ordenados + email + cupón + house_payment_method) o tras éxito.
- Helper local `generateIdempotencyKey()` (sin dependencia): string estable `[A-Za-z0-9._:-]{8,100}` (p. ej. `ck_<epoch>_<rand36>`), longitud ≤100.
- Reintento por timeout usa la **misma** key → backend responde `idempotent_replay:true` sin duplicar.

## Auth vs guest

- Auth: usa el flujo normal (bearer). Guarda `purchase_number` + `orders` en el store.
- Guest (sin token): mismo endpoint; guarda `access_token` para consulta/claim posterior. No requiere login para continuar.

## Arquitectura

- `checkout-service.ts`: `requestOrders(payload, idempotencyKey?)` (headers condicional).
- `checkout-store.ts`: `idempotencyKey`, `ensureIdempotencyKey(fingerprint)`, `submit()`, `submission { status, error, result }`, `reset`.
- UI `src/app/checkout/review.tsx` (resumen + datos cliente + cupón + botón "Solicitar pedidos") → éxito → `src/app/checkout/confirmation.tsx`.
- Manejo de errores: `422` → mensaje de validación; `409` → "key reusada" (regenerar + avisar); `429` → "espera e intenta de nuevo"; `5xx/timeout` → reintentar con la **misma** key.

## Seguridad

- No loggear payloads con datos personales ni tokens. Autoridad servidor en totales.

## Escenarios BDD

- **AC1**: primer submit → `Idempotency-Key` presente y `requestOrders` llamado una vez; guarda `purchase_number`/`orders`.
- **AC2**: dos submits seguidos con el mismo carrito → **misma** key (no se regenera).
- **AC3**: timeout → reintento con la **misma** key (el store no genera otra).
- **AC4**: cambio de carrito/email/cupón → **nueva** key.
- **AC5**: guest sin token → submit exitoso guarda `access_token`.
- **AC6**: `422`/`409`/`429`/`5xx` → estado de error con acción de recuperación segura (sin crear pedido local).

## Definition of Done

- [ ] service `requestOrders` + store idempotencia/submit + UI review/confirmation + tests (AC1–AC6).
- [ ] `ensureIdempotencyKey` reutiliza en reintentos (test explícito).
- [ ] `pnpm typecheck`/`lint` exit 0. Sin deps nuevas.
