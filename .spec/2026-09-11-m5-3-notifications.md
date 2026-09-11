# Spec: M5.3-notifications — Notificaciones in-app (#28)

**Status**: APPROVED · **Spec ID**: 2026-09-11-m5-3-notifications
**Issue**: #28 · **Branch**: `feat/f5` · **Depends**: F1

---

## Objetivo

Lista de notificaciones in-app, marcar individual y read-all. **Push remoto fuera del MVP.**

## Contratos (auth:sanctum)

- `GET /notifications` → `{ data:[{id,type,title,body,link,read,createdAt}], unread_count }` (máx 30, backfill de "Pedido confirmado").
- `PATCH /notifications/{notification}` → `{ message }` (403 si no es del usuario).
- `POST /notifications/read-all` → `{ message }`.

## Arquitectura

- `src/core/models/notification.model.ts`: `AppNotification`, `NotificationsResponse` (+ toCamel).
- `src/core/services/notification-service.ts`: `getNotifications()`, `markRead(id)`, `markAllRead()`.
- `src/stores/notification-store.ts`: `notifications`, `unreadCount`, `status`, `fetchNotifications`, `markRead` (optimista + rollback), `markAllRead` (optimista + rollback).
- UI: `src/app/notifications.tsx` (lista, no leída resaltada, tocar → marca leída + navega `link` si aplica, botón "Marcar todas"); badge con `unreadCount` en el tab de cuenta o acceso desde account. Registrar ruta.

## Seguridad

- Auth; PATCH solo del propio usuario (403 se muestra como error, no éxito). No loggear `body`.
- **Push remoto explícitamente fuera del MVP** (no agregar deps de push).

## Escenarios BDD

- **AC1**: `getNotifications()` llama `GET /notifications`; store guarda `data` + `unreadCount`.
- **AC2**: marca individual → `PATCH /notifications/{id}` y `read=true` local (optimista).
- **AC3**: read-all → `POST /notifications/read-all`, `unreadCount=0` y todas `read=true`.
- **AC4**: fallo al marcar → rollback de `read`/`unreadCount` + estado error.
- **AC5**: lista vacía → EmptyState; error → ErrorState retry.
- **AC6**: tocar notificación con `link` navega; sin `link` solo marca leída.

## Definition of Done

- [ ] model + service + store + UI + tests (AC1–AC6).
- [ ] Sin deps de push. `pnpm typecheck`/`lint` exit 0.
