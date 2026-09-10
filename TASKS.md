# TASKS — Backlog detallado de 101tags mobile

**Estado del proyecto:** planificación lista; implementación aún no iniciada.

Este archivo convierte `PLAN.md` en trabajo ejecutable. Es la fuente de verdad del **backlog técnico**. Cada tarea real debe tener su propia spec en `.spec/` y seguir el flujo definido en `AGENTS.md` y `.agent/WORKFLOW.md`.

## Jerarquía de documentación

1. `AGENTS.md` — reglas obligatorias para agentes y seguridad.
2. `.agent/WORKFLOW.md` — proceso DISCOVERY → SDD → BDD → TDD RED → GREEN → REFACTOR → VERIFICATION.
3. `PLAN.md` — alcance, arquitectura, pantallas, contratos y fases.
4. `TASKS.md` — backlog detallado, dependencias, estimaciones y criterios.
5. `.spec/*.md` — contrato ejecutable por tarea.
6. `STATE.md` — estado actual y relevo entre agentes.

## Convenciones del backlog

- Los IDs son estables: `M0.1`, `M1.1`, etc.
- Una tarea se marca `DONE` únicamente cuando cumple la Definition of Done de `.agent/WORKFLOW.md`.
- Las estimaciones son **horas de ingeniería orientativas**, incluyendo documentación/test/verification razonable para la tarea, no tiempos garantizados.
- No se asignan fechas límite sin una fecha real acordada.
- No se modifica el backend Laravel salvo una spec separada y aprobación explícita.
- Si una tarea descubre que el contrato API cambió, se actualizan primero `PLAN.md`, la spec activa y `STATE.md`.
- Las tareas se reflejan en Notion con prefijo `[101M]` para evitar mezclarlas con otros proyectos.

## Resumen por fase

| Fase | Alcance | Horas base | Bloquea |
|---|---|---:|---|
| F0 | Discovery, decisiones, scaffold y calidad base | 16 h | Todo |
| F1 | Auth, sesión y navegación | 17 h | Checkout autenticado, cuenta |
| F2 | Home, catálogo y producto | 21 h | Carrito/checkout |
| F3 | Carrito, checkout y pagos | 27 h | Post-compra |
| F4 | Pedidos, cancelaciones, devoluciones y rating | 11 h | — |
| F5 | Chat y notificaciones | 11 h | — |
| F6 | Cuenta, cupones y páginas estáticas | 8 h | — |
| F7 | Integración nativa, QA y release | 24 h | Publicación |
| **Total base** | **MVP completo con flujo SDD/BDD/TDD/QA** | **135 h** | — |

> El cálculo original de `~7 días` de `PLAN.md` era una estimación de implementación muy compacta. El backlog detallado incluye discovery, specs, pruebas, verificación, dispositivos, signing y preparación de release; por eso el esfuerzo base es mayor. Debe recalibrarse con datos reales después de F0.

---

# F0 — Foundation, Discovery y scaffold

## M0.1 — Auditar contratos backend/storefront
**Prioridad:** 🔥 Alta · **Estimación:** 2 h · **Dependencias:** ninguna

**Objetivo**
- Confirmar en `101tags.com-` los endpoints, payloads, errores y tipos que consumirá el móvil.
- Usar `routes/api.php`, `storefront/src/api/client.ts` y tests backend como fuente de verdad.

**Aceptación**
- [ ] Auth, catálogo, carrito, checkout, pedidos, chat, cupones y notificaciones están mapeados.
- [ ] Se registran discrepancias entre `PLAN.md` y backend.
- [ ] No se pide un endpoint nuevo sin evidencia de que falte.

## M0.2 — Cerrar y aprobar spec del scaffold
**Prioridad:** 🔥 Alta · **Estimación:** 2 h · **Dependencias:** M0.1

**Objetivo**
- Completar `.spec/00-ionic-scaffold.md` y llevarla de `DRAFT` a `APPROVED` antes de generar código.

**Aceptación**
- [ ] Stack y versiones quedan explícitos.
- [ ] Package manager, test runner, lint, formatter y scripts quedan decididos.
- [ ] BDD del scaffold cubre build, tests, environments y ausencia de secretos.

## M0.3 — Validar matriz de versiones y requisitos de tiendas
**Prioridad:** 🔥 Alta · **Estimación:** 2 h · **Dependencias:** M0.1

**Objetivo**
- Validar que Ionic 7 + Angular 17 + Capacitor 6 siguen siendo una base viable para los SDK/targets vigentes de Android/iOS al momento de implementar.

**Aceptación**
- [ ] Se documenta compatibilidad de Node, Angular, Ionic, Capacitor, Xcode y Android SDK.
- [ ] Si se recomienda actualizar el stack, el cambio queda justificado en la spec y requiere aprobación.
- [ ] No se hace upgrade “por limpieza”.

## M0.4 — Generar workspace Ionic/Angular/Capacitor
**Prioridad:** 🔥 Alta · **Estimación:** 3 h · **Dependencias:** M0.2, M0.3

**Objetivo**
- Crear el scaffold real de la app y plataformas nativas según la spec aprobada.

**Aceptación**
- [ ] Angular standalone y routing funcionan.
- [ ] Android e iOS quedan agregados mediante Capacitor.
- [ ] `appId` y `appName` quedan definidos sin secretos.
- [ ] Instalación reproducible desde un checkout limpio.

## M0.5 — Nativewind theme tokens en componentes + environments ajustados (PIVOT)
**Prioridad:** 🔥 Alta · **Estimación:** 3 h · **Dependencias:** M0.4
**Status:** ✅ DONE (rama `chore/m0-5-pivot`) — ver `.spec/2026-09-09-m0-5-pivot-theme-nativewind-env.md`

**Objetivo**
- Aplicar branding 101tags con Nativewind v4 (Tailwind 3.4) y separar configuración dev/prod usando getters `getApiBaseUrl()` / `getApiTimeoutMs()`.

**Aceptación**
- [x] Colores, Montserrat y tokens están centralizados en `src/theme/tokens.ts` + `tailwind.config.js` + `src/global.css` con tests de sincronía.
- [x] Dev consume `/api` mediante `getApiBaseUrl()` (web → `http://localhost:8080/api`, native → `http://localhost:8000/api`).
- [x] Producción toma la URL desde `getApiBaseUrl()` cuando `EXPO_PUBLIC_ENV === 'production'` (`https://api.101tags.com/api`).
- [x] No hay URLs productivas hardcodeadas en componentes.
- [x] `pnpm validate` exit 0 + `pnpm exec expo prebuild --no-install --clean` exit 0 + 49/49 tests verdes.

## M0.6 — Establecer baseline de calidad y estructura core
**Prioridad:** 🔥 Alta · **Estimación:** 4 h · **Dependencias:** M0.4

**Objetivo**
- Crear scripts reales de test/lint/format/typecheck/build y la estructura `core/shared/pages/models`.

**Aceptación**
- [ ] `test`, `lint`, formatter/check, `tsc --noEmit` y build están definidos o N/A justificado.
- [ ] Existe al menos un test de humo válido.
- [ ] CI/local pueden ejecutar la misma verificación.
- [ ] `STATE.md` registra baseline real.

---

# F1 — Autenticación, sesión y navegación

## M1.1 — Secure storage y modelos de autenticación
**Prioridad:** 🔥 Alta · **Estimación:** 4 h · **Dependencias:** F0

**Objetivo**
- Elegir y abstraer almacenamiento de token respaldado por Keychain/Keystore en nativo.

**Aceptación**
- [ ] El token Sanctum no se guarda en texto plano mediante `@capacitor/preferences`.
- [ ] La solución elegida y su dependencia están justificadas en la spec de Auth.
- [ ] Datos no sensibles sí pueden usar Preferences.
- [ ] Logout elimina credenciales locales.

## M1.2 — Auth service, interceptor y restauración de sesión
**Prioridad:** 🔥 Alta · **Estimación:** 3 h · **Dependencias:** M1.1

**Aceptación**
- [ ] Bearer token se inyecta solo donde corresponde.
- [ ] `me` restaura sesión al iniciar.
- [ ] 401 invalida sesión y redirige de forma controlada.
- [ ] No se loggean tokens ni passwords.

## M1.3 — Login y registro
**Prioridad:** 🔥 Alta · **Estimación:** 4 h · **Dependencias:** M1.2

**Aceptación**
- [x] Formularios y validaciones replican contratos backend. — `validateLogin`/`validateRegister` (es-MX) en `src/core/validation/auth.ts` (15 tests).
- [x] Se manejan 401/422/429/5xx y error de red. — `formatAuthError` en `src/core/i18n/errors.ts` (8 tests) + mapping 429→RATE_LIMITED, 5xx→SERVER_ERROR en `auth-service.ts` (mínimo cambio documentado).
- [x] Loading evita doble submit. — `isSubmitting` + `disabled`/`accessibilityState.busy` en `login.tsx`/`register.tsx`.
- [x] Login válido entra al shell principal. — `router.replace('/(tabs)')` con happy path cubierta por `login.spec.tsx`/`register.spec.tsx` (10+7 tests).

**Entregable**: PR #TBD contra `developer` — rama `chore/m1-3-login-register-ux`. Spec: `.spec/2026-09-09-m1-3-login-register-ux.md`.

## M1.4 — Forgot/reset password + deep links
**Prioridad:** 🔥 Alta · **Estimación:** 3 h · **Dependencias:** M1.2

**Aceptación**
- [ ] Forgot password cubre respuesta segura incluso para emails inexistentes según backend.
- [ ] Reset procesa `token` + `email` desde deep link.
- [ ] Link inválido/expirado muestra estado recuperable.
- [ ] Existe fallback de entrada manual si la spec lo mantiene.

## M1.5 — Splash, guards, tabs y navegación base
**Prioridad:** 🔥 Alta · **Estimación:** 3 h · **Dependencias:** M1.2

**Aceptación**
- [ ] Splash decide sesión antes de mostrar rutas protegidas.
- [ ] `auth.guard` y `guest.guard` no generan loops.
- [ ] Tabs Inicio/Catálogo/Carrito/Cuenta funcionan con lazy loading.
- [ ] Back navigation Android/iOS se comporta de forma consistente.

---

# F2 — Home, catálogo y producto

## M2.1 — Home: hero, banners, categorías y destacados
**Prioridad:** 🔥 Alta · **Estimación:** 4 h · **Dependencias:** F1 navegación
**Status:** ✅ DONE (PR #71; issue #12) — ver `.spec/2026-09-11-m2-1-home.md`

**Aceptación**
- [x] Home consume contenido existente para segmento `basicos`.
- [x] Skeleton/loading/error/empty state definidos.
- [x] Banners y cards navegan al destino correcto.

## M2.2 — Árbol de categorías
**Prioridad:** 🔥 Alta · **Estimación:** 4 h · **Dependencias:** M2.1
**Status:** ✅ DONE (PR #74; issue #13) — ver `.spec/2026-09-11-m2-2-categories.md`

**Aceptación**
- [x] Categorías padre/hijo respetan `segment=basicos`.
- [x] Navegación conserva contexto y filtros aplicables.
- [x] Estados vacíos/no encontrados están cubiertos.

## M2.3 — Product list, paginación y FilterSheet
**Prioridad:** 🔥 Alta · **Estimación:** 5 h · **Dependencias:** M2.2
**Status:** ✅ DONE (PR #75; issue #14) — ver `.spec/2026-09-11-m2-3-list.md`

**Aceptación**
- [x] Lista paginada no duplica productos.
- [x] Filtros se serializan igual que el storefront/API.
- [x] Modal móvil permite aplicar/limpiar/cancelar.
- [x] Se evita disparar requests obsoletos al cambiar filtros rápidamente.

## M2.4 — Product detail, galería, variantes y stock
**Prioridad:** 🔥 Alta · **Estimación:** 6 h · **Dependencias:** M2.3
**Status:** ✅ DONE (PR #72; issue #15) — ver `.spec/2026-09-11-m2-4-detail.md`

**Aceptación**
- [x] Galería swipe y fallback de imagen.
- [x] Selección color/talla solo permite combinaciones válidas.
- [x] Sin stock deshabilita compra.
- [x] Cantidad se limita por stock disponible.
- [x] Agregar al carrito usa el `variant_id` correcto.

## M2.5 — UX transversal del catálogo
**Prioridad:** ⚡ Media · **Estimación:** 2 h · **Dependencias:** M2.1–M2.4
**Status:** ✅ DONE (PR #76; issue #16) — ver `.spec/2026-09-11-m2-5-ux.md`

**Aceptación**
- [x] Estados loading/error/offline/empty son coherentes.
- [x] Imágenes usan resolver centralizado de media URL.
- [x] Controles críticos tienen labels/roles accesibles.
- [x] No hay errores visibles de layout en tamaños móviles objetivo.

---

# F3 — Carrito, checkout y pagos

## M3.1 — Cart service, sync API y badge
**Prioridad:** 🔥 Alta · **Estimación:** 5 h · **Dependencias:** F2
**Status:** 🚧 IMPLEMENTADO en PR de fase F3 (abierto, sin merge) — ver `.spec/2026-09-11-m3-1-cart.md`

**Aceptación**
- [x] Signal de carrito refleja GET/PUT/DELETE reales.
- [x] Actualización optimista, si existe, revierte correctamente en error.
- [x] Badge se actualiza sin recargar tabs.
- [x] Cantidad inválida/stock insuficiente se maneja sin corrupción de estado.

## M3.2 — Checkout config, dirección y envío
**Prioridad:** 🔥 Alta · **Estimación:** 5 h · **Dependencias:** M3.1

**Aceptación**
- [ ] Se consulta `/checkout/config` antes de ofrecer métodos.
- [ ] Dirección valida campos requeridos y datos esperados por API.
- [ ] Resumen conserva precios/cantidades del servidor.
- [ ] No se confía en totales calculados solo por cliente.

## M3.3 — Request orders, idempotencia y guest checkout
**Prioridad:** 🔥 Alta · **Estimación:** 5 h · **Dependencias:** M3.2

**Aceptación**
- [ ] Cada intento lógico usa UUID estable en `Idempotency-Key`.
- [ ] Reintento por timeout no crea pedidos duplicados.
- [ ] Auth y guest siguen contratos distintos cuando aplique.
- [ ] 422/429/5xx presentan acción de recuperación segura.

## M3.4 — Pago pendiente OXXO/SPEI
**Prioridad:** 🔥 Alta · **Estimación:** 3 h · **Dependencias:** M3.3

**Aceptación**
- [ ] Se muestran instrucciones exactamente desde API.
- [ ] Barcode/CLABE/referencia se renderizan con copy action cuando aplique.
- [ ] Expiración/ausencia de instrucciones tiene estado explícito.

## M3.5 — Subir comprobante de pago
**Prioridad:** 🔥 Alta · **Estimación:** 4 h · **Dependencias:** M3.4

**Aceptación**
- [ ] Cámara/selector respetan tipos y tamaños aceptados por backend.
- [ ] Multipart usa endpoint correcto.
- [ ] Progress/loading y reintento no provocan dobles uploads involuntarios.
- [ ] Errores del archivo se muestran antes o después del request según corresponda.

## M3.6 — OpenPay tarjeta condicionado por config
**Prioridad:** 🔥 Alta · **Estimación:** 5 h · **Dependencias:** M3.2, M3.3

**Aceptación**
- [ ] UI tarjeta solo aparece cuando backend habilita OpenPay.
- [ ] Datos sensibles de tarjeta no pasan por storage/logs propios.
- [ ] Tokenización/device session sigue contrato existente.
- [ ] Si la integración web no es adecuada para WebView, la spec documenta alternativa antes de codificar.

---

# F4 — Post-compra

## M4.1 — Mis pedidos + detalle + tracking
**Prioridad:** 🔥 Alta · **Estimación:** 5 h · **Dependencias:** F3

**Aceptación**
- [ ] Lista paginada/ordenada según API.
- [ ] Detalle muestra items, total, estado y timeline.
- [ ] Carrier/tracking se muestra solo cuando existe.
- [ ] Pedido ajeno/no encontrado se maneja correctamente.

## M4.2 — Cancelaciones y devoluciones
**Prioridad:** 🔥 Alta · **Estimación:** 4 h · **Dependencias:** M4.1

**Aceptación**
- [ ] Acciones solo aparecen en estados permitidos.
- [ ] Solicitud valida motivo/datos requeridos.
- [ ] Listado de devoluciones refleja status backend.
- [ ] 403/409/422 no se presentan como éxito.

## M4.3 — Calificación de proveedor
**Prioridad:** ⚡ Media · **Estimación:** 2 h · **Dependencias:** M4.1

**Aceptación**
- [ ] Rating respeta rango y reglas backend.
- [ ] No permite doble submit accidental.
- [ ] Estado ya-calificado se representa correctamente.

---

# F5 — Chat y notificaciones

## M5.1 — Conversaciones y chat de orden con polling
**Prioridad:** 🔥 Alta · **Estimación:** 5 h · **Dependencias:** M4.1

**Aceptación**
- [ ] Lista/conversación usa contratos reales.
- [ ] Polling se inicia al entrar y se cancela al salir/destroy.
- [ ] No acumula timers ni requests en background.
- [ ] Mensajes mantienen orden y no se duplican.

## M5.2 — Adjuntos del chat
**Prioridad:** ⚡ Media · **Estimación:** 3 h · **Dependencias:** M5.1

**Aceptación**
- [ ] Multipart respeta tipos/tamaños backend.
- [ ] Adjuntos descargables usan acceso autorizado/signed URL cuando corresponda.
- [ ] `proof_of_payment` se trata según contrato sin duplicar lógica insegura.

## M5.3 — Notificaciones in-app
**Prioridad:** ⚡ Media · **Estimación:** 3 h · **Dependencias:** F1

**Aceptación**
- [ ] GET lista notificaciones.
- [ ] PATCH marca individual leída.
- [ ] POST read-all actualiza servidor y UI.
- [ ] Push remoto queda explícitamente fuera del MVP salvo nueva spec.

---

# F6 — Cuenta, cupones y contenido estático

## M6.1 — Perfil, settings y logout
**Prioridad:** ⚡ Media · **Estimación:** 3 h · **Dependencias:** F1

**Aceptación**
- [ ] Perfil usa `/auth/customer/me`.
- [ ] Logout invalida backend cuando aplique y limpia storage local.
- [ ] Settings no expone secretos ni datos técnicos innecesarios.

## M6.2 — Cupones wallet/validación
**Prioridad:** ⚡ Media · **Estimación:** 3 h · **Dependencias:** F3

**Aceptación**
- [ ] Cupones del usuario se listan con estado/validez.
- [ ] Validación usa endpoint real y contexto de checkout.
- [ ] Cupón inválido/expirado muestra razón utilizable cuando API la entregue.

## M6.3 — Términos, privacidad y ayuda
**Prioridad:** ⚡ Media · **Estimación:** 2 h · **Dependencias:** F0

**Aceptación**
- [ ] Rutas accesibles desde cuenta/checkout donde aplique.
- [ ] Contenido y enlaces no quedan hardcodeados si backend/config ya ofrece una fuente.
- [ ] Texto legal pendiente se marca como dependencia de negocio, no se inventa.

---

# F7 — Nativo, QA y release

## M7.1 — Configurar plugins nativos y privacidad
**Prioridad:** 🔥 Alta · **Estimación:** 4 h · **Dependencias:** F1–F6

**Aceptación**
- [ ] Camera/App/Share/StatusBar/SplashScreen y storage elegido están sincronizados.
- [ ] Permisos Android/iOS son mínimos y justificados.
- [ ] Privacy manifests/usage descriptions requeridos quedan presentes.
- [ ] No se solicitan permisos antes de necesitarlos.

## M7.2 — Android: signing, deep links y QA en dispositivo
**Prioridad:** 🔥 Alta · **Estimación:** 5 h · **Dependencias:** M7.1

**Aceptación**
- [ ] Build release reproducible.
- [ ] Keystore nunca se commitea.
- [ ] Deep link de reset funciona instalado.
- [ ] Flujos críticos pasan en al menos un dispositivo/emulador objetivo.

## M7.3 — iOS: signing, universal/deep links y QA en dispositivo
**Prioridad:** 🔥 Alta · **Estimación:** 5 h · **Dependencias:** M7.1

**Aceptación**
- [ ] Build/archive reproducible en Xcode.
- [ ] Certificados/profiles no se exponen en repo.
- [ ] Reset/deep link funciona instalado.
- [ ] Flujos críticos pasan en simulador y/o dispositivo según disponibilidad.

## M7.4 — Regresión E2E, red, accesibilidad y estados límite
**Prioridad:** 🔥 Alta · **Estimación:** 6 h · **Dependencias:** M7.2, M7.3

**Aceptación**
- [ ] Flujo login → catálogo → carrito → checkout → pedido es verificable.
- [ ] Guest checkout, OXXO/SPEI y comprobante cubiertos cuando config los habilita.
- [ ] 401/403/404/422/429/5xx y offline tienen comportamiento definido.
- [ ] No hay timers/listeners huérfanos al navegar.
- [ ] Smoke de accesibilidad: labels, foco, contraste y tamaños táctiles críticos.

## M7.5 — Release checklist y paquete para tiendas
**Prioridad:** 🔥 Alta · **Estimación:** 4 h · **Dependencias:** M7.4

**Aceptación**
- [ ] Version/build numbers definidos.
- [ ] Bundle/app IDs definitivos validados.
- [ ] Iconos/splash/assets, política de privacidad y metadata técnica inventariados.
- [ ] Artefactos release se generan sin secretos.
- [ ] Se documentan pasos de App Store Connect/Google Play y CI/CD futuro.
- [ ] La aprobación/revisión externa de las tiendas no se cuenta como trabajo “DONE” controlable por código.

---

# Decisiones abiertas que bloquean implementación

Estas decisiones deben resolverse en la spec de la fase correspondiente, no de forma improvisada durante Green:

1. **Versiones finales del stack** tras validar compatibilidad de tienda.
2. **Secure storage** para bearer token con Keychain/Keystore real.
3. **Guest checkout**: alcance UX exacto y recuperación de pedido.
4. **OpenPay en WebView**: estrategia soportada y requisitos de seguridad.
5. **Formato/resolución de imágenes** y fallback centralizado.
6. **Deep links**: esquema/app links/universal links y dominios.
7. **Testing runner** y estrategia de tests de componentes/services.
8. **CI/CD de builds nativos**: fuera de F0 salvo que se apruebe como alcance.
9. **Push notifications**: fuera del MVP; sólo notificaciones in-app.

# Definition of Ready para iniciar una tarea

- [ ] `AGENTS.md`, `STATE.md`, `.agent/WORKFLOW.md`, `PLAN.md` y esta tarea revisados.
- [ ] Discovery de código/API relacionado completado.
- [ ] Spec propia creada y `APPROVED`.
- [ ] Contratos/payloads relevantes confirmados.
- [ ] Dependencias y decisiones abiertas resueltas.
- [ ] No existen cambios ajenos sin revisar que puedan ser sobrescritos.

# Definition of Done

Además de los criterios particulares de la tarea:

- [ ] SDD ✅ o N/A justificado.
- [ ] BDD ✅ o N/A justificado.
- [ ] TDD RED ✅ o N/A justificado.
- [ ] TDD GREEN ✅ o N/A justificado.
- [ ] Refactor ✅ o N/A justificado.
- [ ] Tests específicos + módulo + suite relevante ejecutados.
- [ ] Lint/format/typecheck/build ejecutados cuando existan.
- [ ] `STATE.md` actualizado.
- [ ] Spec marcada `DONE` con referencia de implementación.
- [ ] Riesgos/pedientes explícitos; ningún “verde” inventado.
