# 📱 Plan: App móvil Ionic Angular para compradores de 101tags

## Lo que ya entendí del backend (no reinventar nada)

El backend Laravel 12 (`/home/user/code/codeweb/101tags.com-/`) ya expone todo lo necesario. Los endpoints viven bajo `/api/*`. **No se crea ningún modelo, migración, controlador ni tabla nueva** — la app consume la API existente.

| Cosa | Decisión |
|---|---|
| Autenticación | Sanctum bearer tokens (`POST /api/auth/customer/login` → `Authorization: Bearer …`) |
| Base API | `http://localhost:8000/api` en dev; la URL prod se inyecta por `environment.ts` |
| Pago | Se consume tal cual: `POST /api/checkout/request-orders` devuelve `payment_instructions` (OXXO/SPEI) o hace cargo OpenPay si el config lo activa. La app sólo muestra lo que la API le mande. |
| Demo | Respetar `APP_DEMO_MODE` para flujo simulado |
| Idioma | es-MX (igual que el storefront) |
| Branding | Rojo `#E31E24`, negro `#0a0a0a`, gris `#F5F5F5`, fuente Montserrat |

> **Aclaración sobre "la compra se hace por chat":** la compra **NO** se hace por chat. El chat (`OrderMessage`) es **post-venta** (subir comprobante, hablar con el proveedor/admin tras generar la orden). La compra real es carrito → checkout → pago.

---

## Stack

- **Ionic 7 + Angular 17** standalone components (signals + `inject()`, sin NgModules)
- **Capacitor 6** para iOS + Android nativos (Keychain, Camera, Push, App, Preferences, Share, StatusBar, SplashScreen)
- **TailwindCSS** (mismo look que el storefront web)
- **HttpClient** de Angular con interceptor para el bearer token
- **@ionic/storage** o **Capacitor Preferences** (seguro en nativo)
- Sin Pinia (Angular usa **signals** para estado)

---

## Estructura del proyecto

Carpeta nueva al lado del storefront (actualmente llamada `101tags/`, este plan mantiene la referencia original `mobile/`):

```
mobile/                          ← workspace Ionic
├── package.json
├── ionic.config.json
├── capacitor.config.ts
├── angular.json
├── tsconfig.json
├── tailwind.config.js
├── src/
│   ├── main.ts
│   ├── index.html
│   ├── app/
│   │   ├── app.component.ts            (router outlet)
│   │   ├── app.routes.ts               (rutas con lazy loading)
│   │   ├── app.config.ts               (provideIonicAngular, provideHttpClient, provideRouter)
│   │   ├── core/
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts (inyecta Bearer)
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts      (wrapper genérico HTTP)
│   │   │   │   ├── auth.service.ts     (login/register/logout/me)
│   │   │   │   ├── catalog.service.ts  (categorías, productos, filtros)
│   │   │   │   ├── cart.service.ts     (signal-based, sync con /api/cart)
│   │   │   │   ├── checkout.service.ts (request-orders, payment-instructions)
│   │   │   │   ├── orders.service.ts   (historial, detalle, rating)
│   │   │   │   ├── returns.service.ts
│   │   │   │   ├── coupons.service.ts
│   │   │   │   ├── notifications.service.ts
│   │   │   │   ├── messages.service.ts (chat de orden)
│   │   │   │   └── storage.service.ts  (Preferences wrapper)
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── guest.guard.ts
│   │   │   └── models/                 (interfaces TS espejo exacto de tipos del storefront)
│   │   │       ├── product.model.ts
│   │   │       ├── category.model.ts
│   │   │       ├── cart.model.ts
│   │   │       ├── order.model.ts
│   │   │       ├── user.model.ts
│   │   │       └── ...
│   │   ├── shared/
│   │   │   ├── components/             (product-card, mini-cart, address-form, payment-proof-uploader, qty-stepper)
│   │   │   ├── pipes/                  (mxn currency, image-url)
│   │   │   └── directives/             (segment-accent)
│   │   └── pages/
│   │       ├── auth/
│   │       │   ├── login/
│   │       │   ├── register/
│   │       │   ├── forgot-password/
│   │       │   └── reset-password/
│   │       ├── home/                   (HomeView equivalente)
│   │       ├── catalog/
│   │       │   ├── category-list/
│   │       │   ├── product-list/       (con FilterSheet móvil)
│   │       │   └── product-detail/     (variantes color/talla, galería)
│   │       ├── cart/                   (carrito unificado)
│   │       ├── checkout/
│   │       │   ├── checkout/           (address, método pago, resumen)
│   │       │   └── payment-pending/    (OXXO/SPEI barcode + subir comprobante)
│   │       ├── account/
│   │       │   ├── profile/
│   │       │   ├── orders/             (historial)
│   │       │   ├── order-detail/       (tracking, chat, cancelar, calificar)
│   │       │   ├── returns/
│   │       │   ├── coupons/
│   │       │   └── notifications/
│   │       ├── order-chat/             (modal/sheet por orden)
│   │       └── static/                 (términos, privacidad, ayuda)
│   ├── theme/
│   │   └── variables.scss             (--ion-color-primary = #E31E24)
│   └── environments/
│       ├── environment.ts              (apiBaseUrl: '/api' en dev con proxy)
│       └── environment.prod.ts
├── ios/
└── android/
```

---

## Mapeo API → Pantalla (consumiendo lo existente)

| Pantalla | Endpoints usados |
|---|---|
| Login / Registro / Forgot / Reset | `POST /api/auth/customer/{login,register,forgot-password,reset-password}` |
| Home | `GET /api/home-content?placement=hero`, `GET /api/catalog/sponsored-ads`, `GET /api/catalog/categories?segment=basicos`, `GET /api/banners` |
| Categoría | `GET /api/catalog/categories?segment=basicos&parent=X`, `GET /api/catalog/filters` |
| Lista producto | `GET /api/catalog/products?…` (paginado) |
| Detalle producto | `GET /api/catalog/products/{slug}`, `GET /api/suppliers/{id}/ratings` |
| Carrito | `GET /api/cart`, `PUT /api/cart/items`, `DELETE /api/cart/items/{variantId}` |
| Checkout config | `GET /api/checkout/config` |
| Checkout submit | `POST /api/checkout/request-orders` (con `Idempotency-Key`) |
| Pago pendiente | `GET /api/checkout/payment-instructions/{order}?email=…`, `POST /api/checkout/orders/{order}/payment-proof` (multipart) |
| Mis pedidos | `GET /api/orders`, `GET /api/orders/{orderNumber}` |
| Calificar | `POST /api/orders/{orderNumber}/rating` |
| Devolución / Cancelación | `POST /api/orders/{orderNumber}/returns`, `/cancellations`, `GET /api/return-requests` |
| Chat de orden | `GET /api/conversations`, `GET /api/orders/{order}/messages`, `POST /api/orders/{order}/messages`, `POST /api/orders/{order}/messages/attachments` (multipart, incluye `type=proof_of_payment`) |
| Cupones | `GET /api/coupons?email=`, `POST /api/coupons/validate` |
| Notificaciones | `GET /api/notifications`, `PATCH /api/notifications/{id}`, `POST /api/notifications/read-all` |
| Cuenta | `GET /api/auth/customer/me`, `POST /api/auth/customer/logout` |

---

## Pantallas del MVP (Básicos solamente)

1. **Splash** → si hay token válido entra, sino login
2. **Login** + tab **Registro** (mismo formulario con switch)
3. **Forgot Password** → `forgot-password` → email con link
4. **Reset Password** (lee `?token=&email=` desde deep link o input manual)
5. **Tabs (4):**
   - 🏠 **Inicio** — hero + categorías + featured
   - 🛍️ **Catálogo** — categorías + filtros (modal sheet móvil)
   - 🛒 **Carrito** — con badge en tab
   - 👤 **Cuenta**
6. **Detalle producto** (variantes color/talla, galería swipe, stock, agregar al carrito)
7. **Checkout** (3 pasos: dirección → envío → pago)
8. **Pago pendiente** (código de barras OXXO / CLABE SPEI + subir comprobante)
9. **Mis pedidos** (lista con status chip)
10. **Detalle pedido** (timeline, items, total, tracking carrier/number, acciones: cancelar, devolver, calificar, **chat**)
11. **Chat de pedido** (bottom sheet con polling cada 5s como el web)
12. **Cupones** (wallet + browse)
13. **Devoluciones** (lista + nueva solicitud)
14. **Notificaciones**
15. **Estáticas** (términos, privacidad, ayuda)
16. **Settings** (cerrar sesión, datos de contacto)

---

## Decisiones clave

| Tema | Decisión |
|---|---|
| Storage del token | _A definir en spec de Auth (recomendado: Capacitor Preferences con `secure: true` — Keychain iOS / Keystore Android)_ |
| Refresh de token | _A definir — Sanctum expira a 30 días; en 401 → forzar logout al Login_ |
| Guest checkout | _A definir — la API lo permite: `POST /api/checkout/request-orders` sin token; el email se pide en el formulario_ |
| Imágenes | _A definir — `<img [src]="resolveStorageUrl(image)">` reutilizando `utils/media.ts` del web (mismo backend sirve `/storage/{path}`)_ |
| Variantes | _A definir — Stepper color → stepper talla. Sin stock → deshabilitado_ |
| Cantidad | _A definir — Stepper nativo Ionic; valida contra `variant.stock`_ |
| Idempotencia checkout | _A definir — UUID v4 cliente → header `Idempotency-Key`_ |
| OpenPay | _A definir — cargar JS sólo si `checkout.config.openpay_enabled`; tarjeta usa `createCardToken`_ |
| Chat polling | _A definir — `interval(5000)` con `takeUntil(destroyed)`; pausa al salir de pantalla_ |
| Push notifications | _A definir — fuera del MVP, sólo in-app vía `/api/notifications`_ |
| Multi-idioma | Sólo es-MX en MVP |
| Modo oscuro | Igual que web: sigue `prefers-color-scheme` |

> Las decisiones marcadas como _A definir_ deben resolverse en la spec SDD de cada feature antes de la implementación.

---

## Theming

`src/theme/variables.scss`:

```scss
:root {
  --ion-color-primary: #E31E24;
  --ion-color-primary-shade: #b91c1c;
  --ion-color-primary-tint: #e84549;
  --ion-color-dark: #0a0a0a;
  --ion-color-medium: #F5F5F5;
  --ion-font-family: 'Montserrat', sans-serif;
}
```

`capacitor.config.ts`:

- `appId`: `com.101tags.comprador`
- `appName`: `101tags`
- Splash con logo
- StatusBar color `#E31E24`

---

## Fases de implementación (orden de ejecución)

### Fase 0 — Setup (~30 min)
- `npm i -g @ionic/cli` → `ionic start mobile blank --type=angular --capacitor`
- `ionic cap add ios` y `ionic cap add android`
- Configurar Tailwind, environments, theme, capacitor.config.ts
- Crear estructura de carpetas y modelos TS espejo de los tipos del web

### Fase 1 — Auth + navegación (~1 día)
- Storage service, auth interceptor, login/register/forgot/reset
- Guards, tabs shell, navegación condicional

### Fase 2 — Catálogo + producto (~1.5 días)
- Home con banners y categorías
- Lista con filtros (FilterSheet modal)
- Detalle con variantes

### Fase 3 — Carrito + Checkout (~1.5 días)
- Cart service signal-based con sync a `/api/cart`
- Checkout 3 pasos
- Pantalla de pago con instrucciones + upload de comprobante

### Fase 4 — Post-compra (~1 día)
- Mis pedidos, detalle con timeline
- Devoluciones / cancelaciones
- Calificar proveedor

### Fase 5 — Chat de orden + notificaciones (~1 día)
- Bottom sheet chat con polling
- Lista de notificaciones + marcar leído

### Fase 6 — Cuenta + cupones + estáticas (~0.5 día)
- Perfil, cupones wallet, términos/privacidad/ayuda

### Fase 7 — Build nativo + QA (~1 día)
- `ionic build`, `ionic cap sync`
- Configurar Xcode/Android Studio, signing
- Probar deep links de password reset
- Probar flujo guest

**Total estimado MVP: ~7 días de desarrollo**

---

## Próximos pasos sugeridos

1. Crear spec SDD para **Fase 0 (Setup)** en `/101tags/.spec/00-ionic-scaffold.md` con BDD asociado.
2. Marcar spec como `APPROVED` antes de ejecutar `ionic start`.
3. Continuar Fase 1 con su propia spec SDD/BDD.
4. Repetir para cada fase.

> Recordá: cualquier trabajo arranca con **DISCOVERY → SDD → BDD → TDD RED → TDD GREEN → REFACTOR → VERIFICATION** (ver `.agent/WORKFLOW.md`).
