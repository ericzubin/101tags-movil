# Spec: Scaffold Ionic/Angular/Capacitor de 101tags mobile

**Status**: APPROVED
**Spec ID**: 2026-09-09-ionic-scaffold
**Author**: ChatGPT / planificación técnica + agente (cierre M0.2)
**Date**: 2026-09-09
**Approved in**: M0.2 (Issue #2)
**Related specs**: ninguna; es la primera spec del proyecto

> Esta spec queda **APPROVED** con las decisiones de F0 cerradas explícitamente más abajo. Las versiones exactas marcadas como `propuesta` están sujetas a la validación de M0.3 antes de ejecutar `ionic start`. Si M0.3 detecta incompatibilidad, la spec se enmienda en esa misma tarea y vuelve a aprobar.

---

## Contexto

`101tags-movil` es un proyecto greenfield. El repositorio contiene reglas, workflow, plan y backlog, pero todavía no existe el workspace Ionic ni las plataformas `ios/` y `android/`.

La aplicación será el cliente móvil para compradores de 101tags y consumirá la API Laravel 12 existente de `101tags.com-`. Esta tarea **no implementa lógica de negocio**: solamente crea una base técnica reproducible y verificable para las siguientes features.

## Problema

Antes de desarrollar Auth, catálogo o checkout se necesita una estructura real con:

- Ionic + Angular standalone.
- Capacitor para iOS/Android.
- Environments y acceso API configurable.
- Theme y Tailwind.
- Baseline de tests, lint, formato, typecheck y build.
- Estructura de carpetas suficiente para que las siguientes specs no improvisen arquitectura.

## Objetivo

Crear un scaffold móvil reproducible, sin secretos y con baseline de calidad verde, listo para empezar la spec de autenticación.

## Fuera de alcance

- Login/registro funcional.
- Catálogo/productos.
- Carrito/checkout/pagos.
- Pedidos/chat/notificaciones.
- Cambios en Laravel, DB o storefront web.
- Push notifications.
- CI/CD de publicación a tiendas, salvo archivos mínimos que el scaffold necesite.

## Arquitectura afectada

Archivos/directorios esperados después de esta tarea:

```text
src/
├── main.ts
├── index.html
├── styles.scss                  ← Tailwind directives + Ionic imports
├── app/
│   ├── app.component.ts         ← router outlet + shell
│   ├── app.config.ts            ← provideIonicAngular, provideRouter, provideHttpClient
│   ├── app.routes.ts            ← rutas con lazy loading
│   ├── core/
│   │   ├── guards/              ← auth.guard.ts, guest.guard.ts (vacíos hasta F1)
│   │   ├── interceptors/        ← auth.interceptor.ts, error.interceptor.ts (vacíos hasta F1)
│   │   ├── models/              ← 17 archivos TS espejo de tipos backend (M0.5)
│   │   └── services/            ← api.service.ts, storage.service.ts, auth.service.ts (M1.x)
│   ├── shared/
│   │   ├── components/          ← product-card, mini-cart, address-form, etc. (F2+)
│   │   ├── directives/          ← segment-accent, etc. (F2+)
│   │   └── pipes/               ← mxn-currency, image-url (F2+)
│   └── pages/                   ← auth/, catalog/, cart/, checkout/, account/, etc. (F1+)
├── theme/
│   └── variables.scss           ← --ion-color-primary=#E31E24, dark, medium, Montserrat
├── environments/
│   ├── environment.ts           ← apiBaseUrl: 'http://localhost:8000/api', production: false
│   └── environment.prod.ts      ← apiBaseUrl placeholder sustituido por CI en build
└── assets/                      ← iconos, splash, logos 101tags
ios/                             ← `ionic cap add ios` (carpetas regenerables)
android/                         ← `ionic cap add android` (carpetas regenerables)
www/                             ← build output (en .gitignore)
```

La estructura puede ajustarse al scaffold real generado, pero cualquier diferencia relevante debe documentarse y no debe introducir una segunda arquitectura paralela.

## Contratos

### API

Esta spec no llama endpoints de negocio. Sólo establece `apiBaseUrl` configurable.

- Dev: preferencia por `/api` mediante proxy local al backend Laravel (configurar `proxy.conf.json` con target `http://localhost:8000`).
- Producción: URL definida por environment/configuración de build, **nunca hardcoded** en componentes/services.
- CORS dev: si `ionic serve` corre en `:8100` y el backend sólo permite `STOREFRONT_URL`+`APP_URL`, **se documenta el workaround** (proxy durante dev; CORS abierto a `ionic serve` sólo en `APP_ENV=local`). Esto queda como trabajo de M0.4.

### Storage local

Esta spec puede instalar/configurar storage **no sensible** si la decisión ya está aprobada.

El bearer token **NO se almacena** todavía. La implementación segura del token se decide en la spec de Auth (M1.1) y debe usar una solución respaldada por Keychain/Keystore en nativo. `@capacitor/preferences` queda reservado para datos no sensibles salvo evidencia técnica distinta documentada y aprobada (ver `DISCOVERY.md §5`).

### Estado/signals

No se crea estado de negocio. Se permiten únicamente señales de shell/demo necesarias para comprobar el scaffold.

### Rutas

Debe existir una ruta de arranque mínima (`/` → splash → tabs shell) y el router debe renderizar sin errores. Las rutas funcionales del MVP se incorporarán en sus propias specs.

### Capacitor config (`capacitor.config.ts`)

```ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mx.com.101tags.movil',       // decisión confirmada M0.2 (Issue #2)
  appName: '101tags',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#E31E24',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#E31E24',
    },
  },
};

export default config;
```

> **Discrepancia con PLAN.md:** `PLAN.md` proponía `appId = com.101tags.comprador`. M0.2 fija `mx.com.101tags.movil`. PLAN.md puede actualizarse en cualquier tarea posterior con un cleanup documental.

## Stack y decisiones a cerrar antes de APPROVED

### Decisiones cerradas (M0.2)

| Tema | Decisión | Razón |
|---|---|---|
| **Package manager** | `pnpm@9.x` | Lockfile + workspace + alineado con AGENTS.md "no mezclar lockfiles". |
| **Test runner** | Karma 6.4.x + Jasmine 5.x | Default Angular CLI 17, zero friction. No se sustituye por Jest en MVP. |
| **Lint** | ESLint 8.57.x + `@angular-eslint/*@17.5.x` + `eslint-config-prettier@9.x` | Angular 17 NO soporta ESLint 9 (requeriría Angular 18). |
| **Formatter** | Prettier 3.x | Estándar, config única, sin conflict con ESLint vía `eslint-config-prettier`. |
| **i18n** | Hardcoded `es-MX` en MVP. `@angular/localize` se agrega sólo cuando se pida multi-idioma. | MVP es es-MX-only; cero dependencias extra hasta necesitarla. |
| **Tailwind** | `tailwindcss@3.4.x` vanilla + `tailwind.config.js` con tokens manuales (`colors.brand.{red,dark,light}`, `fontFamily.sans`). PostCSS + Autoprefixer 10.x. | Sin `@ionic-team/tailwindcss-preset` para no atarse al release cycle de Ionic. |
| **Husky + commitlint** | NO en MVP | Verde y simple. Se agrega en F7 si hace falta. |
| **Coverage threshold** | Informativo, sin threshold de fallo en MVP | Hard-fail queda como trabajo futuro en F7. |
| **i18n en build time** | NO (sólo runtime hardcoded) | Ver decisión i18n arriba. |
| **Husky en CI** | NO en MVP | Verde y simple. |

### Versiones propuestas (pendiente validación M0.3)

Las siguientes versiones son **propuesta inicial** y deben validarse en M0.3 contra requisitos vigentes de Android SDK, Xcode, Node LTS, Google Play y App Store. Si M0.3 detecta incompatibilidad, esta spec se enmienda antes de ejecutar `ionic start`.

| Paquete | Versión propuesta | Notas |
|---|---|---|
| Node.js | `20.x` (LTS) | Angular 17 requiere ≥18.13; 20 LTS estable al 2026. |
| TypeScript | `5.4.x` | Requerido por Angular 17. |
| RxJS | `7.8.x` | Requerido por Angular 17. |
| zone.js | `0.14.x` | Requerido por Angular 17. |
| `@angular/{core,cli,common,router,forms}` | `17.3.x` | Última 17.x (Angular 18 ya disponible; se justifica mantener 17 aquí). |
| `@ionic/angular` + `@ionic/cli` | `7.x` | Última 7 estable. |
| `@capacitor/{core,cli,ios,android}` | `6.x` | Última 6 estable. |
| `@capacitor/{preferences,status-bar,splash-screen,app,browser}` | `6.x` | Mínimo viable para Auth + branding + deep links. |

### Capacitor plugins que se reservan para specs posteriores

- `@capacitor/push-notifications` — fuera del MVP (ver `DISCOVERY.md §12`, decisión D-NOTIFICATIONS-PUSH = NO).
- `@capacitor/camera` — F3.x cuando se implemente upload de comprobante.
- `@capacitor/geolocation` — fuera del MVP.
- OpenPay SDK nativo — decisión en M3.6 (D-OPENPAY-NATIVE).

### Scripts del `package.json` (referencia, ajustables al scaffold real)

```jsonc
{
  "name": "101tags-mobile",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "start": "ionic serve --port 8100",
    "dev": "pnpm start",
    "build": "ionic build --prod",
    "build:dev": "ionic build",
    "test": "ng test --browsers=ChromeHeadlessNoSandbox --watch=false",
    "test:watch": "ng test --browsers=Chrome",
    "lint": "ng lint",
    "lint:fix": "ng lint --fix",
    "format": "prettier --write \"src/**/*.{ts,html,scss,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,html,scss,json}\"",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "cap:sync": "ionic cap sync",
    "cap:open:ios": "ionic cap open ios",
    "cap:open:android": "ionic cap open android",
    "validate": "pnpm typecheck && pnpm lint && pnpm format:check && pnpm test"
  },
  "packageManager": "pnpm@9"
}
```

> Los scripts finales se ajustarán en M0.4 al detectar los que `ionic start` genera. Cualquier desvío debe documentarse en `STATE.md`.

### Theming lock

```scss
/* src/theme/variables.scss */
:root {
  --ion-color-primary: #E31E24;
  --ion-color-primary-shade: #b91c1c;
  --ion-color-primary-tint: #e84549;
  --ion-color-dark: #0a0a0a;
  --ion-color-medium: #F5F5F5;
  --ion-font-family: 'Montserrat', system-ui, sans-serif;
}
```

```js
/* tailwind.config.js (resumen) */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  theme: {
    extend: {
      colors: {
        brand: { red: '#E31E24', dark: '#0a0a0a', light: '#F5F5F5' },
      },
      fontFamily: { sans: ['Montserrat', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
```

### ESLint config (resumen)

- Extiende: `eslint:recommended`, `@angular-eslint/recommended`, `@angular-eslint/template/recommended`, `@angular-eslint/template/accessibility`, `eslint-config-prettier`.
- Reglas custom: `no-console: warn`, `@typescript-eslint/no-explicit-any: warn`, `@angular-eslint/template/no-interpolation-in-attributes` activo para forzar escape `{{}}` y evitar `[innerHTML]` sin sanitizar.

### Prettier config

```json
{ "printWidth": 100, "singleQuote": true, "trailingComma": "all", "arrowParens": "always", "endOfLine": "lf" }
```

### Environments

```ts
/* src/environments/environment.ts */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8000/api',
  appVersion: '0.0.0',
};

/* src/environments/environment.prod.ts — placeholder, sustituido por CI */
export const environment = {
  production: true,
  apiBaseUrl: 'PROD_API_BASE_URL_PLACEHOLDER',
  appVersion: '0.0.0',
};
```

### Angular app.config (resumen)

```ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withPreloading, withComponentInputBinding } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideIonicAngular({ mode: 'md', theme: { autoMode: true } }),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
    provideHttpClient(withInterceptors([])),  // auth/error interceptors se agregan en M1.2
  ],
};
```

## Seguridad

- No hardcodear tokens, passwords, OpenPay keys ni secrets.
- No commitear `.env` con secretos, certificados, provisioning profiles o keystores.
- API prod debe usar HTTPS.
- No introducir almacenamiento inseguro del bearer token durante el scaffold.
- Dependencias nuevas deben tener propósito documentado.
- Permisos nativos: ninguno extra salvo los que el scaffold requiera; Camera/Push/etc. se agregan cuando exista la feature que los necesita.

## Compatibilidad

- La API Laravel existente es la fuente de contratos; esta tarea no la cambia.
- Mantener idioma `es-MX` y branding de 101tags.
- El scaffold debe poder ejecutarse en navegador para desarrollo además de sincronizar Android/iOS.

## Riesgos

1. Las versiones originalmente propuestas pueden estar desfasadas respecto a SDK/store requirements vigentes → mitigado por gate de M0.3 antes de M0.4.
2. Un plugin elegido prematuramente puede bloquear actualización de Capacitor → mitigado por reserva de plugins (push, camera, geolocation) hasta que la feature lo pida.
3. Mezclar npm/pnpm puede generar lockfiles inconsistentes → mitigado por AGENTS.md y `packageManager: "pnpm@9"` pin en `package.json`.
4. Agregar plataformas nativas sin una política de archivos generados puede ensuciar el repo → mitigado por `.gitignore` que ya excluye `ios/App/Pods/`, `android/.gradle/`, `android/app/build/`, etc.
5. Configurar storage sensible como Preferences sería una falsa garantía de seguridad → mitigado por regla explícita en `AGENTS.md §Token Sanctum` y por delegación a M1.1.
6. `ionic cap sync` regenera `ios/` y `android/` con archivos generados; si no se excluyen bien, el repo se infla → mitigado por `.gitignore` actual + verificación post-M0.4.
7. CORS en dev (`ionic serve` en `:8100`) puede bloquear llamadas si el backend no permite el origen → mitigado por proxy `proxy.conf.json` en dev + nota para backend (no se modifica, se documenta).

## Plan de implementación

1. ✅ M0.2 (esta tarea): cerrar decisiones pendientes y marcar `APPROVED`.
2. M0.3 (Issue #3): validar matriz de versiones contra SDK/store requirements vigentes. Si hay cambios, enmendar esta spec y volver a aprobarla antes de M0.4.
3. M0.4 (Issue #4): ejecutar `ionic start` con el package manager acordado y agregar `ionic cap add ios android`.
4. M0.5 (Issue #5): configurar theme, Tailwind, environments y proxy.
5. M0.6 (Issue #6): crear scripts reales de test/lint/format/typecheck/build y la estructura `core/shared/pages/models`.
6. Smoke tests del shell/configuración; resultados reales se registran en `STATE.md` (no se afirma que pasan sin ejecutar).

---

## Escenarios BDD

### Escenario 1 — Instalación reproducible

**Dado** un checkout limpio del repositorio  
**Cuando** se instala usando el package manager documentado  
**Entonces** todas las dependencias del scaffold se resuelven sin mezclar lockfiles  
**Y** el comando de desarrollo puede iniciar la aplicación.

### Escenario 2 — Build web

**Dado** el scaffold configurado  
**Cuando** se ejecuta el build definido por el proyecto  
**Entonces** finaliza sin errores TypeScript  
**Y** genera los assets esperados para Capacitor.

### Escenario 3 — Configuración API por environment

**Dado** un build de desarrollo  
**Cuando** un futuro service consulte `apiBaseUrl`  
**Entonces** la URL proviene de la configuración central  
**Y** ningún componente necesita conocer el host productivo.

### Escenario 4 — Branding base

**Dado** el shell de la aplicación  
**Cuando** se renderiza  
**Entonces** usa las variables de theme 101tags  
**Y** la configuración tipográfica/estilos está centralizada.

### Escenario 5 — Baseline de tests

**Dado** el proyecto recién generado  
**Cuando** se ejecuta el comando de test  
**Entonces** existe al menos un smoke test válido  
**Y** termina verde antes de iniciar Auth.

### Escenario 6 — Typecheck/lint/build

**Dado** el scaffold terminado  
**Cuando** se ejecutan los comandos de verification disponibles  
**Entonces** los resultados reales se registran en `STATE.md`  
**Y** ninguna verificación se declara ejecutada si no existe o no pudo correrse.

### Escenario 7 — Sin secretos

**Dado** el diff completo de F0  
**Cuando** se revisan archivos de configuración y plataformas nativas  
**Entonces** no existen credenciales reales, tokens, keystores ni provisioning profiles versionados.

### Escenario 8 — Plataformas nativas

**Dado** que Android/iOS fueron añadidos  
**Cuando** se ejecuta la sincronización de Capacitor  
**Entonces** ambas plataformas reciben el web build/config sin errores atribuibles al scaffold.

### Escenario 9 — Storage sensible aún no implementado

**Dado** que Auth está fuera de alcance  
**Cuando** termina esta tarea  
**Entonces** no existe un bearer token persistido en Preferences/localStorage  
**Y** la decisión de secure storage queda explícita para F1.

### Escenario 10 — `appId` y `appName` de Capacitor correctos

**Dado** que se generó el scaffold con `ionic cap add ios android`
**Cuando** se inspecciona `capacitor.config.ts`
**Entonces** `appId === 'mx.com.101tags.movil'`
**Y** `appName === '101tags'`
**Y** ningún componente referencia el dominio productivo hardcoded.

### Escenario 11 — Estructura de carpetas mínima

**Dado** el scaffold generado
**Cuando** se inspecciona `src/app/`
**Entonces** existen las carpetas `core/{guards,interceptors,models,services}/`, `shared/{components,directives,pipes}/` y `pages/`
**Y** `app.component.ts`, `app.config.ts`, `app.routes.ts` existen y compilan.
**Y** `core/` no contiene aún archivos de modelos/servicios (esos son M0.5 / F1).

### Escenario 12 — pnpm como único package manager

**Dado** un checkout limpio
**Cuando** se inspecciona el repo
**Entonces** existe sólo un lockfile (`pnpm-lock.yaml`)
**Y** no hay `package-lock.json` ni `yarn.lock` ni `bun.lockb`.

### Escenario 13 — Theming 101tags centralizado

**Dado** que se renderiza el shell de la app
**Cuando** se inspeccionan los elementos con tokens de color y fuente
**Entonces** se aplican `--ion-color-primary: #E31E24`, `--ion-color-dark: #0a0a0a`, `--ion-color-medium: #F5F5F5`
**Y** la fuente es `Montserrat` (con fallback `system-ui, sans-serif`).

---

## Verification esperada

Los nombres exactos de comandos deben obtenerse del scaffold real; no se inventarán antes de generarlo. Como mínimo se debe poder demostrar:

- instalación limpia (`pnpm install` resuelve todas las deps sin warnings críticos);
- tests (`pnpm test` corre Karma headless y termina con código 0);
- lint (`pnpm lint` corre ESLint y termina con código 0);
- formatter/check (`pnpm format:check` termina con código 0);
- typecheck (`pnpm typecheck` corre `tsc --noEmit` y termina con código 0);
- build web/Ionic (`pnpm build` produce `www/index.html` y assets);
- `cap sync` Android/iOS (`pnpm cap:sync` sincroniza sin errores atribuibles al scaffold).

**REGLA**: no se afirma que un comando "pasa" si no se ejecutó realmente. `STATE.md` registra baseline real con códigos de salida.

## Checklist

- [x] M0.1 backend contracts audit completada (rama `chore/m0-1-auditar-contratos`, pendiente de merge)
- [x] Spec aprobada (M0.2 — Issue #2)
- [x] BDD completo (13 escenarios)
- [ ] M0.3 version matrix validada → prereq para M0.4
- [ ] M0.4 Scaffold implementado (GREEN)
- [ ] Smoke tests escritos (RED)
- [ ] Tests fallando correctamente antes de implementar
- [ ] Refactor
- [ ] Verification completa
- [ ] `STATE.md` actualizado con baseline real
- [ ] Dependencias y lockfile consistentes (sólo `pnpm-lock.yaml`)
- [ ] Sin secretos

> Esta spec quedó `APPROVED` en M0.2. El siguiente paso es ejecutar M0.3 (Issue #3) para validar la matriz de versiones. Si M0.3 detecta incompatibilidad, esta spec se enmienda en esa misma tarea y vuelve a aprobar antes de M0.4.

---

## Notas de cierre (M0.2)

- La decisión `appId = mx.com.101tags.movil` (vs `com.101tags.comprador` que sugería `PLAN.md`) es una discrepancia menor. `PLAN.md` puede actualizarse en una tarea de cleanup documental sin impacto funcional.
- El M0.1 audit (`docs/audit/*.md` en la rama `chore/m0-1-auditar-contratos`) aún no está mergeado a `main`. Sus hallazgos son válidos y complementan el `DISCOVERY.md` global. La integración se hará en una futura tarea (no es alcance de M0.2).
- Las decisiones que M0.2 empuja a specs posteriores se mantienen abiertas:
  - **D-OPENPAY-NATIVE** → M3.6 spec.
  - **D-DEEPLINK-RESET** → M1.4 spec.
  - **D-PAGINATION-CACHE** → F2 specs.
  - **D-MULTI-HOUSE-CART** → M3.2 spec.
  - **D-NOTIFICATIONS-PUSH** → confirmado NO en MVP (sólo in-app).
