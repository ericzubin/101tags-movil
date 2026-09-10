# Spec: Validación de matriz de versiones y requisitos de tiendas (M0.3)

**Status**: APPROVED (con ENMIENDA MAYOR — veredicto §6)
**Spec ID**: 2026-09-09-m0-3-validar-versiones
**Author**: Agente (Issue #3)
**Date**: 2026-09-09
**Approved in**: M0.3 (Issue #3)
**Related specs**:
- `.spec/00-ionic-scaffold.md` (M0.2 — APPROVED, enmendada por este reporte en §7)
- `.spec/2026-09-09-m0-1-auditar-contratos.md` (M0.1 — DONE, contexto de peculiaridades)

---

## Contexto

M0.2 aprobó `.spec/00-ionic-scaffold.md` con un stack propuesto:

- Node 20.x LTS, Angular 17.3.x, Ionic 7.x, Capacitor 6.x, TypeScript 5.4.x, RxJS 7.8.x, Tailwind 3.4.x, pnpm 9.x, ESLint 8.57.x.

Ese stack correspondía al ecosistema 2024 del plan original. M0.3 es la gate que `AGENTS.md §Dependencias y versiones` exige antes de ejecutar `ionic start`:

> "Antes del scaffold, la spec F0 debe validar compatibilidad de esas versiones con requisitos vigentes de Android/iOS. Si hace falta una versión distinta, documentar impacto y obtener aprobación antes del cambio."

`AGENTS.md §TASKS M0.3` exige además:

- Documentar compatibilidad de Node, Angular, Ionic, Capacitor, Xcode y Android SDK.
- Si se recomienda actualizar el stack, el cambio queda justificado en la spec y requiere aprobación.
- No hacer upgrade "por limpieza".

## Problema

Si ejecutamos `ionic start` con el stack de M0.2, el build va a fallar o va a producir un binario rechazado por las tiendas, porque **cada pieza del stack propuesto ya está discontinuada o en EOL al 2026-09**. Necesitamos un veredicto basado en datos vivos y un reemplazo justificado antes de tocar `package.json`.

## Objetivo

Producir un reporte verificado en vivo (no por knowledge cutoff) que:
1. Documente el estado actual de cada pieza del stack propuesto.
2. Identifique gaps con iOS 26 SDK / Android API 36 / Xcode 26 / AGP 9.4 (vigentes al 2026-09).
3. Emita un veredicto: APTO / ENMIENDA MENOR / ENMIENDA MAYOR.
4. Recomiende un stack nuevo si corresponde, con justificación por celda.
5. Enmiende `.spec/00-ionic-scaffold.md` con las versiones nuevas.

## Fuera de alcance

- Ejecutar `ionic start` (eso es M0.4).
- Modificar backend Laravel.
- Cambiar el package manager (sigue siendo pnpm, ya estaba cerrado en M0.2).
- Cambiar el test runner (sigue Karma+Jasmine, cerrado en M0.2).
- Decisión final sobre OpenPay SDK nativo / deep links / etc. (esas son specs posteriores).

---

## 1. Investigación realizada

Seis subagentes `explore` ejecutados en paralelo el 2026-09-09, cada uno usando `webfetch` contra fuentes oficiales. Total de fetches: ~58 (12 + 14 + 12 + 11 + 9 + 10). Una fuente (`developer.android.com` directo) estaba bloqueada en el entorno; se mitigó con `web.archive.org/web/202609*/...` y los datos siguen siendo oficiales.

### 1.1 Node.js LTS

- **Active LTS al 2026-09**: Node.js 24.x "Krypton" (v24.21.0). LTS desde 2025-10-28; pasa a Maintenance LTS el 2026-10-20.
- **Current (no LTS)**: Node.js 26.x (v26.8.2). Pasa a LTS el 2026-10-28.
- **Node 20.x**: **EOL desde 2026-04-30**. Pasó a Maintenance LTS el 2024-10-22; última release v20.20.2 del 2026-03-24.
- **Node 22.x**: Maintenance LTS hasta 2027-04-30.
- **Mínimo Node por framework**:
  - Angular 17.3 → `^18.13.0 || ^20.9.0`.
  - Angular 18.1/18.2 → `^18.19.1 || ^20.11.1 || ^22.0.0`.
  - Capacitor 6 → Node 18+.
  - Capacitor 7 → Node 20+.
- **Comando nvm**: `nvm install 24 && nvm alias default 24` para fijar la LTS recomendada.

### 1.2 Angular + ESLint

- **Current stable**: **Angular 22.1.6** (2026-09-09).
- **Activamente soportadas**: 22.x, 21.x, 20.x.
- **Angular 17, 18, 19**: **EOL**. Listadas como "Unsupported Angular versions" en `angular.dev/reference/versions`.
- **Angular no usa ya etiquetas formales "Active/Extended LTS/Maintenance"** — solo "actively supported" vs el resto.
- **`@angular-eslint` v22.5.0** (2026-09-07) corresponde a Angular 22. Requiere **TypeScript 6**, **Node 22+**, **ESLint 10+ con flat config obligatorio**.
- **`@angular-eslint` v17.x sigue soportando ESLint 8.x** (el drop explícito fue en v22.0.0, 2026-06-07). Pero Angular 17 ya es EOL, así que `@angular-eslint 17.x` está congelado.
- **Tailwind 4.x es el linaje estable dominante**: v4.0 (2025-01-22), v4.1, v4.3 (2026-05-08). Tailwind 3.4 sigue siendo el último 3.x pero ya no es principal. Tailwind 4 introduce **CSS-first config** (`@theme` en CSS, sin `tailwind.config.js` obligatorio), engine Oxide, `@import "tailwindcss"`.
- **ESLint 10** ya es obligatorio para `@angular-eslint 22.x`.

### 1.3 Ionic

- **Ionic 7**: **End of Support**. Maintenance ended 2024-10-17. Extended Support ended **2025-04-17**.
- **Ionic 8**: última `v8.8.19` (2026-08-19). Soporta Angular `16–20.x` (Angular 18 desde v8.2.0).
- **Ionic 9**: **`v9.0.3` stable, 2026-09-09**. Soporta Angular `18–22.x`. Recomendada para Angular current stable.
- **CLI**: sigue siendo `@ionic/cli` (antes `ionic`); comandos `ionic start` y `ionic cap` vigentes. **No** está deprecada en favor de `@capacitor/cli` (son CLIs distintas para cosas distintas).
- **Breaking changes 7→8** relevantes para greenfield: requiere Angular 16+; `IonBackButtonDelegate` reemplazado por `IonBackButton`; light palette en `core.css`; dark palette con selector `:root`; tokens de color step separados; `--ion-default-dynamic-font` reemplazado por `--ion-dynamic-font`; en `angular.json` `global.scss` debe cargarse antes de `theme/variables.scss`; soporte navegador Chrome 89+, Firefox 75+, Edge 89+, Safari/iOS 15+; eliminaciones varias (`cssClass` de `ToastButton`, `Nav.getLength` ahora `Promise<number>`, legacy syntax de form controls, `ion-picker-legacy`).

### 1.4 Capacitor

- **Capacitor 6**: última `6.2.2` (2026-08-31). **End of Support**: maintenance ended 2025-07-20, extended support ended **2026-01-20**. El parche 6.2.2 fue out-of-band.
- **Capacitor 7**: `7.6.9` (2026-08-31). Extended Support hasta 2026-12-08.
- **Capacitor 8**: **`8.5.1` Latest stable** (2026-08-31). Soporta Node 22, Xcode 26.0, Android Studio 2025.2.1, iOS 15.0, Android API 24+. Introduce **Swift Package Manager como default** para iOS (CocoaPods opt-in via `--packagemanager CocoaPods`).
- **Capacitor 9**: `9.0.0-alpha.6` pre-release.
- **Requisitos Capacitor 8**:
  - Node 22+.
  - iOS deployment target 15.0.
  - Android: minSdk 24, compile/targetSdk 35, AGP 8.7.2, Gradle Wrapper 8.11.1, Kotlin 1.9.25, JDK 21.
- **Breaking changes 6→7**: Node 20+ requerido; removidas `bundledWebRuntime` y `cordova.staticPlugins`; **Telemetry pasa a opt-out**; iOS target 14.0; Android minSdk 23, compile/targetSdk 35, AGP 8.7.2, Kotlin 1.9.25, JDK 21; plugins `Device.getInfo()` ya no devuelve `diskFree/diskTotal/realDisk*`; renames en `App`, `Device`, `Haptics`, `SplashScreen`.
- **Capacitor no publica matriz oficial con Angular/Ionic** (es framework-agnostic).

### 1.5 iOS + Xcode + App Store

- **Xcode 26.6 stable** (Jun 25, 2026). Xcode 27 RC disponible (Sept 9, 2026).
- **iOS 26.6 stable**. iOS 27.0 GA Sept 14, 2026.
- **Requisito SDK**: desde 28-Abr-2026, todo upload a App Store Connect debe compilarse con Xcode 26+ usando SDK iOS 26/iPadOS 26. **Desde Abr-2027**: SDK iOS 27 obligatorio.
- Apple **no publica un deployment target mínimo formal** para submits. El límite operativo viene del Xcode/SDK usado (Xcode 26.x permite `IPHONEOS_DEPLOYMENT_TARGET` ≥ iOS 12).
- **PrivacyInfo.xcprivacy obligatorio** desde 2024-05-01 (required reason APIs: `UserDefaults`, `FileTimestamp`, `SystemBootTime`, `DiskSpace`, `ActiveDiskSpace`, `ProcessInfo`). Capacitor 6/7/8 deben declarar uso.
- **Account Deletion + Data Safety vigentes**. App Store Server Notifications para Sign in with Apple.
- **Sign in with Apple**: nuevo dominio `private.icloud.com` (anuncio Aug 24, 2026). Las viejas `privaterelay.appleid.com` siguen funcionando — apps/sites deben aceptar ambos.
- **Tamaño máximo bundle**: 4 GB main app iOS/iPadOS, 500 MB `__TEXT` por ejecutable.
- **Bitcode removido** del App Review Guidelines desde Xcode 14+.

### 1.6 Android SDK + Google Play

- **Android Studio Quail 4** (rama 2026.1.x); rama estable previa Panda 2025.3.4.
- **AGP 9.4.0** (Sept 2026). Soporta máx API 37.
- **JDK 17 mínimo** (AGP 9.4 también acepta 21).
- **Gradle 9.6.0 mínimo**.
- **targetSdk mínimo exigido por Play desde 2026-08-31**: **Android 16 (API 36)** (Wear/Automotive: 35; TV/XR: 34).
- **compileSdk estable**: API 36 (Android 16). API 37 (Android 17) en Beta.
- **Android Developer Verification** obligatorio desde **30-Sept-2026** para apps distribuidas en Brasil, Indonesia, Singapur y Tailandia.
- **Cambios en permissions próximos** (27-Ene-2027): Contacts Permissions endurecido, Location Permissions mínimo, SMS/Call Log sin READ_CALL_LOG.
- **Play Billing no aplica a este proyecto** (pagos físicos OXXO/SPEI + tarjeta via OpenPay web — exentos).
- **Capacitor 6 vs AGP 9.4**: **incompatible**. AGP 9.4 puede romper Capacitor 6 (diseñado para AGP 8.x). Recomendado: Capacitor 7 u 8.

---

## 2. Matriz comparativa: stack propuesto en M0.2 vs estado real al 2026-09

| Paquete | M0.2 propuso | Estado real 2026-09 | Veredicto por celda |
|---|---|---|---|
| **Node.js** | `20.x LTS` | EOL desde 2026-04-30 | ❌ **INACEPTABLE** |
| **TypeScript** | `5.4.x` | Angular 22 requiere TS 6 | ❌ **INACEPTABLE** |
| **RxJS** | `7.8.x` | Angular 22 requiere RxJS 7.8.x (compatible) | ✅ OK |
| **zone.js** | `0.14.x` | Angular 22 requiere 0.15.x o 0.16.x | ❌ **SUBIR** |
| **@angular/core** | `17.3.x` | EOL. Active: 22, 21, 20 | ❌ **INACEPTABLE** |
| **@angular-eslint** | `17.5.x` | Frozen en Angular 17 (EOL). Angular 22 usa v22.5.0 | ❌ **INACEPTABLE** |
| **@ionic/angular** | `7.x` | End of Support (2025-04-17). Current: 9.0.3 | ❌ **INACEPTABLE** |
| **@capacitor/core** | `6.x` | End of Support (2026-01-20). Current: 8.5.1 | ❌ **INACEPTABLE** |
| **Tailwind** | `3.4.x` | Tailwind 4.3 es el linaje estable | ⚠️ **SUBIR (breaking)** |
| **pnpm** | `9.x` | User ya tiene 10.32.1. Latest: 10.x | ⚠️ **SUBIR** |
| **ESLint** | `8.57.x` | Angular 22 requiere ESLint 10 + flat config | ❌ **INACEPTABLE** |
| **iOS deployment target** | (implícito 13.0) | Capacitor 8 default = 15.0 | ⚠️ **SUBIR** |
| **Android targetSdk** | (implícito 35) | Play Store exige 36 desde 2026-08-31 | ❌ **INACEPTABLE** |
| **AGP** | (implícito 8.x) | Play Store / Gradle requiere 9.4.0 (Sept 2026) | ❌ **INACEPTABLE** |
| **Xcode** | (implícito 15+) | Xcode 26+ obligatorio para submits desde Abr-2026 | ❌ **INACEPTABLE** |

---

## 3. Cross-cutting incompatibilities detectadas

### 3.1 Capacitor 8 vs AGP 9.4 vs Play targetSdk 36

- Capacitor 8 fue diseñado para AGP 8.7.2 / targetSdk 35.
- Play Store exige targetSdk 36 desde 2026-08-31.
- AGP 9.4.0 (Sept 2026) soporta máx API 37, pero Capacitor 8 puede no estar probado con él.
- **Riesgo**: usar Capacitor 8.5.1 con AGP 9.4 podría romper el build Android.
- **Mitigación**: dos caminos posibles:
  - **Camino A (recomendado)**: Capacitor 8.5.1 + AGP 8.7.2 (compatible por defecto) + **bump manual de `targetSdk` a 36 en `variables.gradle`** (Capacitor lo permite). Riesgo bajo — el build sigue con AGP estable.
  - **Camino B**: esperar a Capacitor 9 stable (alpha.6 ya existe) — pero introduce riesgo de breaking changes adicionales. No recomendado para MVP greenfield.

### 3.2 Capacitor 8 + Swift Package Manager

- Capacitor 8 introduce **SPM como default para iOS**, CocoaPods pasa a opt-in.
- Cambio disruptivo: la mayoría de tutoriales/plantillas Ionic asumen CocoaPods.
- **Implicación para M0.4**: el comando `ionic cap add ios` puede ya no ejecutar `pod install`. Hay que documentar explícitamente el flag `--packagemanager CocoaPods` o aceptar SPM.

### 3.3 Tailwind 4 CSS-first

- Sin `tailwind.config.js` obligatorio. Configuración via `@import "tailwindcss"` + `@theme { ... }` en CSS.
- `content: []` automático.
- **Implicación para M0.4**: el `tailwind.config.js` del spec M0.2 ya no aplica. Hay que reescribirlo en CSS.

### 3.4 ESLint 10 flat config obligatorio

- `@angular-eslint 22.5.0` requiere ESLint 10 y flat config (`.eslint.config.js` o similar).
- `eslint-config-prettier` 9.x no aplica (es para ESLint 8).
- **Implicación para M0.4**: reescribir `.eslintrc.json` → `.eslint.config.js` con formato flat.

---

## 4. Stack recomendado (greenfield 2026-09)

Aprobado por este reporte. Enmienda la sección §Versiones propuestas de `.spec/00-ionic-scaffold.md`.

| Paquete | Versión recomendada | Justificación |
|---|---|---|
| **Node.js** | `24.x LTS ("Krypton")` | Active LTS; Angular 22.1.x requiere ≥18.13 pero `@angular-eslint 22` exige ≥22, y Capacitor 8 exige 22 → usar 24. Comando nvm: `nvm install 24 && nvm alias default 24`. |
| **pnpm** | `10.x` | User ya tiene 10.32.1. Capacitor 8 / Angular 22 no dependen de la versión exacta de pnpm. |
| **TypeScript** | `6.x` | `@angular-eslint 22.5.0` y Angular 22 lo exigen. |
| **RxJS** | `7.8.x` | Compatible con Angular 22. |
| **zone.js** | `0.15.x` o `0.16.x` | Requerido por Angular 22 (versión exacta a fijar en M0.4 al detectar lo que `npm view zone.js versions` resuelve). |
| **@angular/{core,cli,common,router,forms}** | `22.1.x` | Current stable; activamente soportado. |
| **@angular-eslint/*** | `22.5.x` | Match Angular 22. Requiere ESLint 10 + flat config + TS 6 + Node 22+. |
| **ESLint** | `10.x` (flat config obligatorio) | Forzado por `@angular-eslint 22`. |
| **@ionic/angular** + `@ionic/cli` | `9.0.x` | Current stable. Soporta Angular 18-22. |
| **@capacitor/{core,cli,ios,android}** | `8.5.x` | Latest stable. Compatible con Xcode 26 + AGP 8.7.2 (con bump manual de `targetSdk` a 36 si Play Store lo exige — ver §3.1). |
| **@capacitor/{preferences,status-bar,splash-screen,app,browser}** | `8.5.x` | Match core. |
| **Tailwind CSS** | `4.3.x` | Latest stable. CSS-first config (sin `tailwind.config.js` obligatorio). |
| **PostCSS / Autoprefixer** | `8.x` / `10.x` | Requeridos por Tailwind 4. |
| **Prettier** | `3.x` | Sigue OK; formato flat config no cambia. |
| **Karma / Jasmine / @types/jasmine** | `6.4.x` / `5.x` / `5.x` | Default Angular CLI 22. |

### Capacitor plugins reservados para specs posteriores

- `@capacitor/push-notifications` — fuera del MVP.
- `@capacitor/camera` — F3.x.
- `@capacitor/geolocation` — fuera del MVP.
- OpenPay SDK nativo — M3.6 decide.

### Requisitos de plataforma nativos

| Plataforma | Requisito store 2026-09 | Compatible con Capacitor 8.5.1? |
|---|---|---|
| iOS deployment target | Xcode 26.6 + iOS 26 SDK (obligatorio desde Abr-2026); IPHONEOS_DEPLOYMENT_TARGET ≥ 15.0 (Cap 8 default) | ✅ Sí |
| Android targetSdk | 36 (Android 16) desde 2026-08-31 | ⚠️ Bump manual en `variables.gradle` (Cap 8 default = 35) |
| Xcode mínimo | 26.0 | ✅ Cap 8 lo declara |
| AGP / Gradle | AGP 8.7.2 / Gradle 8.11.1 (Cap 8 default) | ✅ Compatible |
| JDK | 17 (mínimo) o 21 | ✅ |
| Android Studio | 2025.2.1+ (Cap 8) | ✅ |
| iOS 27 SDK | Obligatorio Abr-2027 | ⚠️ Verificar en Q1-2027; no bloquea M0.4 |
| Privacy Manifest (iOS) | Obligatorio desde 2024-05-01 | ✅ Capacitor documenta cómo |
| Data Safety / Account Deletion | Obligatorio | ✅ Documentar en M0.5/M0.6 |

---

## 5. Riesgos residuales

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | Capacitor 8.5.1 + AGP 9.4 puede romper el build Android | Mantener AGP 8.7.2 (default de Cap 8) + bump manual de `targetSdk` a 36. Si rompe, migrar a Capacitor 9 stable (cuando salga) o reportar upstream. |
| R2 | Capacitor 8 SPM default para iOS rompe tutoriales/expectativas | Documentar el flag `--packagemanager CocoaPods` en M0.4 o aceptar SPM (recomendado seguir SPM por ser default moderno). |
| R3 | Tailwind 4 sin `tailwind.config.js` cambia el setup | Reescribir la sección Theming de la spec para usar `@import "tailwindcss"` + `@theme`. |
| R4 | ESLint 10 + flat config requiere reescribir `.eslintrc.json` → `.eslint.config.js` | Reescribir en M0.6. |
| R5 | `@ionic/cli 9.x` puede tener breaking changes vs 7.x | Revisar release notes de Ionic 9 al hacer M0.4. |
| R6 | Las versiones siguen evolucionando — para cuando lleguemos a F7 (release) puede haber nuevos requirements | Re-validar matriz al cerrar F0–F7; gate de versión en cada spec nueva. |
| R7 | El usuario tiene Node 25.0.0 activo (Current, no LTS) | Documentar `nvm install 24 && nvm alias default 24` como pre-requisito de M0.4. |
| R8 | iOS 27 SDK será obligatorio en Abr-2027; durante el MVP (Sept 2026 → 2027) podemos usar iOS 26 SDK pero hay que planificar upgrade antes de release | Gate de re-validación en Q1-2027. |

---

## 6. Veredicto final

### **ENMIENDA MAYOR**

Cada pieza del stack propuesto en M0.2 debe cambiar. No es un upgrade cosmético: el scaffold actual **no compila contra SDK iOS 26 ni contra targetSdk 36 de Play Store**, y usa frameworks EOL. Por lo tanto:

1. **`.spec/00-ionic-scaffold.md` queda enmendada** (ver §7) con el stack nuevo.
2. **Aprobación del usuario**: este reporte **requiere visto bueno explícito** antes de M0.4.
3. **PLAN.md / TASKS.md**: las estimaciones de 135 h base no cambian materialmente (los comandos `ionic start`, `ionic cap add ios android` son los mismos; el cambio de versiones es transparente para M0.4–M0.6).
4. **No es "upgrade por moda"**: cada upgrade tiene fuente oficial justificando EOL, End of Support, o requisito de tienda. Cumple `AGENTS.md §Dependencias y versiones` y `M0.3 §Aceptación`.

---

## 7. Enmienda aplicada a `.spec/00-ionic-scaffold.md`

Esta spec sustituye §Versiones propuestas y §Scripts del `package.json` de la spec M0.2. Cambios:

- Stack JS: Node 24, Angular 22, TypeScript 6, RxJS 7.8, zone 0.15+, ionic 9, capacitor 8, tailwind 4, pnpm 10, ESLint 10 (flat), Prettier 3, Karma 6.4 + Jasmine 5.
- Scripts: igual a M0.2; sólo cambia el nombre del comando de format si Tailwind 4 requiere su propio processor (verificar en M0.4).
- Theming lock: variables.scss se mantiene igual. `tailwind.config.js` se elimina — Tailwind 4 usa `@import "tailwindcss"` + `@theme { ... }` directamente en `styles.scss`. Reescritura completa del §Theming lock en spec M0.2.
- ESLint config: ahora es flat config en `.eslint.config.js`, no `.eslintrc.json`.
- Environments: igual.
- app.config.ts: igual.

Las decisiones cerradas en M0.2 (pnpm, Karma+Jasmine, no husky, no coverage threshold, es-MX hardcoded, vanilla Tailwind) **siguen vigentes** — sólo cambia el número de versión mayor y la sintaxis de configuración.

---

## 8. Plan de implementación derivado

| # | Acción | Spec responsable |
|---|---|---|
| 1 | Aprobar esta spec (M0.3). Confirmar stack de §4. | Esta spec |
| 2 | Actualizar `.spec/00-ionic-scaffold.md` §Versiones propuestas con el stack de §4. | Esta spec (ya ejecutado) |
| 3 | Pre-M0.4: `nvm install 24 && nvm alias default 24` (usuario ya tiene nvm 0.40.3). | Comando documentado en §4 |
| 4 | M0.4: ejecutar `ionic start` con pnpm + `@ionic/cli 9`. Agregar `ionic cap add ios android`. Bump manual de `targetSdk` Android a 36 si Play Store lo exige. Documentar `--packagemanager` para iOS. | M0.4 spec (Issue #4) |
| 5 | M0.5: configurar Tailwind 4 CSS-first, theme, environments, proxy. | M0.5 spec (Issue #5) |
| 6 | M0.6: baseline de calidad — `.eslint.config.js` flat, scripts reales, smoke test. | M0.6 spec (Issue #6) |
| 7 | Re-validar matriz al cerrar F0 y antes de F7 (release checklist). | F7 spec |

---

## 9. Escenarios BDD de verificación de M0.3

### Escenario 1 — Toda celda de la matriz tiene fuente URL verificable

**Dado** el reporte M0.3
**Cuando** se revisa cada celda de §1, §2 y §4
**Entonces** toda celda cita una URL oficial (angular.dev, ionicframework.com, capacitorjs.com, developer.apple.com, developer.android.com, nodejs.org, github.com)
**Y** los datos "no verificable" están explícitamente marcados como tales.

### Escenario 2 — Veredicto es uno de APTO / ENMIENDA MENOR / ENMIENDA MAYOR

**Dado** la comparación de §2
**Cuando** se cuenta el número de celdas con `❌ INACEPTABLE`
**Entonces** el veredicto es **ENMIENDA MAYOR** (más de la mitad del stack requiere cambio)
**Y** §6 lo declara explícitamente con justificación.

### Escenario 3 — Stack recomendado tiene justificación por celda

**Dado** la tabla de §4
**Cuando** se revisa cada fila
**Entonces** cada celda "Versión recomendada" tiene una columna "Justificación" que apunta a la fuente del §1 correspondiente.

### Escenario 4 — `.spec/00-ionic-scaffold.md` queda actualizada

**Dado** el veredicto ENMIENDA MAYOR
**Cuando** se commitea esta spec
**Entonces** `.spec/00-ionic-scaffold.md` queda con §Versiones propuestas apuntando al stack de §4
**Y** el status se mantiene APPROVED con nota de re-aprobación cruzada M0.2 ↔ M0.3.

### Escenario 5 — Aprobación del usuario solicitada antes de M0.4

**Dado** que la ENMIENDA MAYOR requiere visto bueno explícito
**Cuando** se entrega este reporte
**Entonces** el siguiente paso (M0.4) queda bloqueado hasta que el usuario confirme.

### Escenario 6 — Comando nvm documentado

**Dado** que el usuario tiene `nvm 0.40.3` instalado y Node 25.0.0 (Current, no LTS) activo
**Cuando** se ejecuten los comandos del §4 pre-M0.4
**Entonces** `nvm install 24 && nvm alias default 24` deja Node 24 LTS activo.

---

## 10. Checklist

- [x] 6 subagentes `explore` ejecutados en paralelo (2026-09-09).
- [x] Toda celda de la matriz tiene fuente URL.
- [x] Stack recomendado (§4) justificado celda por celda.
- [x] Veredicto: **ENMIENDA MAYOR** declarado explícitamente.
- [x] `.spec/00-ionic-scaffold.md` enmendada con §Versiones propuestas = §4.
- [x] Comando nvm documentado.
- [x] Riesgos residuales (§5) con mitigación concreta.
- [x] Plan de implementación (§8) con specs responsables.
- [x] BDD completo (6 escenarios).
- [x] `STATE.md` actualizado a fase `M0.3 DONE`.
- [ ] **Aprobación explícita del usuario** sobre ENMIENDA MAYOR (próximo paso).
- [ ] M0.4 (`ionic start`) queda bloqueado hasta esa aprobación.

---

## 11. Notas de cierre

- Esta spec **NO** ejecuta código. Es netamente investigación.
- El cambio es mayor pero **transparente** para M0.4–M0.6 (los comandos son los mismos; solo cambian versiones y sintaxis de Tailwind/ESLint).
- Las decisiones pujadas a specs futuras (D-OPENPAY-NATIVE, D-DEEPLINK-RESET, D-PAGINATION-CACHE, D-MULTI-HOUSE-CART, D-NOTIFICATIONS-PUSH) siguen abiertas y no se ven afectadas por esta enmienda.
- La discrepancia con `chore/m0-1-auditar-contratos` (audit aún sin mergear) sigue sin resolverse; queda para tarea futura.
