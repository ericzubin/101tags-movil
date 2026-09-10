# Spec: Generar workspace Ionic/Angular/Capacitor (M0.4)

**Status**: DONE
**Spec ID**: 2026-09-09-m0-4-workspace-ionic
**Author**: Agente (Issue #4)
**Date**: 2026-09-09
**Approved in**: M0.4 (Issue #4) — hereda aprobación de M0.2/M0.3
**Related specs**:
- `.spec/00-ionic-scaffold.md` (M0.2 APPROVED + enmendada por M0.3) — fuente de verdad del stack
- `.spec/2026-09-09-m0-3-validar-versiones.md` (M0.3 APPROVED) — fuente del stack enmendado

---

## Contexto

`.spec/00-ionic-scaffold.md` quedó **APPROVED** en M0.2 y enmendada en M0.3 con el stack vigente al 2026-09:

- Node 24 LTS, Angular 22.1, TypeScript 6, RxJS 7.8, zone 0.15+
- @ionic/angular 9.0.3, @capacitor/core 8.5.1, plugins Capacitor 8
- ESLint 9 (flat config), Vitest 4 (Angular 22 default), jsdom 26
- pnpm 10.32.1 (ya instalado), Angular 22 + Ionic 9 + Capacitor 8

M0.4 ejecuta el primer paso generador de código: `ionic start` + `cap add ios android` + configuración.

## Problema

Antes de F1 (auth) no existe un workspace real donde añadir servicios, modelos, componentes. Hay que cerrar el gap "specs ↔ código".

## Objetivo

Generar el scaffold real del proyecto en el repo root con todo el stack enmendado de M0.3, ejecutar `cap add ios android`, y verificar que `typecheck`, `build`, `test`, `lint` pasan verdes.

## Fuera de alcance

- Auth (F1).
- Catálogo (F2).
- Cualquier feature de negocio.
- OpenPay (M3.6).
- CI/CD (no en MVP).
- Ajustes finos del scaffold (tema, environments, etc. van a M0.5).

## Arquitectura afectada (archivos generados)

### Archivos en repo root (nuevos)

```
.browserslistrc
.editorconfig
.nvmrc                          ← 24 (Node LTS pin)
.prettierrc
.vscode/                        ← config Ionic CLI
angular.json
capacitor.config.ts             ← appId mx.com.tags.movil, appName 101tags, plugins
eslint.config.js                ← flat config (ESLint 9)
ionic.config.json               ← type=angular-standalone
package.json                    ← stack M0.3 + pnpm@10 + scripts reales
pnpm-lock.yaml
tsconfig.app.json
tsconfig.json
tsconfig.spec.json
android/                        ← Capacitor 8 (compileSdk 36, targetSdk 36)
ios/                            ← Capacitor 8 (iOS deployment target 15.0, SPM)
src/                            ← web app
```

### Archivos en src/ (generados por ionic start)

```
src/main.ts                     ← bootstrapApplication
src/index.html
src/global.scss                 ← Ionic CSS + dark mode system
src/test-setup.ts               ← jsdom polyfills
src/app/app.component.ts
src/app/app.routes.ts           ← /home lazy
src/app/app.component.html
src/app/app.component.scss
src/app/app.component.spec.ts
src/app/home/home.page.ts
src/app/home/home.page.html
src/app/home/home.page.scss
src/app/home/home.page.spec.ts
src/environments/environment.ts        ← apiBaseUrl localhost:8000/api
src/environments/environment.prod.ts   ← apiBaseUrl placeholder
src/theme/variables.scss        ← 101tags colors (rojo #E31E24, dark, medium, Montserrat)
src/assets/
```

### Archivos modificados (de placeholder a real)

- `package.json` — antes era placeholder; ahora tiene el stack M0.3.
- `.gitignore` — se mantiene el existente (ya cubría Capacitor).
- `STATE.md` — fase F0/M0.4 DONE.

### Archivos intencionalmente NO tocados (preservados del repo)

- `AGENTS.md`, `PLAN.md`, `DISCOVERY.md`, `TASKS.md`, `ISSUES.md`, `README.md`, `STATE.md` (pre-existente).
- `.agent/WORKFLOW.md`, `.spec/README.md`, `.spec/00-ionic-scaffold.md`, etc.

### Archivos no generados (decisiones M0.4 vs scaffold default)

- NO se generó `src/app/app.config.ts` (Angular 22 standalone usa `main.ts` para providers — más moderno que la sugerencia de M0.2).
- NO se generó `karma.conf.js` ni specs de Jasmine — Vitest 4 es el default Angular 22 CLI.
- NO se generó `tailwind.config.js` — Tailwind 4.x CSS-first. La spec M0.5 decide si se agrega.
- NO se agregó `cap add ios --packagemanager CocoaPods` — SPM es default en Capacitor 8, aceptado.

## Contratos

### Capacitor config (`capacitor.config.ts`)

```ts
const config: CapacitorConfig = {
  appId: 'mx.com.tags.movil',
  appName: '101tags',
  webDir: 'www',
  plugins: {
    SplashScreen: { launchShowDuration: 1500, backgroundColor: '#E31E24', androidSplashResourceName: 'splash', showSpinner: false },
    StatusBar:    { style: 'DARK', backgroundColor: '#E31E24' },
  },
};
```

### package.json scripts

```jsonc
{
  "start": "ng serve",
  "dev": "ng serve",
  "build": "ng build",
  "build:dev": "ng build --configuration development",
  "test": "ng test",
  "test:watch": "ng test --watch",
  "lint": "ng lint",
  "lint:fix": "ng lint --fix",
  "format": "prettier --write \"src/**/*.{ts,html,scss,json}\"",
  "format:check": "prettier --check \"src/**/*.{ts,html,scss,json}\"",
  "typecheck": "tsc --noEmit -p tsconfig.app.json",
  "cap:sync": "ionic cap sync",
  "cap:open:ios": "ionic cap open ios",
  "cap:open:android": "ionic cap open android",
  "validate": "pnpm typecheck && pnpm lint && pnpm test"
}
```

### Dependencias reales (alineadas con M0.3)

| Paquete | Versión instalada |
|---|---|
| @angular/{common,compiler,core,forms,platform-browser,router} | 22.0.1 |
| @angular/{build,cli,compiler-cli,language-service} | 22.0.1 |
| @capacitor/{app,core} | 8.5.1 + 8.1.1 |
| @capacitor/{haptics,keyboard,preferences,splash-screen,status-bar} | 8.x |
| @capacitor/{cli,android,ios} | 8.5.1 |
| @ionic/angular | 9.0.3 |
| @ionic/angular-toolkit | 13.0.0 |
| angular-eslint | 22.0.0 |
| eslint | 9.39.5 (deprecated en favor de 10, pero Angular 22 usa 9) |
| typescript | 6.0.3 |
| typescript-eslint | 8.70.0 |
| vitest | 4.1.11 |
| jsdom | 26.1.0 |
| rxjs | 7.8.2 |
| zone.js | 0.15.1 |
| ionicons | 8.1.0 |
| tslib | 2.8.1 |

> **Nota**: la spec M0.3 mencionó ESLint 10 + `@angular-eslint` 22.5 como requeridos. En la práctica, Angular 22 CLI 22.0.1 fija `angular-eslint@22.0.0` + `eslint@^9.16.0` (no ESLint 10). El scaffold generado funciona con ESLint 9 flat config + angular-eslint 22.0.0, que es la combinación oficialmente soportada. ESLint 10 / `@angular-eslint` 22.5 pueden adoptarse en M0.6 si se valida.

## Modelos / DTOs

NO creados en M0.4 — esa es M0.5.

## Seguridad

- Sin credenciales en `capacitor.config.ts`.
- `environment.prod.ts` usa placeholder `PROD_API_BASE_URL_PLACEHOLDER`, sustituido por CI en build.
- Sin keystores / provisioning profiles commiteados.
- `ios/App/Pods/` y `android/.gradle/` excluidos por `.gitignore`.
- SPM como default para iOS — supply-chain transparente vía `Package.swift`.

## Compatibilidad

- Backend Laravel existente no modificado.
- Stack M0.3 alineado con App Store (Xcode 26, iOS 26 SDK, iOS deployment ≥15) y Play Store (targetSdk 36).
- Idioma `es-MX` y branding 101tags preservados en `src/theme/variables.scss`.

## Riesgos detectados durante M0.4

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | `ionic cap add android` falla en WSL porque llama `npm` directamente, no respeta `pnpm` como PM | Mitigado: invocar `pnpm exec cap add android` directamente (bypassing ionic CLI wrapper). |
| R2 | iOS SPM como default puede romper tutoriales/expectativas CocoaPods | Aceptado: SPM es el default moderno de Capacitor 8; documentado. `ionic cap add ios --packagemanager CocoaPods` queda como opción. |
| R3 | `appId mx.com.101tags.movil` rechazado por Capacitor (segmentos no pueden empezar con dígito) | Mitigado: usar `mx.com.tags.movil` (segmentos válidos). Discrepancia D9 vs `.spec/00-ionic-scaffold.md` y PLAN.md. |
| R4 | Browserslist incluye Chrome 110, Firefox 107, Safari 16.1 (Angular 22 marca como "Unsupported"). No bloquea pero warns. | Aceptado: no impacta build. Se puede limpiar `.browserslistrc` en M0.5. |
| R5 | Tests pasan (2/2) pero son triviales (smoke tests del template Ionic). | Esperado: tests reales se crean en M0.6 y F1+. |
| R6 | `ios/` y `android/` carpetas existen pero no se pueden compilar en WSL (no hay Xcode / Android SDK). | Documentado: la compilación nativa requiere macOS (Xcode) o entorno con Android SDK. El scaffold genera los proyectos Capacitor pero el build nativo se hace en la máquina destino. |

## Plan de implementación (ejecutado)

| # | Acción | Resultado |
|---|---|---|
| 1 | `git switch -c chore/m0-4-workspace-ionic origin/chore/m0-3-validar-versiones` | Branch creada |
| 2 | `nvm use 24 && npm i -g @ionic/cli@7.2.1` | CLI instalada (NOTA: `@ionic/cli@9` no existe en npm; CLI 7.2.1 es el actual y soporta framework Ionic 9.x) |
| 3 | `ionic start 101tags blank --type=angular-standalone --capacitor --package-id=mx.com.tags.movil --no-deps --no-git` en `/tmp/ionic-gen/` | Scaffold generado en temp |
| 4 | `rsync -a /tmp/ionic-gen/101tags/ ./` (sobreescribe `package.json` placeholder, preserva AGENTS.md/PLAN.md/.spec/etc.) | Scaffold movido a repo root |
| 5 | Personalizar `capacitor.config.ts` con `appId` + plugins Splash/StatusBar + backgroundColor rojo #E31E24 | Capacitor config final |
| 6 | Personalizar `src/theme/variables.scss` con colores brand + Montserrat | Theming 101tags |
| 7 | Personalizar `src/environments/{environment,environment.prod}.ts` con `apiBaseUrl` | Environments listos |
| 8 | Crear `src/app/core/{guards,interceptors,models,services}/`, `src/app/shared/{components,directives,pipes}/`, `src/app/pages/` con `.gitkeep` | Estructura M0.2 §Arquitectura afectada |
| 9 | Sobreescribir `package.json` con versiones exactas M0.3 + `packageManager: "pnpm@10.32.1"` + scripts completos | Stack alineado |
| 10 | Crear `.nvmrc` (24), `.prettierrc` | Tooling pin |
| 11 | `pnpm install` (Node 24 + pnpm 10) | Exit 0; solo `pnpm-lock.yaml` |
| 12 | `pnpm typecheck` | Exit 0 |
| 13 | `pnpm build` | Exit 0; `www/index.html` generado en 4.5s |
| 14 | `pnpm exec ng test --watch=false` | 2/2 tests passed (Vitest 4) |
| 15 | `pnpm lint` | All files pass linting |
| 16 | `pnpm exec cap add android` | Android platform añadida (compileSdk 36, targetSdk 36) |
| 17 | `pnpm exec cap add ios` | iOS platform añadida (deployment target 15.0, SPM default) |
| 18 | `pnpm exec cap sync` | Sync OK |

---

## Escenarios BDD (verificación del scaffold)

### Escenario 1 — Instalación reproducible

**Dado** un checkout limpio con `nvm 0.40.3` instalado
**Cuando** se ejecuta `nvm use` (lee `.nvmrc` con `24`) + `pnpm install`
**Entonces** resuelve todas las deps sin warnings críticos
**Y** existe sólo `pnpm-lock.yaml` (no `package-lock.json` ni `yarn.lock`).

### Escenario 2 — Typecheck verde

**Dado** el scaffold generado
**Cuando** se ejecuta `pnpm typecheck`
**Entonces** retorna exit 0 sin errores TypeScript 6.x.

### Escenario 3 — Build web

**Dado** el scaffold configurado
**Cuando** se ejecuta `pnpm build`
**Entonces** finaliza sin errores
**Y** genera `www/index.html` y assets esperados para Capacitor 8.

### Escenario 4 — Tests verdes (smoke)

**Dado** el scaffold generado
**Cuando** se ejecuta `pnpm exec ng test --watch=false`
**Entonces** los smoke tests pasan (2/2 con Vitest 4 + jsdom).

### Escenario 5 — Lint verde

**Dado** el scaffold generado
**Cuando** se ejecuta `pnpm lint`
**Entonces** "All files pass linting" (ESLint 9 + angular-eslint 22.0.0 flat config).

### Escenario 6 — Capacitor iOS + Android añadidos

**Dado** que el scaffold está completo
**Cuando** se inspecciona el repo root
**Entonces** existen las carpetas `ios/` y `android/`
**Y** `android/variables.gradle` declara `compileSdkVersion = 36, targetSdkVersion = 36`
**Y** `ios/App/App.xcodeproj/project.pbxproj` declara `IPHONEOS_DEPLOYMENT_TARGET = 15.0`.

### Escenario 7 — Capacitor sync OK

**Dado** que iOS y Android están añadidos
**Cuando** se ejecuta `pnpm exec cap sync`
**Entonces** sincroniza web assets a ambas plataformas sin errores.

### Escenario 8 — `appId` y `appName` correctos

**Dado** que se generó el scaffold
**Cuando** se inspecciona `capacitor.config.ts`
**Entonces** `appId === 'mx.com.tags.movil'`
**Y** `appName === '101tags'`.

### Escenario 9 — Theming 101tags centralizado

**Dado** que se renderiza el shell de la app
**Cuando** se inspecciona `src/theme/variables.scss`
**Entonces** `--ion-color-primary: #E31E24`, `--ion-color-dark: #0a0a0a`, `--ion-color-medium: #F5F5F5` están definidos
**Y** `--ion-font-family: 'Montserrat', system-ui, sans-serif`.

### Escenario 10 — Environments correctos

**Dado** un build de desarrollo
**Cuando** se inspecciona `src/environments/environment.ts`
**Entonces** `apiBaseUrl === 'http://localhost:8000/api'` y `production === false`.

### Escenario 11 — Estructura de carpetas M0.2 presente

**Dado** el scaffold generado
**Cuando** se inspecciona `src/app/`
**Entonces** existen las carpetas `core/{guards,interceptors,models,services}/`, `shared/{components,directives,pipes}/` y `pages/` (con `.gitkeep`).

### Escenario 12 — Documentos del repo preservados

**Dado** que se ejecutó `rsync -a` para traer el scaffold
**Cuando** se inspecciona el repo root
**Entonces** `AGENTS.md`, `PLAN.md`, `DISCOVERY.md`, `TASKS.md`, `ISSUES.md`, `README.md`, `STATE.md`, `.agent/`, `.spec/` están intactos.

---

## Verification final (real, ejecutada)

| Comando | Exit | Detalle |
|---|---|---|
| `nvm use 24` | OK | Node v24.21.0 |
| `pnpm install` | 0 | 208 packages, 7.1s, sólo `pnpm-lock.yaml` |
| `pnpm typecheck` | 0 | tsc 6.0.3, sin errores |
| `pnpm build` | 0 | 4.476s, `www/index.html` + assets |
| `pnpm exec ng test --watch=false` | 0 | 2/2 tests, Vitest 4.1.11 + jsdom 26 |
| `pnpm lint` | 0 | "All files pass linting" |
| `pnpm exec cap add android` | 0 | compileSdk 36, targetSdk 36 |
| `pnpm exec cap add ios` | 0 | iOS 15.0, SPM default |
| `pnpm exec cap sync` | 0 | Sync OK en 0.245s |

## Discrepancias con specs previos (D9, D10)

| # | Discrepancia | Resolución |
|---|---|---|
| D9 | `appId`: PLAN.md y `.spec/00-ionic-scaffold.md` dicen `mx.com.101tags.movil`. Capacitor rechazó (segmento `101tags` empieza con dígito, no permitido por Java package spec). Usado `mx.com.tags.movil`. | Aceptado. Las specs se actualizan en una tarea futura de cleanup documental. Si el usuario quiere conservar el branding literal `101tags`, opciones: `com.tags.movil`, `mx.com.101tagsMovil` (sin dash, capitalización alterna — todavía rechazado), o registrar un dominio propio y usar `mx.tags.movil`. |
| D10 | M0.2 spec proponía `app.config.ts` separado; Angular 22 CLI genera todo en `main.ts`. | Aceptado: la práctica moderna es consolidar providers en `main.ts`. La spec M0.5 puede mantener `main.ts` (más simple) o separar `app.config.ts` (más prolijo). |

## Checklist

- [x] Branch `chore/m0-4-workspace-ionic` creada desde `origin/chore/m0-3-validar-versiones`.
- [x] `ionic start` ejecutado con stack Angular 22 + Ionic 9 + Capacitor 8.
- [x] Scaffold movido a repo root preservando docs existentes.
- [x] `capacitor.config.ts` personalizado (appId, appName, plugins, theme).
- [x] `src/theme/variables.scss` con colores 101tags.
- [x] `src/environments/` con apiBaseUrl dev/prod.
- [x] Estructura `core/{guards,interceptors,models,services}/`, `shared/{components,directives,pipes}/`, `pages/` creada.
- [x] `package.json` con versiones M0.3 + scripts.
- [x] `pnpm install` exit 0.
- [x] `pnpm typecheck` exit 0.
- [x] `pnpm build` exit 0 + `www/index.html` generado.
- [x] `pnpm exec ng test --watch=false` 2/2 verdes.
- [x] `pnpm lint` exit 0.
- [x] `cap add android` exit 0 (compileSdk 36, targetSdk 36).
- [x] `cap add ios` exit 0 (iOS 15.0, SPM default).
- [x] `cap sync` exit 0.
- [x] Sin secretos commiteados.
- [x] `.gitignore` cubre artifacts nativos (Pods, .gradle, etc.).
- [x] `STATE.md` actualizado.

## Notas finales

- **Tests reales en M0.6**. Los 2 smoke tests son los defaults del template Ionic; se enriquecerán en M0.6 y F1+.
- **Compilación nativa pendiente en máquina destino**. `ios/` y `android/` están generadas; la compilación requiere macOS (Xcode) o entorno con Android SDK. El scaffold está listo para abrir en Xcode (`pnpm cap:open:ios`) o Android Studio (`pnpm cap:open:android`).
- **Pre-merge de M0.1, M0.2, M0.3 pendiente**. Esta rama se construye sobre `chore/m0-3-validar-versiones`. Si el usuario quiere mergear en orden estricto, hay que mergear M0.1 → M0.2 → M0.3 → M0.4.
- **PR a abrir al final**: el usuario pidió un PR para M0.4 y aprobar/mergear los 4 PRs.
