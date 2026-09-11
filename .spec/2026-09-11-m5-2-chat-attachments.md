# Spec: M5.2-chat-attachments — Adjuntos del chat (#27)

**Status**: APPROVED · **Spec ID**: 2026-09-11-m5-2-chat-attachments
**Issue**: #27 · **Branch**: `feat/f5` · **Depends**: M5.1

---

## Objetivo

Enviar y abrir adjuntos del chat (imagen/PDF) respetando tipos/tamaños, y tratar `proof_of_payment` según contrato.

## Contratos (auth:sanctum)

`POST /orders/{orderNumber}/messages/attachments` — **multipart**
- `attachment` (req; `jpg|jpeg|png|webp|pdf`, ≤8192 KB), `type?` (`proof_of_payment`), `body?` (≤2000).
- `201` → `{ message, data:{ id, type, body, attachment:{ id, original_name, mime_type, size, download_url }, created_at } }`.
- `422` si `type=proof_of_payment` y el pedido no es `supplier_*` manual.

Abrir adjunto: `download_url` es **signed URL (10 min)** (también en `messages[].attachments[]`). Abrir con `Linking.openURL`.

## Arquitectura

- `chat.model.ts`: `ChatAttachment` (id, originalName, mimeType, size, downloadUrl).
- `chat-service.ts`: `sendAttachment(orderNumber, asset, { type?, body? })` con `FormData` (`attachment`, `type`, `body`), **sin** `Content-Type` manual ni `JSON.stringify`.
- `chat` store/hook: `sendAttachment` con estado `sending|sent|error`, anti-doble-submit; validación cliente (tipo/≤8MB) previa.
- UI en `chat/[orderNumber].tsx`: botón adjuntar (`expo-document-picker`), opción "Enviar comprobante de pago" (`type=proof_of_payment`, solo si `paymentMethod` es `supplier_*` y `paymentStatus` pending/rejected), preview, y tocar un adjunto → `Linking.openURL(downloadUrl)`.
- `proof_of_payment` NO duplica lógica insegura: solo envía el tipo; el backend actualiza `payment_status`.

## Seguridad

- Solo URLs firmadas del backend; no construir rutas propias. Validar tipo/tamaño en cliente (UX); backend autoridad.

## Escenarios BDD

- **AC1**: elegir archivo válido → `sendAttachment` con FormData `attachment` (+`type`/`body` opcionales).
- **AC2**: tipo no permitido o >8MB → error inline, sin request.
- **AC3**: `type=proof_of_payment` aparece solo en pedidos `supplier_*`; en otros no se ofrece.
- **AC4**: éxito → mensaje con adjunto (nombre/tamaño) en la conversación.
- **AC5**: tocar adjunto → `Linking.openURL(downloadUrl)`.
- **AC6**: 422/otros → estado de error con mensaje; reintentar sin dobles envíos (botón deshabilitado durante `sending`).

## Definition of Done

- [ ] model + service + store/UI + tests (AC1–AC6).
- [ ] `expo-document-picker` reutilizado (ya instalado). `pnpm typecheck`/`lint` exit 0.
