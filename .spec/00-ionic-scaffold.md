# Spec: Scaffold Ionic/Angular/Capacitor de 101tags mobile

**Status**: APPROVED (enmendada por M0.3 — ENMIENDA MAYOR aplicada)
**Spec ID**: 2026-09-09-ionic-scaffold
**Author**: ChatGPT / planificación técnica + agente (cierre M0.2, enmienda M0.3)
**Date**: 2026-09-09
**Approved in**: M0.2 (Issue #2) + re-aprobada implícita por M0.3 (Issue #3)
**Related specs**:
- `.spec/2026-09-09-m0-3-validar-versiones.md` (M0.3 — APPROVED, fuente de la enmienda de versiones)
- `.spec/2026-09-09-m0-1-auditar-contratos.md` (M0.1 — DONE)

> Esta spec queda **APPROVED** con las decisiones de F0 cerradas explícitamente más abajo. Las versiones marcadas como **enmendadas (M0.3)** reemplazan las propuestas originales: el stack original (Node 20, Angular 17, Ionic 7, Capacitor 6, etc.) estaba EOL/End-of-Support al 2026-09. Detalle y justificación celda por celda en `.spec/2026-09-09-m0-3-validar-versiones.md §4`.

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
├── styles.scss                  ← @import "tailwindcss" + @theme + Ionic imports
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
  bundledWebRuntime: false,           // ⚠️ removida en Capacitor 7+; dejar o borrar (verificar en M0.4)
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

## Stack y decisiones

### Decisiones cerradas (M0.2, vigentes tras M0.3)

| Tema | Decisión | Razón |
|---|---|---|
| **Package manager** | `pnpm@10.x` | User ya tiene pnpm 10.32.1 instalado. Lockfile + workspace. |
| **Test runner** | Karma 6.4.x + Jasmine 5.x | Default Angular CLI 22, zero friction. No se sustituye por Jest en MVP. |
| **Lint** | ESLint 10.x + `@angular-eslint/*@22.5.x` + flat config obligatorio | Angular 22 fuerza ESLint 10 + flat config. |
| **Formatter** | Prettier 3.x | Estándar, sin conflicto con ESLint. |
| **i18n** | Hardcoded `es-MX` en MVP. `@angular/localize` se agrega sólo cuando se pida multi-idioma. | MVP es es-MX-only; cero dependencias extra. |
| **Tailwind** | `tailwindcss@4.3.x` con CSS-first config (`@import "tailwindcss"` + `@theme { ... }` en `styles.scss`). PostCSS + Autoprefixer 10.x. | Tailwind 4 es el linaje estable; sin preset oficial de Ionic. |
| **Husky + commitlint** | NO en MVP | Verde y simple. Se agrega en F7 si hace falta. |
| **Coverage threshold** | Informativo, sin threshold de fallo en MVP | Hard-fail queda como trabajo futuro en F7. |

### Versiones (ENMENDADAS por M0.3 — ver `.spec/2026-09-09-m0-3-validar-versiones.md`)

> **ENMIENDA MAYOR (M0.3, 2026-09-09)**: el stack original basado en Angular 17 / Ionic 7 / Capacitor 6 era viable al 2024 pero al 2026-09 todos los frameworks propuestos están EOL o End of Support. Esta tabla reemplaza la propuesta inicial.

| Paquete | Versión enmendada | Notas |
|---|---|---|
| **Node.js** | `24.x LTS ("Krypton")` | Active LTS al 2026-09. Node 20 está **EOL desde 2026-04-30**. Pre-M0.4 ejecutar `nvm install 24 && nvm alias default 24` (el usuario ya tiene nvm 0.40.3 + Node 25.0.0 Current activo). |
| **pnpm** | `10.x` | User ya tiene pnpm 10.32.1. |
| **TypeScript** | `6.x` | `@angular-eslint 22.5.0` y Angular 22 lo exigen. |
| **RxJS** | `7.8.x` | Compatible con Angular 22. |
| **zone.js** | `0.15.x` o `0.16.x` | Requerido por Angular 22 (fijar exacto en M0.4 al `npm view`). |
| `@angular/{core,cli,common,router,forms}` | `22.1.x` | Current stable. Angular 17 está EOL. |
| `@angular-eslint/*` | `22.5.x` | Match Angular 22. Requiere ESLint 10 + flat config + TS 6 + Node 22+. |
| `@ionic/angular` + `@ionic/cli` | `9.0.x` | Current stable. Soporta Angular 18-22. |
| `@capacitor/{core,cli,ios,android}` | `8.5.x` | Latest stable. Soporta Node 22, Xcode 26, AGP 8.7.2. Introduce SPM default en iOS. |
| `@capacitor/{preferences,status-bar,splash-screen,app,browser}` | `8.5.x` | Match core. |
| **Tailwind CSS** | `4.3.x` | Latest stable. **CSS-first config** (`@import "tailwindcss"` + `@theme`). El `tailwind.config.js` se elimina. |
| PostCSS / Autoprefixer | `8.x` / `10.x` | Requeridos por Tailwind 4. |
| **ESLint** | `10.x` (flat config) | Forzado por `@angular-eslint 22`. Reescribir `.eslintrc.json` → `.eslint.config.js`. |
| Prettier | `3.x` | OK. Sin cambios. |
| Karma / Jasmine / @types/jasmine | `6.4.x` / `5.x` / `5.x` | Default Angular CLI 22. |

### Requisitos de plataforma nativos (M0.3)

| Plataforma | Requisito store 2026-09 | Configuración Capacitor 8 |
|---|---|---|
| iOS deployment target | Xcode 26.6 + iOS 26 SDK (obligatorio desde Abr-2026); IPHONEOS_DEPLOYMENT_TARGET ≥ 15.0 (Cap 8 default) | OK |
| Android targetSdk | 36 (Android 16) desde 2026-08-31 | ⚠️ Bump manual en `variables.gradle` (Cap 8 default = 35) |
| Xcode mínimo | 26.0 | OK (Cap 8 lo declara) |
| AGP / Gradle | AGP 8.7.2 / Gradle 8.11.1 (Cap 8 default) | OK |
| JDK | 17 (mínimo) o 21 | OK |
| Android Studio | 2025.2.1+ | OK |
| iOS 27 SDK | Obligatorio Abr-2027 | Gate de re-validación Q1-2027 |
| Privacy Manifest (iOS) | Obligatorio desde 2024-05-01 | OK (Cap documenta) |

### Capacitor plugins que se reservan para specs posteriores

- `@capacitor/push-notifications` — fuera del MVP.
- `@capacitor/camera` — F3.x.
- `@capacitor/geolocation` — fuera del MVP.
- OpenPay SDK nativo — M3.6.

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
  "packageManager": "pnpm@10"
}
```

> Los scripts finales se ajustarán en M0.4 al detectar los que `ionic start` genera. Cualquier desvío debe documentarse en `STATE.md`.

### Theming lock (re-escrito para Tailwind 4)

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

```scss
/* src/styles.scss (Tailwind 4 CSS-first config, NO tailwind.config.js) */
@use '@ionic/angular/css/core.css';
@use '@ionic/angular/css/normalize.css';
@use '@ionic/angular/css/structure.css';
@use '@ionic/angular/css/typography.css';
@use '@ionic/angular/css/padding.css';
@use '@ionic/angular/css/float-elements.css';
@use '@ionic/angular/css/text-alignment.css';
@use '@ionic/angular/css/text-transformation.css';
@use '@ionic/angular/css/flex-utils.css';
@use '@ionic/angular/css/display.css';

@import "tailwindcss";

@theme {
  --color-brand-red: #E31E24;
  --color-brand-dark: #0a0a0a;
  --color-brand-light: #F5F5F5;
  --font-family-sans: 'Montserrat', system-ui, sans-serif;
}

/* Variables Ionic importadas después para que theme/ tome precedencia */
@import './theme/variables.scss';
```

> El antiguo `tailwind.config.js` se elimina. Tailwind 4 escanea automáticamente los archivos del proyecto y la configuración vive en `@theme { ... }` dentro de CSS.

### ESLint flat config (resumen)

```js
// eslint.config.js (NO .eslintrc.json — Angular 22 + ESLint 10 = flat config only)
import angular from 'angular-eslint';
import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';

export default tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      'no-console': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
);
```

> Ajustar a la estructura exacta que genere `ng add @angular-eslint/schematics` en M0.4. `eslint-config-prettier` se aplica como un config extra al final del array para desactivar reglas de estilo.

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
- Capacitor 8 introduce Swift Package Manager como default para iOS — revisar implicaciones de seguridad/Supply-Chain.

## Compatibilidad

- La API Laravel existente es la fuente de contratos; esta tarea no la cambia.
- Mantener idioma `es-MX` y branding de 101tags.
- El scaffold debe poder ejecutarse en navegador para desarrollo además de sincronizar Android/iOS.

## Riesgos (actualizados por M0.3)

1. Capacitor 8.5.1 + AGP 9.4 puede romper el build Android → mitigado por mantener AGP 8.7.2 (default Cap 8) + bump manual de `targetSdk` a 36 en `variables.gradle`.
2. Capacitor 8 SPM default para iOS cambia expectativas vs CocoaPods → documentar el flag `--packagemanager CocoaPods` o aceptar SPM (default moderno).
3. Tailwind 4 sin `tailwind.config.js` cambia el setup → reescrito en spec con CSS-first (`@import "tailwindcss"` + `@theme`).
4. ESLint 10 + flat config requiere reescritura → reescrito en spec con `eslint.config.js`.
5. `@ionic/cli 9.x` puede tener breaking changes vs 7.x → revisar release notes de Ionic 9 en M0.4.
6. iOS 27 SDK será obligatorio Abr-2027 → gate de re-validación Q1-2027 antes de release (F7).
7. Privacy Manifest y Data Safety obligatorios → documentar en M0.5/M0.6.
8. CORS en dev (`ionic serve` en `:8100`) → proxy `proxy.conf.json` en dev.
9. Las versiones siguen evolucionando; re-validar al cerrar F0–F7.

## Plan de implementación

1. ✅ M0.2: cerrar decisiones pendientes y marcar `APPROVED`.
2. ✅ M0.3: validar matriz de versiones contra SDK/store requirements vigentes. **ENMIENDA MAYOR** aplicada a esta spec.
3. M0.4 (Issue #4): ejecutar `ionic start` con pnpm, `ionic cap add ios android`. Pre-M0.4: `nvm install 24 && nvm alias default 24`.
4. M0.5 (Issue #5): configurar theme, Tailwind 4 CSS-first, environments y proxy.
5. M0.6 (Issue #6): crear scripts reales, `.eslint.config.js` flat, estructura `core/shared/pages/models`.
6. Smoke tests del shell/configuración; resultados reales se registran en `STATE.md`.

---

## Escenarios BDD

### Escenario 1 — Instalación reproducible

**Dado** un checkout limpio del repositorio con `nvm 0.40.3` instalado
**Cuando** se ejecuta `nvm use` (lee `.nvmrc` con `24`) + `pnpm install`
**Entonces** todas las dependencias del scaffold se resuelven sin mezclar lockfiles
**Y** el comando `pnpm dev` puede iniciar la aplicación.

### Escenario 2 — Build web

**Dado** el scaffold configurado
**Cuando** se ejecuta `pnpm build`
**Entonces** finaliza sin errores TypeScript 6.x
**Y** genera `www/index.html` y assets esperados para Capacitor 8.

### Escenario 3 — Configuración API por environment

**Dado** un build de desarrollo
**Cuando** un futuro service consulte `environment.apiBaseUrl`
**Entonces** la URL proviene de la configuración central
**Y** ningún componente referencia el dominio productivo hardcoded.

### Escenario 4 — Branding base

**Dado** el shell de la aplicación
**Cuando** se renderiza
**Entonces** usa las variables de theme 101tags (`#E31E24`, `#0a0a0a`, `#F5F5F5`, Montserrat)
**Y** Tailwind 4 aplica `@theme { --color-brand-* }` correctamente.

### Escenario 5 — Baseline de tests

**Dado** el proyecto recién generado con Angular 22
**Cuando** se ejecuta `pnpm test` (Karma 6.4 + Jasmine 5)
**Entonces** existe al menos un smoke test válido
**Y** termina verde antes de iniciar Auth.

### Escenario 6 — Typecheck/lint/build

**Dado** el scaffold terminado
**Cuando** se ejecuta `pnpm validate` (`typecheck && lint && format:check && test`)
**Entonces** todos los comandos retornan código 0
**Y** los resultados reales se registran en `STATE.md`.

### Escenario 7 — Sin secretos

**Dado** el diff completo de F0
**Cuando** se revisan archivos de configuración y plataformas nativas
**Entonces** no existen credenciales reales, tokens, keystores ni provisioning profiles versionados.

### Escenario 8 — Plataformas nativas

**Dado** que Android/iOS fueron añadidos con `ionic cap add ios android`
**Cuando** se ejecuta `pnpm cap:sync`
**Entonces** ambas plataformas reciben el web build/config sin errores atribuibles al scaffold
**Y** Capacitor 8 introduce SPM como default en iOS (documentar y aceptar).

### Escenario 9 — Storage sensible aún no implementado

**Dado** que Auth está fuera de alcance
**Cuando** termina esta tarea
**Entonces** no existe un bearer token persistido en Preferences/localStorage
**Y** la decisión de secure storage queda explícita para F1.

### Escenario 10 — `appId` y `appName` de Capacitor correctos

**Dado** que se generó el scaffold
**Cuando** se inspecciona `capacitor.config.ts`
**Entonces** `appId === 'mx.com.101tags.movil'`
**Y** `appName === '101tags'`
**Y** ningún componente referencia el dominio productivo hardcoded.

### Escenario 11 — Estructura de carpetas mínima

**Dado** el scaffold generado
**Cuando** se inspecciona `src/app/`
**Entonces** existen las carpetas `core/{guards,interceptors,models,services}/`, `shared/{components,directives,pipes}/` y `pages/`
**Y** `app.component.ts`, `app.config.ts`, `app.routes.ts` existen y compilan.

### Escenario 12 — pnpm como único package manager

**Dado** un checkout limpio
**Cuando** se inspecciona el repo
**Entonces** existe sólo un lockfile (`pnpm-lock.yaml`)
**Y** `package.json` declara `"packageManager": "pnpm@10"`.

### Escenario 13 — Theming 101tags centralizado

**Dado** que se renderiza el shell de la app
**Cuando** se inspeccionan los elementos con tokens de color y fuente
**Entonces** se aplican `--ion-color-primary: #E31E24`, `--ion-color-dark: #0a0a0a`, `--ion-color-medium: #F5F5F5`
**Y** la fuente es `Montserrat` (con fallback `system-ui, sans-serif`).

### Escenario 14 — Versiones vigentes (ENMIENDA M0.3)

**Dado** que el scaffold se generó
**Cuando** se ejecuta `pnpm list --depth=0`
**Entonces** las versiones reportadas coinciden con la tabla enmendada de §Versiones (Node 24, Angular 22.1, Ionic 9, Capacitor 8.5, Tailwind 4.3, ESLint 10, pnpm 10)
**Y** ninguna dependencia quedó en una versión EOL.

---

## Verification esperada

Los nombres exactos de comandos deben obtenerse del scaffold real; no se inventarán antes de generarlo. Como mínimo se debe poder demostrar:

- `nvm install 24 && nvm use 24` deja Node 24 LTS activo.
- `pnpm install` resuelve todas las deps sin warnings críticos.
- `pnpm test` corre Karma 6.4 + Jasmine 5 headless y termina con código 0.
- `pnpm lint` corre ESLint 10 flat config y termina con código 0.
- `pnpm format:check` corre Prettier 3 y termina con código 0.
- `pnpm typecheck` corre `tsc --noEmit` y termina con código 0.
- `pnpm build` produce `www/index.html` y assets para Capacitor 8.
- `pnpm cap:sync` sincroniza iOS (SPM) y Android (AGP 8.7.2 con targetSdk 36 bumpeado) sin errores.

**REGLA**: no se afirma que un comando "pasa" si no se ejecutó realmente. `STATE.md` registra baseline real con códigos de salida.

## Checklist

- [x] M0.1 backend contracts audit completada (rama `chore/m0-1-auditar-contratos`, pendiente de merge)
- [x] M0.2 spec aprobada (rama `chore/m0-2-spec-scaffold`, pendiente de merge)
- [x] M0.3 version matrix validada (rama `chore/m0-3-validar-versiones`, ENMIENDA MAYOR aplicada)
- [x] Spec aprobada (M0.2) + re-aprobada implícita (M0.3)
- [x] BDD completo (14 escenarios)
- [ ] M0.4 scaffold implementado (pre-req: `nvm install 24 && nvm alias default 24`)
- [ ] Smoke tests escritos (RED)
- [ ] Tests fallando correctamente antes de implementar
- [ ] Refactor
- [ ] Verification completa
- [ ] `STATE.md` actualizado con baseline real
- [ ] Dependencias y lockfile consistentes (sólo `pnpm-lock.yaml`)
- [ ] Sin secretos

> Esta spec quedó `APPROVED` en M0.2 y re-confirmada en M0.3 con la ENMIENDA MAYOR de versiones. El siguiente paso es ejecutar M0.4 (Issue #4) con el stack enmendado, después de `nvm install 24 && nvm alias default 24`.

---

## Notas de cierre (M0.3)

- El cambio es mayor pero **transparente** para M0.4–M0.6 (los comandos son los mismos; solo cambian versiones y sintaxis de Tailwind 4 / ESLint 10).
- Las decisiones pujadas a specs futuras (D-OPENPAY-NATIVE, D-DEEPLINK-RESET, D-PAGINATION-CACHE, D-MULTI-HOUSE-CART, D-NOTIFICATIONS-PUSH) siguen abiertas y no se ven afectadas por esta enmienda.
- La discrepancia con `chore/m0-1-auditar-contratos` (audit aún sin mergear) sigue sin resolverse; queda para tarea futura.
- **Pre-M0.4 (usuario)**: `nvm install 24 && nvm alias default 24` antes de empezar M0.4.
