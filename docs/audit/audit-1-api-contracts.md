# Audit A — Contratos API del comprador

**Generado:** 2026-09-09 (subagente explore en `chore/m0-1-auditar-contratos`)
**Fuente primaria:** `/home/user/code/codeweb/101tags.com-/routes/api.php` (281 líneas) + `routes/web.php` + Controllers en `app/Http/Controllers/Api/`

> Documento de referencia. Lo accionable está en `DISCOVERY.md`. Aquí está el detalle por endpoint.

---

## 1. Base URL y convenciones

- **Prefijo:** Todas las rutas cuelgan de `/api/*` (gestionado automáticamente por Laravel al cargar `routes/api.php` con `RouteServiceProvider`).
- **Roles (`users.role`):** `admin`, `customer`, `supplier`. Token Sanctum del cliente se llama `customer-token`.
- **RateLimiters** (`AppServiceProvider::configureRateLimiting`):
  | Nombre | Clave | Límite |
  |---|---|---|
  | `auth` | `lowercase(email)\|ip` + `ip` | 5/min + 20/min |
  | `checkout` | `checkout\|{user_id o customer_email}` + `checkout-ip\|{ip}` | 10/min + 30/min |
  | `webhook` | `ip` | 120/min |

  En `APP_ENV=testing` todos devuelven `Limit::none()`.

- **Shape de error estándar Laravel:**
  - 401 → `{message: "Unauthenticated."}`
  - 403 → `{message: "..."}`
  - 404 → `{message: "..."}` (custom) o Laravel `No query results for model [X] ...`
  - 422 → mixto: `{message, errors:{field:[...]}}` OR `{message:"..."}` plano
  - 413 → `{message:"Las fotos pesan demasiado..."}` (handler `PostTooLargeException` en `bootstrap/app.php:44-50`)
  - 429 → `{message: "Too Many Attempts."}` con `Retry-After`

- **Paginación:** todos los endpoints paginados usan `LengthAwarePaginator` con `?page=N&per_page=N`. **Sin cursor**. Shape: `{data, current_page, last_page, per_page, total, from, to, path, first_page_url, last_page_url, next_page_url, prev_page_url, links:[{url,label,active}]}`.

---

## 2. Tabla maestra — endpoints del comprador

Leyenda:
- **Auth**: `P` = público, `S` = `auth:sanctum`, `P*` = público con auth opcional.
- **Throttle**: nombre del limiter o `—`.

| # | Método | URI | Auth | Throttle | Categoría |
|---|---|---|---|---|---|
| 1 | GET | `/health` | P | — | health |
| 2 | GET | `/banners` | P | — | home |
| 3 | GET | `/home-content` | P | — | home |
| 4 | GET | `/footer` | P | — | home |
| 5 | GET | `/policies` | P | — | home |
| 6 | GET | `/catalog/categories` | P | — | catalog |
| 7 | GET | `/catalog/products` | P | — | catalog |
| 8 | GET | `/catalog/products/{slug}` | P | — | catalog |
| 9 | GET | `/catalog/filters` | P | — | catalog |
| 10 | GET | `/catalog/stores` | P | — | catalog |
| 11 | GET | `/catalog/stores/{slug}` | P | — | catalog |
| 12 | GET | `/catalog/stores/{slug}/sponsored-ads` | P | — | catalog |
| 13 | GET | `/catalog/sponsored-ads` | P | — | catalog |
| 14 | POST | `/catalog/sponsored-ads/{ad}/click` | P | — | catalog |
| 15 | GET | `/services` | P | — | servicios |
| 16 | GET | `/services/{slug}` | P | — | servicios |
| 17 | GET | `/services/providers/{slug}` | P | — | servicios |
| 18 | GET | `/services/filters` | P | — | servicios |
| 19 | GET | `/postal-codes/{cp}` | P | — | checkout helpers |
| 20 | GET | `/suppliers/{supplier}/ratings` | P | — | catalog |
| 21 | POST | `/quotes` | P | — | industrial |
| 22 | POST | `/auth/customer/register` | P | auth | auth |
| 23 | POST | `/auth/customer/login` | P | auth | auth |
| 24 | POST | `/auth/customer/forgot-password` | P | auth | auth |
| 25 | POST | `/auth/customer/reset-password` | P | auth | auth |
| 26 | GET | `/auth/customer/me` | S | — | auth |
| 27 | POST | `/auth/customer/logout` | S | — | auth |
| 28 | GET | `/cart` | S | — | cart |
| 29 | POST | `/cart/sync` | S | — | cart |
| 30 | PUT | `/cart/items` | S | — | cart |
| 31 | DELETE | `/cart/items/{variantId}` | S | — | cart |
| 32 | GET | `/checkout/config` | P | — | checkout |
| 33 | GET | `/checkout/policies` | P | — | checkout |
| 34 | POST | `/checkout/request-orders` | P* | checkout | checkout |
| 35 | POST | `/checkout/charge` | P | checkout | checkout (legacy) |
| 36 | POST | `/checkout/simulate-payment` | P* | checkout | checkout (demo) |
| 37 | POST | `/checkout/demo-order` | P | checkout | checkout (demo, sólo no-prod) |
| 38 | GET | `/checkout/payment-instructions/{order}` | P | — | checkout |
| 39 | POST | `/checkout/orders/{order}/payment-proof` | P* | checkout | checkout |
| 40 | GET | `/checkout/orders/{order}/payment-proof-file` | signed | — | checkout |
| 41 | GET | `/guest/purchases/{guestToken}` | P | — | guest |
| 42 | POST | `/purchases/claim-guest` | S | — | guest |
| 43 | GET | `/orders` | S | — | orders |
| 44 | GET | `/orders/{orderNumber}` | S | — | orders |
| 45 | POST | `/orders/{orderNumber}/rating` | S | — | orders |
| 46 | GET | `/return-requests` | S | — | orders |
| 47 | POST | `/orders/{orderNumber}/returns` | S | — | orders |
| 48 | POST | `/orders/{orderNumber}/cancellations` | S | — | orders |
| 49 | GET | `/conversations` | S | — | chat |
| 50 | GET | `/orders/{orderNumber}/messages` | S | — | chat |
| 51 | POST | `/orders/{orderNumber}/messages` | S | — | chat |
| 52 | POST | `/orders/{orderNumber}/messages/attachments` | S | — | chat |
| 53 | GET | `/orders/{orderNumber}/attachments/{attachmentId}` | signed (+ opcional Bearer) | — | chat |
| 54 | GET | `/notifications` | S | — | notifications |
| 55 | POST | `/notifications/read-all` | S | — | notifications |
| 56 | PATCH | `/notifications/{notification}` | S | — | notifications |
| 57 | GET | `/coupons` | P | — | coupons |
| 58 | POST | `/coupons/validate` | P | checkout | coupons |

Endpoints **NO comprador** (excluidos explícitamente de la app):
- `GET /auth/*` admin, `POST /auth/login`
- `GET /supplier/*` (todo), `POST /suppliers/{parse-csf,register,maquila-contact}`
- `GET /admin/*` (todo), `POST /admin/*` (todo)
- `POST /webhooks/openpay` (backend-only)
- `GET /supplier/subscription/payment-config`, `GET /subscription-plans`, `GET /platform-pricing` (info de plataforma, sólo supplier)

---

## 3. Esquema detallado (los críticos)

### 3.1 Auth customer

**`POST /api/auth/customer/register`** (P, throttle `auth`)
- Body: `{name, email, password (≥6), phone?}`
- 201: `{accessToken, user:{id,name,email,phone,role:"customer"}}`
- Side-effect: vincula pedidos guest del mismo email.
- 422: validación Laravel. 429: throttle.

**`POST /api/auth/customer/login`** (P, throttle `auth`)
- Body: `{email, password}`
- 201: `{accessToken, user}`
- **Invalida todos los `customer-token` previos** del usuario.
- 422 si cuenta admin: `"Usa el panel de administración para esta cuenta."`
- 422 si creds malas: `"Correo o contraseña incorrectos"`.

**`POST /api/auth/customer/forgot-password`** (P, throttle `auth`)
- Body: `{email}`
- 200: respuesta genérica (anti-enumeración).
- **Email se envía a `STOREFRONT_URL/restablecer-contrasena?token=X&email=Y`** (sin soporte nativo todavía).

**`POST /api/auth/customer/reset-password`** (P, throttle `auth`)
- Body: `{email, token, password (≥6), password_confirmation}`
- 200: éxito. **Invalida todos los `customer-token` del usuario.**
- 422 si token inválido/expirado.

**`GET /api/auth/customer/me`** (S)
- 200: `{user:{id,name,email,phone,role:"customer"}}`
- 401: token inválido.

**`POST /api/auth/customer/logout`** (S)
- 200: `{message:"Logged out"}`. Borra el token actual.

### 3.2 Home / banners / footer / policies

**`GET /api/home-content?placement={hero|featured_category|featured_media|ribbon}`** (P)
- Sin query → devuelve agrupado por placement.
- Con query válida → devuelve array de items filtrados.
- Cache: `public, max-age=180, stale-while-revalidate=600`.
- Response (agrupado): `{data: {hero:[...], featured_category:[...], featured_media:[...], ribbon:[...]}}`
- Item `Banner`: `{id, placement, type:"image|video|animation", image, video, poster, alt, link, size:"large|small|null", category:{id,slug,name}|null, title, subtitle, sort_order, starts_at, ends_at}`.

**`GET /api/banners`** (P)
- 200: `{data: Banner[]}` (TODOS los banners activos, sin filtrar por placement).

**`GET /api/footer`** (P)
- 200: `{groups:[{title, links:[{label,url}]}], legal:[{label,url}]}`

**`GET /api/policies`** (P)
- 200: `{manual_payment_disclaimer, mediation_window_hours, whatsapp_enabled}`

### 3.3 Catálogo público

**`GET /api/catalog/categories?segment={basicos|industrial|servicios}`** (P)
- Default `segment=basicos`.
- 200: `{data: Category[]}` con `children` jerárquicos.
- Shape Category: `{id, name, slug, segment, description, image_url, products_count, children?:Category[]}`.

**`GET /api/catalog/products?...`** (P)
- Query (todos opcionales): `q`, `category` (csv), `subcategory`, `sizes` (csv), `colors` (csv), `price_min`, `price_max`, `segment`, `supplier_id`, `sort ∈ {newest|price_asc|price_desc}`, `featured`, `in_stock`, `on_sale`, `page`, `per_page (1..48, default 12)`.
- 200: paginación Laravel estándar. `data` item vía `CatalogFormatter::product($p, detailed=false)`:
  ```
  {id, name, slug, supplier_id, base_price, min_price, max_price,
   image, images:[{path,url}], category:{id,name,slug}|null,
   subcategory:{slug,name}|null, is_featured, in_stock, total_stock,
   available_sizes[], available_colors[]}
  ```
- 422 validación.

**`GET /api/catalog/products/{slug}`** (P)
- 200: `CatalogFormatter::product($p, detailed=true)` — incluye `description` y `variants:[{id,size,color,sku,stock,in_stock,price,price_override|null}]`.
- 404 si slug no existe.

**`GET /api/catalog/filters?segment=&category=`** (P)
- 200: `{sizes, colors, price_min, price_max, categories:[{slug,name,count}], subcategories:[{slug,name,category_slug,count}]}`.

**`GET /api/catalog/stores?segment=`** (P)
- 200: `{data: SupplierStore[]}` con `{id, supplier_id, slug, name, logo, segment, tagline, description, banner, presentationImage, heroImage, rating, reviewCount, productsCount, since, categories:[{name,key,image}], productSlugs:[], highlights:[], is_published, store_access}`.

**`GET /api/catalog/stores/{slug}`** (P)
- 200: `{store: SupplierStore}`. 404 si no publicado.

**`GET /api/catalog/stores/{slug}/sponsored-ads?record_impressions=true`** (P)
- 200: `{data:[{ad_id, title, placement, product:ProductSummary}]}`

**`GET /api/catalog/sponsored-ads`** (P)
- 200: `{data:[{ad_id, title, placement, product:ProductSummary}]}`
- Top N por config `101tags.supplier_ads.home_limit` (default 3). Side-effect: incrementa `impressions`.

**`POST /api/catalog/sponsored-ads/{ad}/click`** (P)
- 200: `{ok: true}`. 404 si invisible.

### 3.4 Servicios (segmento servicios)

Endpoints `GET /api/services`, `GET /api/services/{slug}`, `GET /api/services/providers/{slug}`, `GET /api/services/filters`. Shape `ServiceSummary` y `ServiceDetail` ya tipados en storefront. Detalle completo en `audit-3-typescript-types.md`.

### 3.5 Carrito

**`GET /api/cart`** (S)
- 200: `{items:[{variant_id, product_id, supplier_id, product_name, product_slug, size, color, sku, price, stock, quantity, image, line_total}]}`

**`POST /api/cart/sync`** (S)
- Body: `{items:[{variant_id, quantity}]}`.
- 200: mismo shape que GET. Trunca cada item a stock; omite inactivos.

**`PUT /api/cart/items`** (S)
- Body: `{variant_id, quantity (≥0)}`.
- 200: items actualizados. Si quantity=0 → elimina.
- 404 si variant no existe.

**`DELETE /api/cart/items/{variantId}`** (S)
- 200: items restantes. No 404 si no estaba.

### 3.6 Checkout

**`GET /api/checkout/config`** (P)
- 200:
  ```json
  {
    "customer_payment_mode": "supplier_manual",
    "openpay_enabled": false,
    "supplier_openpay_enabled": true|false,
    "openpay_merchant_id": null,
    "openpay_public_key": null,
    "openpay_sandbox": true|false,
    "demo_mode": true|false,
    "payment_mode": "supplier_manual",
    "payment_methods": {"card": false, "oxxo": true, "spei": true},
    "platform_openpay_enabled": true|false,
    "platform_openpay_public_key": "...",
    "platform_openpay_merchant_id": "...",
    "house_payment_available": true|false,
    "house_supplier_ids": [1,2,...],
    "house_payment_methods": {"card": true, "oxxo": true, "spei": true},
    "oxxo_due_hours": 72,
    "spei_due_hours": 48,
    "manual_payment_disclaimer": "..."
  }
  ```

**`POST /api/checkout/request-orders`** (P*, throttle `checkout`)
- Headers opcionales: `Idempotency-Key` regex `^[A-Za-z0-9._:-]{8,100}$`.
- Body:
  ```json
  {
    "segment": "basicos|industrial",
    "items": [{"variant_id": int, "quantity": int (≥1)}],
    "customer_name": "string",
    "customer_email": "email",
    "customer_phone": "string?",
    "coupon_code": "string?",
    "shipping_address": {
      "street": "string", "city": "string", "state": "string",
      "zip": "string", "neighborhood": "string?"
    },
    "house_payment_method": "card|oxxo|spei?",
    "source_id": "string?",
    "device_session_id": "string?"
  }
  ```
- 201 (success nuevo):
  ```json
  {
    "message": "...",
    "purchase_number": "P-...",
    "access_token": "<64-char guest token>",
    "orders": [{
      "order_number", "supplier_id", "status", "payment_status",
      "payment_mode", "payment_method", "payment_instructions", "total"
    }],
    "house_payment": {
      "order_number", "status":"paid|pending|failed",
      "message", "payment_instructions"
    } | null
  }
  ```
- 201 (idempotent replay):
  ```json
  {"message":"Esta compra ya estaba registrada.","purchase_number":"...","access_token":null,"idempotent_replay":true,"orders":[...],"house_payment":{...}}
  ```
- 409: `"La clave de idempotencia ya se usó con otro carrito."`
- 422: `"La clave Idempotency-Key no es válida."` o stock insuficiente.
- 429: throttle.

**`GET /api/checkout/payment-instructions/{orderNumber}?email=`** (P)
- 200: `{order_number, payment_status, payment_method, total, payment_due_at, payment_instructions, payment_proof_url, payment_proof_submitted_at, payment_rejection_reason, demo_mode}`.
- 404 si email no coincide.

**`POST /api/checkout/orders/{orderNumber}/payment-proof`** (P*, throttle `checkout`)
- Body multipart: `email` (string), `proof` (file: jpg/jpeg/png/pdf/webp, max 8192 KB).
- 200: `{message, payment_status:"proof_submitted", payment_proof_url:<signed 30min>}`.
- 413: error 413 custom.
- 422 si status ∉ {pending, rejected} o `payment_method` no empieza con `supplier_`.

### 3.7 Pedidos del cliente

**`GET /api/orders`** (S)
- 200: paginación Laravel. `per_page=10` hardcoded.
- Item: `{id, order_number, status, payment_status, payment_method, segment, total, items_count, created_at, tracking:{carrier, number, timeline:[{key,label,completed,current}]}, supplier_rating:{can_rate, has_rated, rating|null}}`.

**`GET /api/orders/{orderNumber}`** (S)
- 200: incluye lista adicional de `items:[{product_name, size, color, quantity, unit_price, total_price}]`, `shipping_address:{street, city, state, zip, neighborhood}`, `subtotal`, `shipping_cost`, `discount_amount`, `coupon_code`, `payment_due_at`, `payment_instructions`.
- 404 si no existe o el user_id no coincide.

**`POST /api/orders/{orderNumber}/rating`** (S)
- Body: `{rating: 1..5, comment?: string (≤500)}`.
- 201: `{message, rating, supplier_rating}`.
- 422 si: order no calificable, ventana >30d, re-edita >7d, comment con `@|mailto:|whatsapp|tel:|http://|https://`.

**`GET /api/return-requests`** (S)
- 200: paginación Laravel. Items via ReturnRequestService.
- Per_page default 20.

**`POST /api/orders/{orderNumber}/returns`** (S)
- Body: `{reason (≤255), description? (≤2000)}`.
- 201: `{message:"Solicitud de devolución registrada", data: ReturnRequestDto}`.

**`POST /api/orders/{orderNumber}/cancellations`** (S)
- Body: igual a returns.
- 201: `{message, applied:true|false, data}`.
- Lógica: si `status ∈ {pending, paid}` → aplica inmediato. Si `confirmed|preparing|awaiting_supplier_confirmation` → solicitud `requested` pendiente.
- 422 si ya cancelled, ya enviado, ya hay cancellation abierta.

### 3.8 Chat

**`GET /api/conversations`** (S)
- 200: `{data:[{order_number, order_status, order_total, order_created_at, last_message:{body, sender_role, created_at, is_mine}|null}]}`. Límite fijo 50 más recientes.

**`GET /api/orders/{orderNumber}/messages`** (S)
- 200: vía `OrderConversationService::getConversation`:
  ```json
  {
    "order_number", "order_id", "status":"open|closed",
    "order_status", "payment_status", "payment_method",
    "viewer_role":"customer|supplier|admin",
    "can_confirm_payment", "can_reject_payment",
    "policy", "messages":[{
      "id", "body", "sender_role", "sender_name",
      "is_mine", "created_at",
      "type":"text|payment_instruction|proof_of_payment|payment_approved|payment_rejected|tracking|system_event",
      "metadata", "attachments":[{id, original_name, mime_type, size, download_url}]
    }]
  }
  ```

**`POST /api/orders/{orderNumber}/messages`** (S)
- Body: `{body (1..2000)}`.
- 201: `{message, data: {id, body, sender_role, type, metadata, created_at}}`.
- 422 si vacío después de trim, o si contiene `@|mailto:|whatsapp|tel:` (case-sensitive).

**`POST /api/orders/{orderNumber}/messages/attachments`** (S)
- Body multipart: `attachment` (file, jpg/jpeg/png/webp/pdf, max 8192 KB), `type?` (default text), `body?` (default "Archivo adjunto.").
- Si `type=proof_of_payment`: actualiza `payment_status=proof_submitted` y limpia `payment_proof_path`.
- 422 si `type=proof_of_payment` y `payment_method` no empieza con `supplier_`.
- 413 si upload excede límite.

**`GET /api/orders/{orderNumber}/attachments/{attachmentId}`** (signed route `private.attachment`)
- Bearer opcional: si está, valida acceso (customer dueño, supplier del pedido, admin). Si no, sólo la firma (10 min).

### 3.9 Notificaciones

**`GET /api/notifications`** (S)
- 200: `{data:[{id, type, title, body, link, read, created_at}], unread_count}`.
- `limit(30)` hardcoded.

**`PATCH /api/notifications/{notification}`** (S)
- 200: `{message:"Marcada como leída"}`. 403 si no es del user.

**`POST /api/notifications/read-all`** (S)
- 200: `{message:"Todas marcadas como leídas"}`.

### 3.10 Cupones

**`GET /api/coupons?email=&q=`** (P)
- 200: `{data:[{id:"api-N", code, issuer:"platform|store", title, description, discountType:"percent|fixed|shipping", value, minSubtotal, segment, storeSlug, storeName, assignedEmails, expiresAt, oneTime, keywords}]}`.

**`POST /api/coupons/validate`** (P, throttle `checkout`)
- Body: `{code, segment, shipping_cost?, customer_email, items:[{variant_id, quantity}]}`.
- 200 (válido): `{valid:true, message:"Cupón aplicado.", coupon, discount_amount, shipping_discount, eligible_subtotal}`.
- 200 (inválido, **siempre 200**): `{valid:false, message:"...", discount_amount:0, ...}`.
- 422 validación body. 429 throttle.

### 3.11 Helpers

**`GET /api/postal-codes/{cp}`** (P)
- 200: `{postal_code, state, state_code, municipality, city, settlements:[{name, type}]}`.
- 404: `"No encontramos colonias para ese código postal. Verifica que sean 5 dígitos válidos en México."`.

**`POST /api/quotes`** (P)
- Body: `{company, contact_name, email, phone?, product?, length_cm?, width_cm?, height_cm?, quantity?, notes?, rfc?}`.
- 201: `{folio:"Q-YYYYMM-XXXXX", status:"nueva"}`.

**`GET /api/suppliers/{supplier}/ratings`** (P)
- 200: paginación Laravel. Solo `status=published`.

---

## 4. Endpoints con comportamiento especial

### 4.1 Endpoint NO consumir desde app móvil (legacy)

- **`POST /api/checkout/charge`** — Sólo 1 supplier por carrito. Reemplazado por `/checkout/request-orders`. **Mobile ignora.**

### 4.2 Endpoints demo-only

- **`POST /api/checkout/demo-order`** — Sólo `local|staging|testing`. 404 en producción.
- **`POST /api/checkout/simulate-payment`** — Sólo si `!OpenPayService::isConfigured()` Y `demo_mode=true`. 403 en producción.

### 4.3 Endpoints webhook

- **`POST /api/webhooks/openpay`** — BasicAuth + throttle webhook (120/min). **NUNCA llamado por la app móvil**; sólo backend OpenPay.

### 4.4 Endpoints con download firmado

- **`GET /api/checkout/orders/{n}/payment-proof-file`** (signed `checkout.proof.download`).
- **`GET /api/orders/{n}/attachments/{a}`** (signed `private.attachment`).

Ambos: 200 stream binario, 401/403 si firma inválida/expirada, 404 si archivo no existe.
