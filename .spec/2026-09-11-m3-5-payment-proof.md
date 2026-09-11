# Spec: M3.5-payment-proof — Comprobante de pago (#21)

**Status**: APPROVED · **Spec ID**: 2026-09-11-m3-5-payment-proof
**Issue**: #21 · **Branch**: `feat/f3` · **Depends**: M3.4

---

## Objetivo

Permitir subir el comprobante de pago (imagen/PDF) de pedidos `supplier_manual` en estado `pending`/`rejected`.

## Contratos

`POST /checkout/orders/{orderNumber}/payment-proof` — **multipart/form-data**
- Campos: `email` (requerido), `proof` (requerido; `jpg|jpeg|png|pdf|webp`, ≤8 MB).
- `→ { message, payment_status, payment_proof_url? }`.
- `422`: pedido no acepta comprobante (estado ≠ pending/rejected) o método ≠ `supplier_*`.

## Arquitectura

- `checkout-service.ts`: `uploadPaymentProof(orderNumber, email, file)` con `FormData` (`email`, `proof` con `{ uri, name, type }`). El `httpClient` debe enviar FormData **sin** `Content-Type` manual (deja que RN fije el boundary) y sin `JSON.stringify`.
- `checkout-store.ts`: `proof { status, error, url }`, `submitProof(orderNumber, email, asset)`, validación previa (tipo/tamaño) y feedback.
- UI `src/app/checkout/payment-proof.tsx`: selector de archivo con `expo-document-picker` (`type:['image/*','application/pdf']`), preview nombre/tamaño, validación ≤8 MB y tipos permitidos, submit, éxito/error; tras éxito refresca estado (`proof_submitted`).

## Dependencia justificada

- `expo-document-picker@~57.0.1`: único built-in Expo que permite elegir imagen **o** PDF nativo (el backend acepta ambos); evita `expo-image-picker` (solo imagen) + otra dep para PDF. Autorizado por el usuario.

## Seguridad

- Disco privado en backend; el archivo no es público. No loggear contenido; no persistir el archivo en storage.
- Validar tipo/MIME y tamaño en cliente (UX) — el backend sigue siendo autoridad.

## Escenarios BDD

- **AC1**: `pickDocument` devuelve asset → validación OK → `uploadPaymentProof` con FormData `email` + `proof`.
- **AC2**: archivo >8 MB o tipo no permitido → error inline, sin llamar al service.
- **AC3**: éxito → `proof.status='success'` + `url`, refresca instrucciones (`proof_submitted`).
- **AC4**: `422` → mensaje del backend, estado de error, permite reintentar.
- **AC5**: cancelar el picker → no-op sin error.

## Definition of Done

- [ ] service multipart + store + UI + tests (AC1–AC5).
- [ ] `expo-document-picker` justificado y usado.
- [ ] `pnpm typecheck`/`lint` exit 0.
