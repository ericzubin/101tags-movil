# 📱 PLAN — 101tags mobile

**Estado:** PLANNED — implementación no iniciada  
**Producto:** app móvil para compradores de 101tags  
**Plataformas:** iOS + Android  
**Backend:** Laravel 12 existente en `101tags.com-`  
**Backlog ejecutable:** `TASKS.md`

---

## 1. Principio principal: consumir, no reinventar backend

La app móvil consume la API existente de `101tags.com-`. No se crea desde este repositorio ningún modelo, migración, controlador, tabla o regla de negocio Laravel.

La fuente de verdad de contratos backend se consulta en este orden:

1. `routes/api.php`.
2. Requests/controllers/services relacionados.
3. Tests backend.
4. `storefront/src/api/client.ts` y tipos del storefront.
5. Documentación backend.

Si el móvil descubre que falta un contrato, se documenta en Discovery. **No se modifica el backend** sin una spec separada y aprobación explícita.

### Contratos base confirmados

| Área | Contrato |
|---|---|
| Auth | Sanctum bearer token mediante `/api/auth/customer/*` |
| Catálogo | `/api/catalog/*`, home content, banners y ratings |
| Carrito | `/api/cart/*` |
| Checkout | `/api/checkout/config` + `/api/checkout/request-orders` |
| Idempotencia | `Idempotency-Key` en request-orders |
| Pagos pendientes | payment instructions + upload de comprobante |
| Pedidos | `/api/orders/*` |
| Post-compra | cancellations, returns, ratings |
| Chat | conversations + order messages + attachments |
| Cupones | `/api/coupons*` |
| Notificaciones | GET list + PATCH individual + POST read-all |
| Cuenta | customer `me` + logout |

> La compra real es **carrito → checkout → pago/pedido**. El chat de orden es post-compra/post-generación de pedido; no sustituye al checkout.

---

## 2. Alcance del MVP

El MVP está centrado en el segmento **Básicos** e incluye:

1. Splash/restauración de sesión.
2. Login.
3. Registro.
4. Forgot password.
5. Reset password mediante deep link/fallback definido en spec.
6. Shell principal con 4 tabs: Inicio, Catálogo, Carrito y Cuenta.
7. Home con hero, banners, categorías y destacados.
8. Navegación de categorías.
9. Lista de productos paginada con filtros móviles.
10. Detalle de producto con galería, variantes, stock y cantidad.
11. Carrito sincronizado con API y badge.
12. Checkout: dirección, envío, pago y resumen.
13. Guest checkout si se mantiene tras validar el contrato/UX.
14. Request de orden con idempotencia.
15. Pago pendiente OXXO/SPEI.
16. Carga de comprobante.
17. OpenPay tarjeta sólo si config/API lo habilita y la integración móvil queda validada.
18. Mis pedidos.
19. Detalle de pedido, timeline y tracking.
20. Cancelaciones.
21. Devoluciones.
22. Calificación de proveedor.
23. Chat de orden con polling controlado.
24. Adjuntos de chat.
25. Notificaciones in-app.
26. Cupones.
27. Perfil/settings/logout.
28. Términos, privacidad y ayuda.
29. Deep links nativos.
30. Builds y QA Android/iOS.
31. Checklist de release para tiendas.

### Fuera del MVP

- Push notifications remotas, salvo nueva spec.
- Multi-idioma; MVP sólo `es-MX`.
- Nuevos endpoints o cambios backend no aprobados.
- Panel admin/proveedor móvil.
- Reescritura de reglas de precios/pagos en cliente.
- CI/CD completo de tiendas salvo que se apruebe como tarea adicional.

---

## 3. Stack objetivo y gate de versiones

Intención original:

- Ionic 7.
- Angular 17 standalone components.
- Capacitor 6.
- TypeScript.
- Tailwind CSS.
- pnpm.
- Angular signals + `inject()`.
- `HttpClient` con interceptor Bearer.

**Estas versiones todavía no están congeladas.** La tarea `M0.3` debe validar compatibilidad con Node, Android SDK/Gradle, Xcode/iOS y requisitos vigentes de las tiendas antes de ejecutar el scaffold. Cualquier cambio de versión se justifica en `.spec/00-ionic-scaffold.md` y requiere aprobación.

---

## 4. Seguridad

### Bearer token

La definición anterior que asumía `Capacitor Preferences` con una opción `secure: true` se corrige:

- `@capacitor/preferences` se considera almacenamiento para datos ligeros/no sensibles.
- El token Sanctum debe persistirse mediante una solución respaldada por **Keychain en iOS y Keystore/equivalente seguro en Android**.
- La dependencia concreta se selecciona en la spec de Auth, con justificación y aprobación.
- El token nunca se loggea.
- Logout elimina credenciales locales.

### Otras reglas

- Producción usa HTTPS.
- No almacenar datos de tarjeta.
- No commitear keystores, certificados, provisioning profiles ni `.env` con secretos.
- El cliente puede validar UX, pero autorización/ownership siguen siendo autoridad del backend.
- Errores 401/403/404/409/422/429/5xx deben distinguirse cuando el contrato lo permita.
- Dependencias nuevas sólo con justificación en spec.

---

## 5. Branding y UX base

- Idioma: `es-MX`.
- Primary: `#E31E24`.
- Dark: `#0a0a0a`.
- Gray surface: `#F5F5F5`.
- Fuente: Montserrat.
- Modo oscuro: alineado con comportamiento acordado del storefront / `prefers-color-scheme` si la spec lo confirma.
- Loading, empty, offline y error states son parte del comportamiento, no trabajo opcional al final.
- Controles críticos deben tener labels, foco usable, contraste y target táctil razonable.

---

## 6. Arquitectura objetivo

La estructura definitiva se congela durante F0; el objetivo es mantener separación clara entre infraestructura, servicios, shared UI y páginas:

```text
src/
├── app/
│   ├── app.component.ts
│   ├── app.config.ts
│   ├── app.routes.ts
│   ├── core/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── models/
│   │   └── services/
│   ├── shared/
│   │   ├── components/
│   │   ├── directives/
│   │   └── pipes/
│   └── pages/
│       ├── auth/
│       ├── home/
│       ├── catalog/
│       ├── cart/
│       ├── checkout/
│       ├── account/
│       ├── order-chat/
│       └── static/
├── environments/
└── theme/
ios/
android/
```

### Servicios previstos

- `api.service` o wrapper equivalente.
- `auth.service`.
- `catalog.service`.
- `cart.service`.
- `checkout.service`.
- `orders.service`.
- `returns.service`.
- `coupons.service`.
- `notifications.service`.
- `messages.service`.
- storage no sensible + secure credential storage claramente separados.

No crear abstracciones vacías sólo porque aparecen en este diagrama: cada pieza nace cuando su spec la necesita.

---

## 7. Mapeo API → feature

| Feature | Endpoints/contratos principales |
|---|---|
| Login/Registro/Forgot/Reset | `POST /api/auth/customer/{login,register,forgot-password,reset-password}` |
| Sesión | `GET /api/auth/customer/me`, logout existente |
| Home | home content, sponsored ads, categories, banners |
| Categorías | `GET /api/catalog/categories` + filtros |
| Productos | catalog products paginado + product detail + supplier ratings |
| Carrito | GET cart, PUT items, DELETE item |
| Checkout config | `GET /api/checkout/config` |
| Crear orden | `POST /api/checkout/request-orders` + `Idempotency-Key` |
| Pago pendiente | payment instructions + payment proof multipart |
| Pedidos | GET orders + detalle por orderNumber |
| Rating | POST rating |
| Devolución/Cancelación | endpoints de returns/cancellations existentes |
| Chat | conversations + order messages + attachments |
| Cupones | GET coupons + validate |
| Notificaciones | GET notifications, PATCH id, POST read-all |

Los payloads exactos no se duplican aquí: cada spec debe extraerlos del backend actual antes de implementar.

---

## 8. Estado local y comportamiento de red

### Auth

- Sesión: signal/estado central.
- Arranque: restaurar credencial segura → consultar `me` → decidir shell/login.
- 401: invalidar credencial y sesión de forma controlada.

### Carrito

- Signal central para UI/badge.
- La API sigue siendo autoridad de carrito autenticado.
- Cualquier optimismo de UI debe tener rollback en error.

### Checkout

- No confiar en precios/totales manipulables del cliente.
- Cada intento lógico de `request-orders` debe usar idempotencia.
- Timeout/reintento no debe crear duplicados.

### Chat

- Polling previsto de ~5 s sólo si la spec confirma que coincide con el web/backend.
- El polling debe detenerse al abandonar/destruir la vista.
- No acumular intervals/subscriptions.

### Offline/red

No se pretende un modo offline completo en MVP. Sí se exige:

- detectar/manejar fallo de red;
- no presentar éxito si no hubo confirmación;
- permitir retry seguro donde aplique;
- proteger operaciones no idempotentes.

---

## 9. Pagos

### OXXO/SPEI

La app muestra las `payment_instructions` entregadas por API; no inventa referencias ni datos de pago.

### Comprobante

- Multipart al endpoint backend correspondiente.
- Validar tipo/tamaño conforme contrato.
- Loading/progress/retry controlado.

### OpenPay

- Sólo aparece si `/checkout/config` lo habilita.
- La estrategia de tokenización dentro del contexto móvil/WebView debe validarse técnicamente antes de implementar.
- Datos de tarjeta nunca se guardan ni se escriben a logs propios.

---

## 10. Fases de implementación

Cada fase se descompone en `TASKS.md`; cada tarea requiere spec independiente cuando corresponda.

| Fase | IDs | Resultado | Estimación base |
|---|---|---|---:|
| F0 | M0.1–M0.6 | Scaffold y baseline verificable | 16 h |
| F1 | M1.1–M1.5 | Auth/sesión/tabs | 17 h |
| F2 | M2.1–M2.5 | Home/catálogo/producto | 21 h |
| F3 | M3.1–M3.6 | Carrito/checkout/pagos | 27 h |
| F4 | M4.1–M4.3 | Post-compra | 11 h |
| F5 | M5.1–M5.3 | Chat/notificaciones | 11 h |
| F6 | M6.1–M6.3 | Cuenta/cupones/estáticas | 8 h |
| F7 | M7.1–M7.5 | Nativo/QA/release | 24 h |
| **Total** | **36 tareas** | **MVP** | **135 h** |

### Sobre la estimación original de ~7 días

La estimación original se conserva como referencia histórica de implementación compacta, pero **no debe usarse como compromiso**. El desglose actual incorpora:

- Discovery y contratos.
- SDD/BDD/TDD.
- Baseline de calidad.
- Seguridad/storage.
- Errores y edge cases.
- Android/iOS reales.
- Signing/deep links.
- QA de regresión/accesibilidad/red.
- Preparación de release.

Después de F0 se deben recalibrar las horas con datos reales del scaffold y toolchain.

---

## 11. Decisiones que deben cerrarse por spec

1. Versiones finales Ionic/Angular/Capacitor.
2. Test runner y comandos exactos.
3. Secure storage de bearer token.
4. Alcance UX de guest checkout.
5. Deep link scheme + app/universal links.
6. Resolución centralizada de media URLs.
7. Orden UX de selección de variantes.
8. Integración OpenPay adecuada a móvil/WebView.
9. Política de retry/idempotencia.
10. Estrategia de polling de chat.
11. Push remoto: fuera del MVP salvo nueva aprobación.

---

## 12. Flujo obligatorio por tarea

Todo trabajo sigue:

**DISCOVERY → SDD → BDD → TDD RED → TDD GREEN → REFACTOR → VERIFICATION**

Una tarea sólo está DONE cuando la evidencia real está registrada en su spec y/o `STATE.md` según `.agent/WORKFLOW.md`.

No implementar desde un `DRAFT`.

---

## 13. Documentación y sincronización

### Repo = fuente técnica

- `AGENTS.md` — reglas.
- `.agent/WORKFLOW.md` — metodología.
- `PLAN.md` — plan maestro.
- `TASKS.md` — backlog detallado.
- `.spec/` — specs ejecutables.
- `STATE.md` — estado/relevo.

### Notion = seguimiento

Las tareas de Notion se crean con prefijo `[101M]` y reflejan `TASKS.md`. El proyecto `101tags-movil` en Notion resume este plan y enlaza al repositorio.

Si Notion y el repo divergen, se corrige primero la fuente técnica en repo y después el espejo de Notion.

---

## 14. Próximo paso exacto

1. Revisar `.spec/00-ionic-scaffold.md`.
2. Completar M0.3: validar matriz de versiones/requisitos de tiendas.
3. Ajustar la spec con las versiones definitivas.
4. Cambiar `Status: DRAFT` → `APPROVED` sólo cuando la decisión esté aceptada.
5. Recién entonces ejecutar M0.4 y generar el scaffold.

Hasta ese momento el proyecto permanece **PLANNED/READY**, sin código funcional generado.
