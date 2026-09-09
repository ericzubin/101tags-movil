# GitHub Issues — 101tags mobile

Este archivo enlaza los IDs estables de `TASKS.md` con sus GitHub Issues. Las **36 tareas técnicas del MVP** son #1–#36. Los Issues #37–#38 son administrativos y no forman parte de las 135 h del backlog.

## F0 — Foundation
- M0.1 → #1 — Auditar contratos backend/storefront
- M0.2 → #2 — Cerrar y aprobar spec del scaffold
- M0.3 → #3 — Validar versiones y requisitos de tiendas
- M0.4 → #4 — Generar workspace Ionic/Angular/Capacitor
- M0.5 → #5 — Configurar theme, Tailwind, environments y proxy
- M0.6 → #6 — Baseline de calidad y estructura core

## F1 — Auth y navegación
- M1.1 → #7 — Secure storage y modelos de Auth
- M1.2 → #8 — Auth service, interceptor y restauración de sesión
- M1.3 → #9 — Login y registro
- M1.4 → #10 — Forgot/reset password y deep links
- M1.5 → #11 — Splash, guards, tabs y navegación base

## F2 — Catálogo
- M2.1 → #12 — Home: hero, banners, categorías y destacados
- M2.2 → #13 — Árbol de categorías
- M2.3 → #14 — Product list, paginación y FilterSheet
- M2.4 → #15 — Product detail, galería, variantes y stock
- M2.5 → #16 — UX transversal del catálogo

## F3 — Carrito, checkout y pagos
- M3.1 → #17 — Cart service, sync API y badge
- M3.2 → #18 — Checkout config, dirección y envío
- M3.3 → #19 — Request orders, idempotencia y guest checkout
- M3.4 → #20 — Pago pendiente OXXO/SPEI
- M3.5 → #21 — Subir comprobante de pago
- M3.6 → #22 — OpenPay tarjeta condicionado por config

## F4 — Post-compra
- M4.1 → #23 — Mis pedidos, detalle y tracking
- M4.2 → #24 — Cancelaciones y devoluciones
- M4.3 → #25 — Calificación de proveedor

## F5 — Chat y notificaciones
- M5.1 → #26 — Conversaciones y chat con polling
- M5.2 → #27 — Adjuntos del chat
- M5.3 → #28 — Notificaciones in-app

## F6 — Cuenta y contenido
- M6.1 → #29 — Perfil, settings y logout
- M6.2 → #30 — Cupones wallet y validación
- M6.3 → #31 — Términos, privacidad y ayuda

## F7 — Nativo, QA y release
- M7.1 → #32 — Plugins nativos y privacidad
- M7.2 → #33 — Android signing, deep links y QA dispositivo
- M7.3 → #34 — iOS signing, deep links y QA dispositivo
- M7.4 → #35 — Regresión E2E, red y accesibilidad
- M7.5 → #36 — Release checklist y paquete para tiendas

## Issues administrativos
- #37 — Mantener sincronización Repo ↔ Issues ↔ Notion
- #38 — Configurar GitHub Project/Milestones cuando el conector lo permita

## Regla de sincronización
1. `PLAN.md` define alcance/arquitectura.
2. `DISCOVERY.md` conserva hallazgos y decisiones.
3. `TASKS.md` define backlog, IDs, dependencias y aceptación.
4. `ISSUES.md` mapea esos IDs a GitHub Issues.
5. `.spec/*.md` define el contrato ejecutable de cada tarea.
6. `STATE.md` conserva estado real y relevo.
7. Notion refleja los mismos IDs `[101M]` para seguimiento.

Si hay discrepancia, actualizar primero la fuente técnica del repo y después sincronizar Issue + Notion.
