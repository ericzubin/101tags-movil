# Spec: M3.4-payment-instructions — OXXO y SPEI (#20)

**Status**: APPROVED · **Spec ID**: 2026-09-11-m3-4-payment-instructions
**Issue**: #20 · **Branch**: `feat/f3` · **Depends**: M3.3

---

## Objetivo

Mostrar instrucciones de pago **OXXO** y **SPEI** del pedido (`supplier_manual`), con vencimiento y copiado.

## Contratos

- El `request-orders` ya trae `orders[].payment_instructions` y `house_payment.payment_instructions`.
- `GET /checkout/payment-instructions/{orderNumber}?email=` → `{ order_number, payment_status, payment_method, total, payment_due_at, payment_instructions, payment_proof_url?, payment_proof_submitted_at?, payment_rejection_reason?, demo_mode }`.
- `PaymentInstructions`: `{ type, method, reference?, barcode_url?, paybin_reference?, clabe?, bank?, agreement?, recipient_name?, account_holder?, supplier_name?, oxxo_reference?, instructions?, due_at?, amount?, demo? }`.

## Arquitectura

- `checkout-service.ts`: `getPaymentInstructions(orderNumber, email)`.
- `checkout-store.ts`: `paymentInstructions`, `fetchPaymentInstructions()`, `copyToClipboard(label, value)` (usa `expo-clipboard`; no-op + feedback en web si no disponible).
- UI `src/app/checkout/payment-instructions.tsx`:
  - **OXXO**: referencia (`reference`/`oxxo_reference`), `barcode_url` (si existe), monto, vencimiento (`due_at`/`due_hours`), botón copiar.
  - **SPEI**: `clabe`, `bank`, `recipient_name`/`account_holder`, monto, vencimiento, botón copiar.
  - **Vencido/expirado** (`payment_status` o `due_at` pasado): estado claro + no ofrece comprobante.
  - CTA "Ya pagué / Enviar comprobante" → #21.

## Seguridad

- No loggear CLABE/referencias completas (redactar en logs). No persistir en storage.

## Escenarios BDD

- **AC1**: `fetchPaymentInstructions(orderNumber, email)` puebla el store.
- **AC2**: OXXO renderiza referencia + barcode + monto + vencimiento.
- **AC3**: SPEI renderiza CLABE + banco + titular + monto + vencimiento.
- **AC4**: copiar usa `expo-clipboard` con el valor correcto y muestra confirmación.
- **AC5**: pedido con `payment_status` expirado/pagado → estado correspondiente sin CTA de comprobante.
- **AC6**: error de red → ErrorState con retry.

## Definition of Done

- [ ] service + store + UI + tests (AC1–AC6).
- [ ] `expo-clipboard` justificado (copiar referencia/CLABE) y usado con fallback web.
- [ ] `pnpm typecheck`/`lint` exit 0.
