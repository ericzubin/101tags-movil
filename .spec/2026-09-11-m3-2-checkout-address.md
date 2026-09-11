# Spec: M3.2-checkout-address — Checkout config, dirección y envío (#18)

**Status**: APPROVED · **Spec ID**: 2026-09-11-m3-2-checkout-address
**Issue**: #18 · **Branch**: `feat/f3` (base `fix/m2-review-p1`) · **Depends**: M3.1

---

## Objetivo

Consultar `/checkout/config` antes de ofrecer métodos; capturar dirección válida (con autocompletado por CP) y mostrar resumen con precios/cantidades **del servidor**.

## Fuera de alcance

- request-orders (#19), OXXO/SPEI (#20), comprobante (#21), OpenPay (#22).

## Contratos

- `GET /checkout/config` → `CheckoutConfig` (snake): `payment_mode`, `payment_methods{card,oxxo,spei}`, `house_payment_available`, `house_supplier_ids[]`, `house_payment_methods{...}`, `oxxo_due_hours`, `spei_due_hours`, `demo_mode`, `manual_payment_disclaimer`, `openpay_*`.
- `GET /policies` → `{ manual_payment_disclaimer, mediation_window_hours, whatsapp_enabled }`.
- `GET /postal-codes/{cp}` → `{ data: { postal_code, state, state_code, municipality, city, settlements:[{name,type}] } }`; 404 → `{ message }`.
- `POST /coupons/validate` → `{ valid, message, coupon?, discount_amount, shipping_discount, eligible_subtotal }`; request `{ code, segment:'basicos', shipping_cost, customer_email?, items:[{variant_id,quantity}] }`.
- No-autoridad: totales se derivan del carrito del servidor (`cartStore` tras `fetchCart`); el cliente **no** recalcula precios de línea.

## Arquitectura

- `src/core/models/checkout.model.ts`: `CheckoutConfig`, `PaymentMethod`, `PaymentInstructions`, `ShippingAddress`, `PostalCodeLookup`, `CouponValidation` (+ `toCamel`).
- `src/core/services/checkout-service.ts`: `getConfig()`, `getPolicies()`, `lookupPostalCode(cp)`, `validateCoupon(payload)`.
- `src/stores/checkout-store.ts` (Zustand): `config`, `policies`, `address`, `setAddressField`, `setAddress`, `validate()`, `coupon`, `applyCoupon`, `clearCoupon`, `status`, `error`, `reset`.
- UI `src/app/checkout/address.tsx` (form + resumen) y botón "Continuar" en `(tabs)/cart.tsx` → `router.push('/checkout/address')`. Pantalla bloqueada si carrito vacío.

### Validación de dirección

Requeridos: `street`, `city`, `state`, `zip` (5 dígitos MX); `neighborhood` opcional. Al ingresar CP de 5 dígitos → `lookupPostalCode`; si resuelve, autocompleta `state`/`city`/`municipality` y ofrece `settlements` para `neighborhood`. CP no encontrado → error inline, permite captura manual.

## Seguridad

- Sin tokens/logs. Precios/stock autoridad servidor. No persistir dirección en storage.

## Escenarios BDD

- **AC1**: al montar, `getCheckoutConfig()` se llama y la UI habilita solo métodos permitidos (`payment_methods`).
- **AC2**: `validate()` marca errores en campos requeridos y CP inválido; no avanza.
- **AC3**: CP `06600` → `lookupPostalCode` autocompleta estado/ciudad y lista colonias.
- **AC4**: `validateCoupon` con items del carrito y `shipping_cost` del config; aplica `discountAmount`/`shippingDiscount`; inválido → mensaje, sin romper.
- **AC5**: resumen muestra cantidad/precio/subtotal/total usando `cartStore` (servidor), no recálculo local.
- **AC6**: carrito vacío → pantalla no ofrece continuar (redirect/empty).

## Definition of Done

- [ ] model + service + store + UI + tests (AC1–AC6).
- [ ] `(tabs)/cart.tsx` "Continuar" wired (regresión de `cart.spec`).
- [ ] `pnpm typecheck`/`lint` exit 0.
- [ ] Sin tocar backend, `.spec/`, STATE/TASKS/DISCOVERY.
