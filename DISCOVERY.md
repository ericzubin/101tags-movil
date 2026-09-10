# DISCOVERY — Hallazgos, decisiones y notas técnicas de 101tags mobile

Documento vivo. La fuente de verdad está en el repo:

- `PLAN.md` = plan maestro estable.
- `TASKS.md` = backlog ejecutable.
- `.spec/*.md` = contrato técnico por tarea.
- `STATE.md` = estado actual/relevo.
- `DISCOVERY.md` = memoria técnica consolidada de hallazgos y decisiones de investigación.

---

## §PIVOTE (Sept 2026) — Ionic+Angular+Cap → React Native+Expo SDK 57

Tras merge de M0.1-M0.4 con stack **Ionic 9 + Angular 22 + Capacitor 8** (commits 35822a7, ff1a808, 8925bea, 3157993 en `main`), el usuario pivotó a **React Native 0.86 + Expo SDK 57**. Motivos registrados:

1. **Reutilización futura de código React del equipo** (no materializado al momento del pivote — argumento prospectivo).
2. **Tooling más moderno**: expo-router file-based routing (en lugar de Angular Router), EAS Build en la nube (en lugar de Xcode local), OTA updates vía EAS Update.
3. **Mismas garantías de no-obsolecencia**: ENMIENDA MAYOR de M0.3 ya había actualizado Ionic/Angular/Cap a versiones vigentes; pivoteado a Expo SDK 57 (Sept 2026) que es la versión actual.

### Tradeoffs explícitos

| Aspecto | Ionic+Angular+Cap (descartado) | RN+Expo 57 (nuevo) |
|---|---|---|
| Lenguaje | TypeScript 6 | TypeScript 5.9.3 (TS 6 también funciona; opted por estabilidad) |
| Estilos | Tailwind 4 CSS-first + Ionic CSS | Nativewind v4 + Tailwind 3.4 (Nativewind v5/Tailwind 4 pre-release) |
| Estado | Angular signals + RxJS | Zustand 5 + TanStack Query 5 |
| Secure storage | `@aparajita/capacitor-secure-storage` (community) | `expo-secure-store` (built-in Expo) |
| Build local | Sí (Xcode + Android Studio) | No — EAS Build cloud |
| Test runner | Vitest 4 (rápido) | Jest 29 + jest-expo (más lento pero estable con expo-router) |
| OTA updates | No | Sí (EAS Update) |

### Coste hundido

- M0.1 (auditoría backend): **NO perdido** — agnóstico al stack, conservado.
- M0.2 (spec scaffold): **descartado** — sustituido por `.spec/00-rn-expo-scaffold.md`.
- M0.3 (matriz versiones): **descartado** — sustituido por versión RN+Expo.
- M0.4 (scaffold ejecutable): **descartado** — `git rm -r src/ ios/ android/` + configs Angular/Ionic/Cap.

Tiempo invertido en pivotar: ~2h (research + scaffolding + verificación). Tiempo ahorrado a futuro: evita lock-in a Angular + primera fuga de TypeScript 6 con RN.

### Specs que ya no aplican

- `.spec/00-ionic-scaffold.md` (M0.2 APPROVED Ionic) — borrado del worktree, en git history.
- `.spec/2026-09-09-m0-3-validar-versiones.md` (M0.3 APPROVED Ionic) — contenido reemplazado.
- `.spec/2026-09-09-m0-4-workspace-ionic.md` (M0.4 DONE Ionic) — borrado del worktree, en git history.

### Specs que se conservan

- `.spec/2026-09-09-m0-1-auditar-contratos.md` (DONE) — backend audit, agnóstico.
- `docs/audit/*.md` (DONE) — backend audit docs, agnóstico.

### Riesgos identificados durante el pivote

1. **TS 6 vs TS 5.9**: el template Expo SDK 57 default incluye TS 6.0.3; opted por TS 5.9.3 por madurez probada. Upgrade trivial cuando se justifique.
2. **`expo-secure-store` en web/jsdom**: `isAvailableAsync()===false`. Wrapper retorna `null` + warning (no throw) — el comportamiento es coherente con que en web NO hay credenciales.
3. **Jest 29 vs Vitest 4**: tradeoff en velocidad. Documentado en spec. Migración futura posible vía `vitest` + `@vitest/coverage-v8` cuando el ecosistema madure.
4. **EAS Build = nube**: builds locales requieren Xcode/Android SDK. Tradeoff aceptado por simplicidad operativa.
5. **New Architecture default ON (Fabric + TurboModules)**: si surge incompatibilidad con algún paquete legacy, flag `--no-new-arch` al prebuild.
6. **Prebuild regenera `ios/` y `android/`**: NO commitearlos al repo. Workflow: regenerar con `expo prebuild` cuando cambien dependencias nativas o app.json.

---

## §1. Estado inicial del repositorio (histórico)

- No existía scaffold móvil real.
- No existían `app/`, `ios/`, `android/` funcionales.
- `package.json` era un placeholder con scripts pendientes.
- No había tests ni baseline de calidad.
- No había spec activa.
- Sí existían reglas de agentes, workflow SDD/BDD/TDD y plantilla de specs.

(Sustituido por el pivote. La sección §1 se conserva como registro histórico.)

---

## §2. Fuente de verdad del backend

- Repositorio: `/home/user/code/codeweb/101tags.com-/`
- Stack: Laravel 12, PHP 8.3.
- DB: SQLite `database/database.sqlite`.
- Autenticación: Laravel Sanctum (bearer tokens, role: `customer`).
- API: `/api/*` (prefijo automático Laravel).
- Frontend web: Vue 3 (`storefront/`) que consume la misma API.
- App móvil (RN+Expo): mismo backend.

### Estructura backend clave

- `routes/api.php` (281 líneas) — fuente primaria de contratos.
- `app/Http/Controllers/Api/` — implementación.
- `app/Services/PurchaseOrderService.php` — mediación órdenes.
- `app/Providers/AppServiceProvider.php` — throttle + Sanctum.
- `config/{101tags.php,cors.php}` — config dominio.
- `database/database.sqlite` — DB dev (cuidado con secretos).

### Convenciones backend

- Bearer token: `Authorization: Bearer <sanctum-token>`.
- Token name: `customer-token` (no `auth-token`).
- Idempotency-Key header: requerido en `POST /api/checkout/request-orders` (`^[A-Za-z0-9._:-]{8,100}$`).
- Throttles: `auth` (5/min email + 20/min ip), `checkout` (10/min + 30/min ip), `webhook` (120/min).
- Paginación: LengthAwarePaginator, sin cursor.
- Errores Laravel estándar: `{message, errors}`.

---

## §3. Contratos backend ya confirmados

Detalle en `docs/audit/audit-1-api-contracts.md`. Resumen:

### Autenticación
- `POST /api/auth/customer/register`
- `POST /api/auth/customer/login`
- `POST /api/auth/customer/forgot-password`
- `POST /api/auth/customer/reset-password`
- `GET /api/auth/customer/me` (S)
- `POST /api/auth/customer/logout` (S)

### Catálogo (F2)
- `GET /api/home-content?placement=...`
- `GET /api/banners`
- `GET /api/footer`, `GET /api/policies`
- `GET /api/catalog/categories?segment=...`
- `GET /api/catalog/products?...`
- `GET /api/catalog/products/{slug}`
- `GET /api/catalog/filters?...`
- `GET /api/catalog/stores?...`

### Servicios (segmento servicios)
- `GET /api/services`, `GET /api/services/{slug}`, etc.

### Carrito
- `GET /api/cart` (S)
- `POST /api/cart/sync` (S)
- `PUT /api/cart/items` (S)
- `DELETE /api/cart/items/{variantId}` (S)

### Checkout
- `GET /api/checkout/config` (P)
- `POST /api/checkout/request-orders` (con Idempotency-Key)

### Notificaciones
- `GET /api/notifications`
- `PATCH /api/notifications/{notification}`
- `POST /api/notifications/read-all`

### Chat / post-compra
- Conversaciones por orden.
- Mensajes por orden.
- Upload de adjuntos por orden.

### Ratings, returns, coupons
- Backend ya soporta; detalles en audit-1.

---

## §4. Aclaración funcional importante: compra vs chat

La compra es contra pedido (no instantánea). El chat por orden es para mediar entre cliente y proveedor sobre pago + envío + entrega.

Implicaciones:
- Cliente coloca pedido via `/checkout/request-orders` con Idempotency-Key.
- Backend crea orden con `payment_status: pending`, devuelve `payment_instructions` (OXXO/SPEI/manual).
- Cliente sube comprobante o confirma pago → `payment_status: paid`.
- Proveedor acepta y envía → `status: shipped`.
- Chat por orden es para tracking, mediación, problemas.

---

## §5. Seguridad del token — corrección técnica (pivote aplicado)

> `AsyncStorage` o `localStorage` no deben considerarse equivalentes a Keychain/Keystore cifrado para guardar el bearer token.

Decisión:
- El token Sanctum debe persistirse mediante `expo-secure-store` (built-in Expo SDK 57).
  - iOS: Keychain (`kSecClassGenericPassword`).
  - Android: AES-256-GCM via Android Keystore + SharedPreferences.
  - Web: `isAvailableAsync()===false` → wrapper retorna null + warning.
- `AsyncStorage` queda SOLO para información no sensible (carrito local, preferences UI).
- La dependencia `expo-secure-store` ya está justificada (built-in Expo, no requiere aprobación adicional).
- No loggear token/password.
- Logout debe eliminar credenciales locales vía `secureClearAuth()`.
- No guardar datos de tarjeta.

Reflejado en `AGENTS.md §Token Sanctum`.

---

## §6. Gate de versiones antes del scaffold (M0.3-PIVOT)

La intención original era Ionic 7 + Angular 17 + Cap 6 + Tailwind + pnpm. El pivote lockeó:

**Stack RN+Expo SDK 57 (Sept 2026)**:
- React Native 0.86.3, Expo SDK 57.0.21, React 19.2.3
- TypeScript 5.9.3 (TS 6 también funciona; opted por 5.9.x)
- expo-router 57.0.20 (file-based, sustituye React Navigation)
- expo-secure-store 57.0.3 (built-in)
- Nativewind 4.2.6 + Tailwind 3.4.17 (Nativewind v5/Tailwind 4 pre-release)
- Zustand 5.0.4 + @tanstack/react-query 5.102.8
- Jest 29.7.0 + jest-expo 57.0.2 (Vitest experimental con expo-router)
- ESLint 9.39.0 + eslint-config-expo 9.1.0 (FlatCompat)
- Prettier 3.6.2
- pnpm 10.32.1, Node 24 LTS

**Native (gestionado por expo prebuild)**:
- iOS deployment target: 15.1 (default 16.4 para react-native)
- Android compileSdk/targetSdk: 36, minSdk: 24
- App ID: `mx.com.tags.movil` (iOS bundleId + Android namespace/applicationId)
- Hermes + New Architecture default ON
- EAS Build 24.0.0 (cloud)

Ver `.spec/2026-09-09-m0-3-validar-versiones.md` para la matriz completa con justificaciones.

---

## §7. Idempotencia y operaciones sensibles

`request-orders` ya soporta/usa `Idempotency-Key`.

Implicaciones para móvil:
- Un intento lógico de checkout debe conservar un UUID estable mientras se reintenta el mismo submit.
- Un timeout no debe provocar automáticamente una orden duplicada.
- El cliente no debe mostrar éxito si el backend no confirmó resultado.
- Reintentos de uploads o pagos también deben diseñarse para evitar duplicados involuntarios.

---

## §8. Guest checkout

El plan original contempla guest checkout porque el backend puede permitir flujo sin sesión en determinados contratos.

Todavía debe cerrarse en spec:
- UX exacta.
- cómo recuperar/consultar pedido guest.
- qué acciones post-compra requieren vincular cuenta.
- tratamiento del email.
- seguridad de enlaces/tokens guest.

No eliminarlo ni implementarlo por inercia hasta cerrar esta decisión.

---

## §9. OpenPay

OpenPay debe considerarse una integración condicionada por configuración backend.

Reglas:
- La UI de tarjeta sólo se muestra si `/checkout/config` la habilita.
- Nunca guardar PAN/CVV.
- No loggear datos sensibles.
- Para RN/Expo: usar `@openpay/sdk-react-native` o react-native-openpay si se requiere SDK nativo.
- Validar que la estrategia del storefront basada en JS sea adecuada dentro del contexto móvil/WebView.
- Si requiere una estrategia móvil distinta, documentarla primero en spec.
- OXXO/SPEI deben mostrar exactamente las instrucciones que entregue la API.

---

## §10. Catálogo y media

Aspectos a conservar en specs:
- `segment=basicos` como alcance del MVP.
- resolver media URLs de forma centralizada.
- no duplicar productos al paginar.
- cancelar/ignorar requests obsoletos al cambiar filtros rápido.
- variantes válidas color/talla/stock deben derivarse del contrato real.
- la cantidad nunca debe superar stock disponible.

---

## §11. Carrito

Decisiones de diseño:
- Zustand store para estado local de UI (compatible con persistencia).
- TanStack Query para fetching server-side.
- La API sigue siendo autoridad.

---

## §12. M1.3 — cambios mínimos inevitables documentados

Para M1.3 (UX polish login/register) la spec `.spec/2026-09-09-m1-3-login-register-ux.md` declara como "no tocar" `src/core/services/*`, pero con la salvedad `sauf cambio mínimo inevitable documentado`. Para que la i18n map (`RATE_LIMITED`, `SERVER_ERROR`) sea alcanzable end-to-end, se documentan los siguientes cambios mínimos en `src/core/services/auth-service.ts`:

- `if (err.status === 429) return new AuthError('RATE_LIMITED', ...)` — antes caía a `UNKNOWN`.
- `if (err.status >= 500 && err.status <= 599) return new AuthError('SERVER_ERROR', ...)` — antes caía a `UNKNOWN`.

Ningún otro método o flujo de `auth-service.ts` fue alterado. `auth-service.spec.ts` (21 tests) sigue verde sin cambios. Adicionalmente:

- `src/core/models/auth.ts`: añadido `fields?: Record<string, string[]>` (alias junto a `details: Record<string, string[]>` para no romper M1.1) y los nuevos códigos `RATE_LIMITED` y `SERVER_ERROR` requeridos por el contrato del spec. `TOKEN_EXPIRED` se mantiene para no romper el consumidor 401. `auth.spec.ts` (7 tests) sigue verde sin cambios.
- `src/app/(auth)/login.tsx`, `src/app/(auth)/register.tsx`: reescritos con validación cliente, loading, error mapping, auto-focus y a11y. Aceptados por el spec como "Modificar".
