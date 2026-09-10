# Audit C — Peculiaridades del backend Laravel

**Generado:** 2026-09-09 (subagente explore)
**Fuentes:** controllers, services, config, migrations, tests de `101tags.com-`

> Top 5 en `DISCOVERY.md §4`. Aquí las 12 peculiaridades completas con cita `file:line`.

---

## 1. Modo Demo (`APP_DEMO_MODE`)

**Definición:** `config/101tags.php:11` → `'demo_mode' => env('APP_DEMO_MODE', false)`.

**Comportamiento:**
- `CheckoutController::config` (líneas 38-79):
  - `house_payment_available = $configured || $demo` (línea 45).
  - `payment_methods.card` siempre `false` para供应商 externos; `oxxo` y `spei` siempre `true` (líneas 59-63).
- Sin OpenPay + `payment_method=card` para house → genera `openpay_charge_id='demo_<12chars>'` y marca pagada de inmediato (`CheckoutController.php:292-296`).
- OXXO/SPEI genera referencias sintéticas `'DEMO-OXXO-' . Str::random(8)` (líneas 356-360) con `barcode_url` apuntando a `https://api.qrserver.com/v1/create-qr-code/...` (`OpenPayService.php:322`).
- Endpoint dedicado: `POST /api/checkout/demo-order` (sólo `local|staging|testing`); 404 en producción.
- `simulate-payment` (líneas 398-416, `OpenPayWebhookService.php:162-184`): sólo si `OpenPayService::isConfigured()` Y `!demo_mode` son falsos. Útil en dev QA.
- `OpenPayWebhookService::assertAuthorized` (líneas 23-41): sin credenciales + demo_mode → acepta sin auth. En producción queda cerrado con 503.
- Seeders: `DatabaseSeeder.php:17-21` — en demo crea catálogo, productos house, proveedores demo, cupones, cuentas `admin@101tags.com/password` y `cliente@101tags.com/password`.

**Implicación móvil:**
- Banner persistente "Modo demo — los pagos son simulados" cuando `demo_mode === true`.
- `simulate-payment` sólo en builds dev/QA. Variable de compilación.
- No hardcodear las credenciales demo en la app; sólo inyectarlas desde `environment.ts` cuando `APP_DEMO_MODE=true`.

---

## 2. Idempotency-Key en `/api/checkout/request-orders`

**Comportamiento:**
- Lectura header en controller, no middleware: `CheckoutController.php:159-187`.
- Regex: `/^[A-Za-z0-9._:-]{8,100}$/`. Si no cumple → 422.
- Header es **opcional**.
- Fingerprint = SHA256 de `{items ordenados, email-lowercase, coupon-uppercase, house_payment_method}`.
- Misma key + mismo fingerprint → replay (201 con `idempotent_replay:true`, `access_token:null`).
- Misma key + fingerprint distinto → 409.
- Modelo `Purchase` (`app/Models/Purchase.php`): campos `idempotency_key` (UNIQUE 100), `idempotency_fingerprint` (64).
- Tests: `tests/Feature/Api/ProductionHardeningTest.php:62-110`.

**Implicación móvil:**
- Generar UUID v4 estable por "intento de checkout del usuario" (no por HTTP call).
- Persistir en `Preferences` o state de wizard de checkout.
- Setear **siempre** `Idempotency-Key: <uuid>` en `POST /api/checkout/request-orders`.
- 409 explícito: regenerar la clave o pedir confirmación.
- `access_token:null` en replay → confiar en `purchase_number` local.
- **No** usar `access_token` del replay (viene null).

---

## 3. OpenPay en Checkout

**Comportamiento:**
- `GET /api/checkout/config` devuelve `openpay_enabled`, `supplier_openpay_enabled`, `platform_openpay_enabled`, `platform_openpay_public_key`, `platform_openpay_merchant_id`, `house_payment_*`.
- **Card siempre `false` para proveedores externos**. Solo house/marca propia.
- `CheckoutController.php:154-155`: valida solo `source_id` y `device_session_id` (NO PAN/CVV).
- Webhook `POST /api/webhooks/openpay` (BasicAuth) throttle 120/min.
- País: MX. Sandbox default.

**Implicación móvil:**
- Integrar OpenPay SDK Android+iOS nativo.
- NO usar WebView (PCI).
- UI de tarjeta solo si `platform_openpay_enabled === true` o `demo_mode === true`.
- Renderizar `payment_instructions.reference`, `barcode_url`, `clabe`, `bank`, `due_at` cuando son OXXO/SPEI.
- Persistir `payment_due_at` para mostrar countdown.

**Decisión pujada a M3.6 spec (D-OPENPAY-NATIVE):**
- SDK nativo vs in-app browser al storefront vs diferir tarjeta house a v2.
- **Antes de codear** M3.6, la spec debe documentar la elección.

---

## 4. Sanctum y Expiración

**Comportamiento:**
- `config/sanctum.php:53`: `'expiration' => (int) env('SANCTUM_EXPIRATION_MINUTES', 43200)` → 30 días.
- `CustomerAuthController.php:40, 72`: `$user->createToken('customer-token')->plainTextToken`. Sin abilities (por defecto `['*']`).
- `CustomerAuthController.php:70-72`: **cada login borra todos los `customer-token` previos del mismo user**.
- Logout: solo borra `currentAccessToken()` (`CustomerAuthController.php:82`).
- `PasswordResetService.php:61`: reset también borra todos los tokens.
- `bootstrap/app.php:38`: `sanctum:prune-expired --hours=48` diario.

**Implicación móvil:**
- Token en `Capacitor Preferences secure: true` (Keychain iOS / Keystore Android).
- 1 device activo por user.
- Refresh: no hay refresh token. Planear aviso al usuario cerca del día 25.
- 401 → logout limpio + re-login.
- Roles admin/supplier: endpoints distintos, no mezclar.

---

## 5. Throttling / Rate Limiting

**Comportamiento:** `AppServiceProvider.php:22-57`. En testing son `Limit::none()`.

| Limiter | Endpoints | Límite |
|---|---|---|
| `auth` | login, register, forgot, reset customer (también admin login) | 5/min por email+ip, 20/min por ip |
| `checkout` | charge, request-orders, demo-order, simulate-payment, payment-proof, coupons/validate, supplier register, parse-csf | 10/min por user/email, 30/min por ip |
| `webhook` | `webhooks/openpay` | 120/min por ip |

**Implicación móvil:**
- Deshabilitar botón después de 422/429 con countdown.
- Checkout no disparar en paralelo (idempotency-key ayuda pero throttle 10/min).
- Catálogo sin throttle.

---

## 6. Anti-XSS / Sanitización en Chat

**Comportamiento:**
- `OrderMessageController.php:38-40`: validación estándar `body: required|string|min:1|max:2000`. Sin `strip_tags` / HTMLPurifier.
- `OrderConversationService.php:78-85`: blacklist literal case-sensitive de `@`, `mailto:`, `whatsapp`, `tel:` (también `http://`/`https://` en `SupplierRatingService.php`).
- 422 si match: `"Por seguridad no puedes compartir correos, teléfonos ni enlaces de contacto externo. Usa solo este chat."`
- Almacena el body tal cual. **App cliente debe escapar HTML al renderizar.**
- Adjuntos: `'attachment' => ['required','file','mimes:jpg,jpeg,png,webp,pdf','max:8192']` (`OrderMessageController.php:61`).

**Implicación móvil:**
- Filtro idéntico en cliente antes de enviar (ahorra round-trip).
- Angular `{{message.body}}` con escape HTML nativo; nunca `[innerHTML]`.
- Mostrar proactivamente la regla antes de tipear.
- Adjuntos: ≤8 MB, mime `image/*|application/pdf`. Preview sólo imágenes.

---

## 7. Guest Checkout y Claim-Guest

**Comportamiento:**
- No existe `?guest_email=`. La diferencia guest/auth se infiere por presencia de bearer token (controller `resolveCheckoutUserId` en `CheckoutController.php:751-767`).
- `access_token` se genera SIEMPRE en `requestOrders` exitoso (`PurchaseOrderService.php:73`).
- Token = `Str::random(64)` plain text + `hash('sha256', $token)` en `purchases.guest_access_token_hash`.
- Devuelto **solo en la primera respuesta**, NO en replay (`CheckoutController.php:249`).
- `GET /api/guest/purchases/{token}`: recuperar compra por token 64 chars.
- `POST /api/purchases/claim-guest` (S): body `{guest_token}`, reclamar compra.
- Linking auto por email en register/login: `GuestOrderLinkService.php:13-23`.

**Implicación móvil:**
- Persistir `access_token` con `secure:true` INMEDIATAMENTE tras 201.
- Mostrar "Mis pedidos" en sesión guest vía `/api/guest/purchases/{token}`.
- Tras register/login llamar `claim-guest` explícito para asegurar linkage.
- Logout NO afecta al guest token (es independiente).

---

## 8. Idempotencia en Upload de Comprobante

**Comportamiento:** `OrderPaymentProofController.php:24-63`:
- **Sin header `Idempotency-Key` ni validación de duplicado por fingerprint.**
- Cada POST sobrescribe `payment_proof_path`, `payment_proof_submitted_at` y resetea SLA timers.
- MIME: `jpg,jpeg,png,pdf,webp` max 8192 KB.
- Disco: `config('101tags.proof_disk', 'local')` (privado, default).
- URL firmada: 30 min.
- Solo si `payment_status ∈ {pending, rejected}` y `payment_method` empieza con `supplier_`.
- Vía chat (`POST /orders/{n}/messages/attachments?type=proof_of_payment`): misma función, separado, **borra el `payment_proof_path`**.

**Implicación móvil:**
- Idempotencia en cliente (no backend): flag local `proof_submitted=true` deshabilita reenvío o pide confirmación.
- Decidir endpoint: `/checkout/orders/{n}/payment-proof` o vía chat — son excluyentes.
- Validar antes de subir: ≤8 MB, mime correcto.
- Manejo 413: "demasiado pesado".

---

## 9. Deep Links de Password Reset

**Comportamiento:** `PasswordResetService.php`:
- URL construida: `{STOREFRONT_URL}/restablecer-contrasena?token=X&email=Y` (línea 83-91).
- `config('101tags.storefront_url')` = `http://localhost:5173` por default (`.env:7`).
- **NO** hay scheme nativo configurado en backend. El email siempre apunta al storefront web.
- Reset (`POST /api/auth/customer/reset-password`): valida token (60 min default), `password (≥6)`, `password_confirmation`.
- Tras reset, **todos los `customer-token` del user se eliminan** (`PasswordResetService.php:61`).
- Anti-enumeración: respuesta genérica siempre.

**Implicación móvil:**
- No se puede usar el link del email directamente en nativo (es web).
- Opciones:
  - (a) Pantalla reset en la app: el usuario copia/pega el token del email, o deep-link `com.101tags.comprador://reset?token=X&email=Y` lo intercepta.
  - (b) Backend customiza URL para nativo — **requiere spec que lo justifique y aprobación**.
- Tras reset, el usuario vuelve a login.
- No mostrar promesa de éxito del email (es genérica).

**Decisión pujada a M1.4 spec (D-DEEPLINK-RESET):**
- ¿Scheme nativo o copy/paste manual? Documentar antes de M1.4.

---

## 10. Multipart Uploads y Límites

**Comportamiento:**
- PHP `public/.user.ini`: `upload_max_filesize=12M`, `post_max_size=64M`, `max_file_uploads=20`, `memory_limit=256M`.
- Handler global `PostTooLargeException` (`bootstrap/app.php:44-50`): 413 con mensaje en español.
- MIME/tamaño por endpoint:
  - `OrderPaymentProofController::store`: `mimes:jpg,jpeg,png,pdf,webp`, 8192 KB.
  - `OrderMessageController::storeAttachment`: `mimes:jpg,jpeg,png,webp,pdf`, 8192 KB.
  - Supplier CSF: `mimes:pdf`, `csf_max_size_kb=5120`.
- Disco: `proof_disk=local` (privado), `media_disk=public`.

**Implicación móvil:**
- Comprensión en cliente antes de subir (especialmente HEIC→JPEG).
- Manejo 413 con el mensaje literal del backend.
- Cliente sólo sube en: payment-proof, chat attachments (no fotos de producto).

---

## 11. Paginación y Cursor

**Comportamiento:** Todos offset-based con `->paginate()`. NO hay `cursorPaginate()`. Endpoints buyer paginados:
- `/api/orders` — fijo `per_page=10` (`CustomerOrderController.php:29`).
- `/api/catalog/products` — `per_page=1..48`, default 12.
- `/api/return-requests` — `per_page=20`.
- `/api/suppliers/{id}/ratings` — `per_page=10`.

NO paginados: `/conversations` (límite 50), `/orders/{n}/messages`, `/notifications` (límite 30), `/cart`, `/catalog/categories`.

**Implicación móvil:**
- Infinite scroll basado en `current_page` + `last_page`.
- `/orders` no acepta `per_page` custom.
- `/conversations` no scrollea infinito.

---

## 12. CORS para Nativo vs Web

**Comportamiento:** `config/cors.php:1-24`:
- `allowed_origins` = `[STOREFRONT_URL, APP_URL]`.
- `paths: ['api/*','sanctum/csrf-cookie']`.
- `supports_credentials: true`.

**Implicación móvil:**
- `ionic serve` (web) en `http://localhost:8100` NO está en allowed_origins. **Habrá que agregar**.
- Native build (Capacitor): sin CORS, fetch server-to-server.
- En dev: o agregar origin o usar proxy en `capacitor.config.ts`.

---

## Resumen de riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Backend cambia contrato | M0.6 baseline + tests de smoke |
| `APP_DEMO_MODE` se propaga como feature-flag | Banner persistente en app |
| Token guest perdido entre 201 y persistencia | Persistir `purchase_number` + `access_token` en mismo `set()` atómico |
| OpenPay en WebView rompe | M3.6 spec decide antes de codear |
| Snake/camel mismatch | Mapper genérico + fixtures reales |
| `whatsapp` también bloquea mención legítima | Mostrar regla proactivamente |

---

## Decisiones pendientes (no resueltas por esta auditoría)

- **D-OPENPAY-NATIVE** (cierra M3.6): SDK nativo vs in-app browser al storefront vs diferir tarjeta house.
- **D-DEEPLINK-RESET** (cierra M1.4): scheme nativo vs copy/paste manual.
- **D-PAGINATION-CACHE** (cierra F2): qué endpoints cachear offline con `@capacitor/preferences`.
- **D-MULTI-HOUSE-CART** (cierra M3.2): carrito mixed house+externo.
- **D-NOTIFICATIONS-PUSH**: confirmado NO en MVP, sólo in-app.
