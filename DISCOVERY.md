# DISCOVERY — Auditoría de contratos (M0.1)

**Fecha:** 2026-09-09
**Autor:** Agente (ramas `chore/m0-1-auditar-contratos`)
**Fuentes:** `/home/user/code/codeweb/101tags.com-/` (Laravel 11 + Sanctum + OpenPay MX)
**Modo backend observado:** `APP_DEMO_MODE=true`, `OPENPAY_*` vacíos, `MAIL_MAILER=log`, `STOREFRONT_URL=http://localhost:5173`

> Documento ejecutable. La auditoría completa vive en `docs/audit/*.md`. Aquí solo el resumen accionable, los huecos detectados y las decisiones que dependen de esto.

---

## 1. Veredicto general

- **Backend está listo para ser consumido por la app móvil.** 67 rutas `/api/*` relevantes para el comprador ya responden. No hace falta tocar backend.
- **El frontend Vue ya tiene espejo parcial** (26 interfaces + 12 unions + 4 generics en `storefront/src/types/*.ts`). Es reutilizable, pero requiere normalización.
- Hay **5 huecos de tipado** que la app móvil tendrá que resolver ella misma (no en backend, sino en `src/app/core/models/`).
- Hay **5 peculiaridades críticas** que condicionan el diseño de mobile (ver §4) — ninguna pide cambio al backend.

---

## 2. Topología de endpoints del comprador

| Categoría | # endpoints | Auth | Throttle |
|---|---|---|---|
| Auth customer | 6 (login, register, me, logout, forgot, reset) | mixto | `auth` (5/min email + 20/min ip) |
| Home / banners / footer / policies | 4 | público | — |
| Catálogo público (segment=basicos) | 9 | público | — (excepto `/catalog/sponsored-ads/{ad}/click` que es POST) |
| Servicios (segment=servicios) | 4 | público | — |
| Carrito | 4 | Sanctum | — |
| Checkout (request-orders + idempotencia) | 5 | público* | `checkout` (10/min email + 30/min ip) |
| Guest purchases | 2 | público / Sanctum | — |
| Pedidos del cliente | 3 | Sanctum | — |
| Cancelaciones / devoluciones | 3 | Sanctum | — |
| Rating | 1 | Sanctum | — |
| Chat de orden (mensajes + adjuntos) | 4 | Sanctum (+ signed download) | — |
| Notificaciones | 3 | Sanctum | — |
| Cupones | 2 | público (`validate` con throttle `checkout`) | — |
| Códigos postales | 1 | público | — |
| Cotizaciones industriales | 1 | público | — |
| Ratings públicos de supplier | 1 | público | — |
| Webhook OpenPay | 1 | BasicAuth + `webhook` (120/min) | — (sólo backend) |
| **Total buyer** | **~52** | mixto | mixto |

\* `request-orders`, `payment-proof`, `simulate-payment` son públicos pero aceptan opcionalmente `Authorization: Bearer` para asociar el pedido al user autenticado.

Detalle completo → `docs/audit/api-contracts.md`.

---

## 3. Tipos TypeScript del storefront

- **26 interfaces, 12 unions, 4 generics** extraídos a `types/*.ts`.
- 10+ tipos inline en `api/client.ts` (anónimos) → hay que **nombrarlos en mobile** porque la app no tiene esa `client.ts` que espeja.
- **5 gaps tipográficos identificados** que mobile debe resolver:
  1. **`LaravelErrorPayload`** — no existe tipo formal; `client.ts` lo infiere como `Record<string, unknown>`. Mobile debe definirlo para interceptar 422.
  2. **`Address`** — el campo `shipping_address` es `Record<string, string>` en `OrderDetail` y en el request de `requestOrders`. No hay tipo reusable.
  3. **`Banner`** — endpoint `GET /api/banners` existe; el storefront solo lo usa desde `adminClient.ts`, no desde el cliente.
  4. **`CheckoutPolicy`** — endpoint `GET /api/policies` no está wrapeado en cliente; existe en backend.
  5. **`SupplierRatingListPage`** — endpoint `GET /api/suppliers/{supplier}/ratings` no está wrapeado.
- **Naming inconsistente:** `CouponDefinition` es camelCase puro; el resto snake_case. **Decisión**: mobile fuerza **camelCase** en sus DTOs (más idiomático TS, ya hay precedente), transformando snake→camel con un mapper genérico.
- **Billing/string-number mix:** en facturas de proveedor aparece `string \| number` mezclado; mobile normaliza con `parseFloat` en runtime.

Detalle completo → `docs/audit/typescript-types.md`.

---

## 4. Peculiaridades críticas (top 5 para mobile)

| # | Peculiaridad | Impacto en diseño |
|---|---|---|
| 1 | **Idempotency-Key en `/api/checkout/request-orders`**. Regex `^[A-Za-z0-9._:-]{8,100}$`. Si fingerprint cambia con misma clave → `409`. Replay devuelve `access_token: null`. | `checkout.service.ts` debe generar UUID v4 estable por "intento de checkout del usuario" (no por HTTP call), persistido en `Preferences` mientras dure el wizard. 409 explícito con mensaje de regeneración. |
| 2 | **`access_token` guest se entrega UNA sola vez** en el response 201. En replay de idempotencia viene `null`. | Persistir inmediatamente en `Preferences secure:true` tras el 201. Sin esto, el guest nunca podrá reabrir su pedido. |
| 3 | **Tarjeta: la app NO maneja PAN/CVV**. Solo `source_id` + `device_session_id` (tokenizados por OpenPay SDK). `payment_methods.card` siempre `false` para proveedores externos — solo house/marca propia. | Integrar OpenPay SDK Android+iOS (no WebView). UI de tarjeta solo si `platform_openpay_enabled === true` o `demo_mode === true`. En demo, `openpay_public_key` puede venir `null`. |
| 4 | **Sanctum: 1 device activo por usuario**. Cada login/reset invalida todos los `customer-token`. Expiración 30 días sin refresh. | `auth.interceptor.ts` con 401 → logout limpio y re-login. Sin asumir multi-device concurrente. Sin refresh silencioso. Aviso "tu sesión expira pronto" antes del día 25. |
| 5 | **Anti-leak de contacto en chat**: blacklist literal case-sensitive de `@`, `mailto:`, `whatsapp`, `tel:` (también `http://`/`https://` solo en calificación, ver peculiaridad 12). Sin sanitización HTML real. | Filtro idéntico en cliente antes de enviar; Angular `{{message.body}}` con escape HTML nativo — nunca `[innerHTML]`. Adjuntos solo `image/* + application/pdf` ≤8 MB. |

Las **12 peculiaridades restantes** (modo demo, demo-order, simulate-payment, guest linking por email, multipart 413, paginación offset, CORS dev, deep links de reset, validación de email en payment-proof y payment-instructions) → `docs/audit/peculiarities.md`.

---

## 5. Discrepancias detectadas con `PLAN.md`

| # | Discrepancia | Resolución |
|---|---|---|
| D1 | PLAN.md dice "PUT/DELETE en cart"; el backend expone **POST `/cart/sync`** (batch) + PUT (1 item) + DELETE (1 item). | Mobile usa el endpoint batch cuando hay cambios múltiples (diff con servidor local) y el PUT/DELETE unitarios para acciones inline. Decisión de M3.1. |
| D2 | PLAN.md dice "POST /api/checkout/charge" como flujo principal. En realidad **es legacy** (sólo 1 supplier por carrito). El moderno es `POST /api/checkout/request-orders` (multi-supplier). | Mobile **ignora** `/api/checkout/charge`. Migrar PLAN.md para reflejar esto. |
| D3 | PLAN.md sugiere "config.dynamic import de OpenPay". El backend expone `openpay_enabled=false` para cliente externo; sólo para house. | M3.6 spec confirma: `payment_methods.card` siempre `false` para externos → la UI de tarjeta **solo aplica a house/marca propia**. Mobile no necesita OpenPay SDK si la app es 100% básicos. **Revisar si MVP incluye house.** (Sí, según alcance confirmado.) |
| D4 | PLAN.md dice "OpenPay expondrá UI completa". En realidad el flujo moderno es: en `request-orders` con `house_payment_method=card`, se pasa `source_id`+`device_session_id`. La "UI" OpenPay.js sólo se usa en web. | M3.6 spec **debe documentar explícitamente** qué pasa en nativo: ¿usar SDK nativo? ¿In-App Browser al storefront para flujos de tarjeta? Decisión previa a codear — ver §7. |
| D5 | PLAN.md muestra "ratings" como `GET /api/suppliers/{id}/ratings` ya mapeado. El endpoint existe público y sin wrapper en `client.ts`. | M2.4 spec incluye fetch de ratings del supplier que vende el producto en `product.detail` (greeting-card). |
| D6 | PLAN.md asume "10 endpoints paginados con cursor". En realidad todos son `LengthAwarePaginator` con `?page=` + `?per_page=`. | Mobile usa offset-based; `Paginated<T>` ya definido en storefront lo espeja exactamente. |
| D7 | PLAN.md no menciona **`/api/checkout/policies`** ni **`/api/banners`**. | M2.1 (home) usa `banners` + `home-content`. M6.3 (estáticas) usa `policies`. Actualizar PLAN.md. |

---

## 6. Huecos que la app móvil debe resolver (sin pedir cambios al backend)

Mobile generará estos modelos aunque NO existan en `storefront/types/*.ts`:

1. `LaravelErrorPayload` — `{ message?: string; errors?: Record<string, string[] | string> }`
2. `Address` — al menos `{ street, city, state, zip, neighborhood? }` (campos requeridos por `request-orders`)
3. `Banner` — equivalente a `HomeContentItem` (el endpoint `/banners` devuelve exactamente la misma forma)
4. `CheckoutPolicies` — `{ manual_payment_disclaimer, mediation_window_hours, whatsapp_enabled }`
5. `SupplierRatingListPage` — `Paginated<{ id, rating, comment, created_at, verified_purchase, customer_label }>`
6. `GuestPurchaseView` — tipar el response de `/api/guest/purchases/{guestToken}` (inline en client.ts)
7. `ClaimGuestRequest` y `RequestOrdersResponse` — wrapper de `POST /api/checkout/request-orders`
8. `HomeContentResponse` — discriminado entre "todos los placements" y "uno específico según query"
9. `HomeContentByPlacement` — no es opcional con `data: T[]`; el backend anida `data: { hero, featured_category, featured_media, ribbon: T[] }`

Mobile creará un mapeador genérico `snakeToCamel(obj)` para convertir respuestas del backend → DTOs camelCase, manteniendo opcionalidad explícita.

---

## 7. Decisiones que esta auditoría NO resuelve (pujan a otras specs)

Estas decisiones NO son de M0.1. Las specs responsables las cerrarán:

- **D-OPENPAY-NATIVE** (cierra en M3.6 spec): ¿SDK nativo Android+iOS, in-app browser al storefront, o diferir tarjeta house a v2? Antes de codear, documentar trade-offs en M3.6.
- **D-DEEPLINK-RESET** (cierra en M1.4 spec): ¿scheme nativo `com.101tags.comprador://reset?token=X&email=Y` como link en el email de reset? Requiere spec que justifique y aprobar customización backend.
- **D-PAGINATION-CACHE** (cierra en F2 specs): ¿Qué endpoints cachear offline con `@capacitor/preferences`? Mínimo viable: carrito, último `home-content`.
- **D-MULTI-HOUSE-CART** (cierra en M3.2 spec): confirmar que el carrito mobile solo soporta productos house si los hay, mezclados con externos. La UX del primer escenario define esto.
- **D-NOTIFICATIONS-PUSH** (fuera del MVP): confirmado "no push en MVP", sólo in-app vía `/api/notifications`. Decidido.

---

## 8. Implicaciones para M0.4 (generar workspace)

Cuando se genere `ionic start mobile blank --type=angular --capacitor` (M0.4):

1. **Estrategia de carpetas mobile confirmada** (de PLAN.md §Estructura):
   ```
   src/app/core/{interceptors,services,guards,models}/
   src/app/shared/{components,pipes,directives}/
   src/app/pages/{auth,catalog,cart,checkout,account,order-chat,static}/
   ```
2. **Modelos iniciales** a crear (basado en §6):
   - `core/models/api-error.model.ts`
   - `core/models/address.model.ts`
   - `core/models/auth.model.ts` (`CustomerUser`, `AuthResponse`)
   - `core/models/cart.model.ts`
   - `core/models/catalog.model.ts` (todo el árbol de tipos)
   - `core/models/order.model.ts`
   - `core/models/payment.model.ts`
   - `core/models/home-content.model.ts`
   - `core/models/conversation.model.ts`
   - `core/models/returns.model.ts`
   - `core/models/coupon.model.ts`
   - `core/models/common.model.ts` (`Paginated<T>`, `ISODateString`, etc.)
3. **Interceptores requeridos:**
   - `AuthInterceptor` — añade `Authorization: Bearer <token>` cuando exista.
   - `ErrorInterceptor` — maneja 401 (logout limpio), 422 (extrae `errors`), 429 (`Retry-After`), 413.
4. **Servicios iniciales:**
   - `AuthService` (login/register/logout/me, restore session).
   - `StorageService` wrapper de `@capacitor/preferences` con `secure: true` para tokens.
   - `ApiService` base HTTP con `environment.apiBaseUrl`.
   - Resto se crean por feature en F1–F7.
5. **Sin secretos:**
   - `environment.ts` puede llevar `apiBaseUrl: 'http://localhost:8000/api'` en dev.
   - `environment.prod.ts` debe tomar URL de build arg o de variable CI; el repo NO la hardcodea.

---

## 9. Riesgos detectados

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | Backend cambia contrato sin avisar y mobile rompe | M0.6 baseline + tests de smoke E2E contra backend vivo. Specs de cada feature validan contra `DISCOVERY.md`. Si cambia, abrir nueva issue. |
| R2 | `APP_DEMO_MODE` propagado al cliente como feature-flag visible | Mostrar banner persistente "Modo demo — los pagos son simulados". No esconder errores. |
| R3 | Token guest perdido por crash entre 201 y persistencia | `request-orders` responde con `purchase_number` y `access_token`. Persistir ambos en el mismo `Preferences.set()` atómico antes de cualquier `await` adicional. |
| R4 | OpenPay en WebView rompe (`openpay_public_key` falsamente cargado) | M3.6 spec decide antes de codear. Si la decisión es SDK nativo, agregar `OpenPay SDK` a `package.json` en M0.5 con justificación documentada. |
| R5 | Mismatch de convención snake/camel entre backend y mobile | Mapeador genérico + tests unitarios contra fixtures reales del backend. |
| R6 | `whatsapp` también se bloquea en chat (mención legítima) | Mostrar proactivamente la regla antes de enviar; copy exacto de la regla del backend. |

---

## 10. Estado de salida para considerar M0.1 DONE

- [x] `routes/api.php` mapeado completo para comprador.
- [x] `api.php` validado contra `app/Http/Controllers/Api/*`.
- [x] 19 archivos de `storefront/src/types/*.ts` inventariados.
- [x] `api/client.ts` analizado para tipos inline.
- [x] 12 peculiaridades backend documentadas con cita `file:line`.
- [x] 5 huecos de tipado detectados con plan para DTOs móviles.
- [x] 7 discrepancias con `PLAN.md` detectadas con resolución.
- [x] Decisiones pujadas a specs futuras (D-OPENPAY-NATIVE, D-DEEPLINK-RESET, etc.).
- [x] Implicaciones para M0.4 listas (estructura, modelos iniciales, interceptores).
- [x] Riesgos con mitigaciones concretas.

M0.1 → `DONE` cuando este `DISCOVERY.md` esté consolidado y firmado.
