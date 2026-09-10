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

**PIVOTE Sept 2026**: stack lockeado en `.spec/2026-09-09-m0-3-validar-versiones.md` (RN+Expo 57).

- **React Native 0.86.3** + **Expo SDK 57.0.21**.
- **React 19.2.3**.
- **TypeScript 5.9.3** (TS 6 también soporta RN 0.86; opted 5.9.x por estabilidad).
- **expo-router 6** (file-based routing).
- **expo-secure-store 15** (built-in; Keychain iOS + Android Keystore AES-GCM).
- **Nativewind 4** + Tailwind 3.4 (Nativewind v5/Tailwind 4 pre-release).
- **Zustand 5** + **TanStack Query 5**.
- **Jest 29 + jest-expo** (Vitest experimental con expo-router).
- **ESLint 9 + eslint-config-expo** (FlatCompat).
- **pnpm 10**, Node 24 LTS.
- **EAS Build cloud** (sin Xcode/Android SDK local).

Versiones se validaron en M0.3-PIVOT contra requisitos Sept 2026 (Play Store targetSdk 36, App Store iOS 15+).

**Historia** (preservada en git): stack original era Ionic 7 + Angular 17 + Capacitor 6 → actualizado por M0.3 a Ionic 9 + Angular 22 + Cap 8 (ENMIENDA MAYOR) → pivoteado a RN+Expo 57 en M0.4-PIVOT por decisión del usuario.

---

## 4. Seguridad

### Bearer token

Decisión tras pivote a RN+Expo SDK 57:

- `expo-secure-store` (built-in Expo) es la solución obligatoria. iOS = Keychain (`kSecClassGenericPassword`); Android = AES-256-GCM via Android Keystore + SharedPreferences. Web/jsdom = `isAvailableAsync()===false` → wrapper retorna `null` + warning.
- `AsyncStorage` queda SOLO para datos no sensibles (carrito local, preferencias UI).
- El token Sanctum NUNCA se guarda en AsyncStorage, localStorage, ni en texto plano.
- El token nunca se loggea.
- Logout elimina credenciales locales vía `secureClearAuth()` (borra token + user en storage cifrado).
- Justificación documentada en `DISCOVERY.md §5`.

### Otras reglas

- Producción usa HTTPS.
- No almacenar datos de tarjeta (OpenPay M3.6).
- No commitear keystores, certificados, provisioning profiles ni `.env` con secretos.
- `ios/` y `android/` regenerados con `expo prebuild` — NO commitear (igual que el approach de Capacitor).
- El cliente puede validar UX, pero autorización/ownership siguen siendo autoridad del backend.
- Errores 401/403/404/409/422/429/5xx deben distinguirse cuando el contrato lo permita.
- Dependencias nuevas sólo con justificación en spec.

---

## 5. Branding y UX base

- Idioma: `es-MX` hardcoded.
- Primary: `#E31E24`.
- Dark: `#0a0a0a`.
- Gray surface: `#F5F5F5`.
- Fuente: Montserrat.
- Extras (alineados con palette Ionic/Nativewind): success `#2dd36f`, warning `#ffc409`, danger `#eb445a`.
- Modo oscuro: alineado con comportamiento acordado del storefront / `prefers-color-scheme` si la spec lo confirma.
- Loading, empty, offline y error states son parte del comportamiento, no trabajo opcional al final.
- Controles críticos deben tener labels, foco usable, contraste y target táctil razonable.
- Branding tokens centralizados en `src/theme/tokens.ts` (TS) + `tailwind.config.js` (Nativewind utilities).

---

## 6. Arquitectura objetivo

La estructura definitiva se congela durante F0 (M0.4-PIVOT); el objetivo es mantener separación clara entre infraestructura, servicios, shared UI y rutas:

```text
app/                                  ← expo-router file-based
├── _layout.tsx                       (root Stack + Providers + hydration)
├── index.tsx                         (redirect según auth)
├── (tabs)/                           (Bottom tabs)
│   ├── _layout.tsx
│   ├── index.tsx                     (home)
│   ├── catalog.tsx                   (F2)
│   ├── cart.tsx                      (F3)
│   └── account.tsx                   (F6)
└── (auth)/                           (Auth group)
    ├── _layout.tsx
    ├── login.tsx                     (M1.3)
    ├── register.tsx                  (M1.3)
    └── forgot-password.tsx           (M1.4)

src/
├── core/
│   ├── api/                          (HTTP client wrapper — F1)
│   ├── models/                       (TS interfaces — Auth en M1.1; resto F2+)
│   ├── services/                     (auth, storage, etc.)
│   ├── storage/                      (expo-secure-store wrapper — M1.1)
│   └── query/                        (TanStack QueryClient)
├── stores/                           (Zustand: auth, cart)
├── theme/                            (tokens 101tags + tests)
├── constants/                        (env config + tests)
└── components/                       (UI shared)

ios/                                  (regenerable con `expo prebuild`)
android/                              (regenerable con `expo prebuild`)
```

### Servicios / Stores previstos

- `auth-store` (Zustand) + `AuthService` (login/register/me/logout/refresh).
- `cart-store` (Zustand) + `CartService` (sync con backend).
- `catalog-service` (TanStack Query).
- `checkout-service`.
- `orders-service`.
- `chat-service` (polling).
- `notifications-service`.
- `secure-store` wrapper sobre `expo-secure-store`.
- `api-client` (fetch wrapper con bearer + timeout + 401 handling).
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
