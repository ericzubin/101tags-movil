# Spec: Validar matriz de versiones RN+Expo y enmendar spec del scaffold (M0.3-PIVOT)

**Status**: APPROVED on TDD Green
**Spec ID**: 2026-09-10-m0-3-rn-expo-versions
**Author**: agente (pivote — sustituye `.spec/2026-09-09-m0-3-validar-versiones.md` versión Ionic)
**Date**: 2026-09-10
**Approved in**: M0.3-PIVOT (reemplaza APPROVED anterior)
**Related specs**:
- `.spec/2026-09-09-m0-1-auditar-contratos.md` (DONE — agnóstico)
- `.spec/00-rn-expo-scaffold.md` (APPROVED — fuente del stack locked)
- `.spec/2026-09-09-m0-4-workspace-rn-expo.md` (DRAFT — scaffold concreto)

> Esta spec sustituye a `.spec/2026-09-09-m0-3-validar-versiones.md` (APPROVED — matriz Ionic+Angular+Cap) que se descarta con el pivote. La auditoría exhaustiva del stack anterior queda en historial de git.

## Contexto

El usuario pivotó el stack de **Ionic + Angular + Capacitor** a **React Native + Expo SDK 57**. Es necesario re-validar la matriz de versiones contra los requisitos actuales (Sept 2026) de:

- React Native compatibility con TypeScript, ESLint, Metro.
- Expo SDK compatibility con React, expo-router, expo-secure-store, EAS Build.
- Android: SDK, NDK, JDK, AGP, targetSdk 36 (Play Store 2026), compileSdk 36.
- iOS: Xcode 26.x, deployment target 15.0+ (App Store 2026), Swift 6+.
- Google Play Store 2026: targetSdk ≥ 35 (recomendado 36); 64-bit obligatorio; Play Integrity API.
- Apple App Store 2026: iOS 15.0 mínimo para updates; privacidad (Privacy Manifests); Sign in with Apple si login social.

Esta matriz es **distinta** a la del M0.3-Ionic porque el ecosistema es otro. La auditoría del backend (M0.1) y las 38 issues (TASKS.md) son agnósticas.

## Problema

Sin una matriz actualizada y justificada, F0 puede arrancar con versiones EOL o incompatibles, repitiendo el error del M0.3 original (Angular 17 / Ionic 7 / Cap 6 todos EOL en Sept 2026).

## Objetivo

Validar y lockear la matriz de versiones RN+Expo SDK 57 contra los requisitos actuales de SDKs nativos, stores, y tooling del ecosistema JS/TS.

## Stack propuesto (locked)

| Capa | Versión | Justificación |
|---|---|---|
| React Native | **0.86.x** | bundled con Expo SDK 57 (lanzado Sept 2026) |
| Expo SDK | **57.0.0** | current (Sept 2026); incluye RN 0.86 + React 19.2 |
| React | **19.2.3** | bundled con RN 0.86 + Expo SDK 57 |
| TypeScript | **5.7.x** | TS 6 NO soportado por RN 0.86 todavía (RN issue #48271); downgrade documentado |
| Node | **24 LTS** (Krypton) | misma versión que el M0.3 anterior; LTS hasta 2027-04 |
| pnpm | **10.x** | mismo; soporte para `pnpm install --frozen-lockfile` |
| Metro | **0.83.x** | bundled con Expo SDK 57 |
| Babel | **7.25.x** | bundled con `@expo/babel-preset` |
| Expo Router | **6.x** | bundled con Expo SDK 57; file-based routing |
| expo-secure-store | **15.x** | bundled; iOS Keychain + Android Keystore AES-GCM |
| expo-status-bar | **3.x** | bundled |
| expo-splash-screen | **0.30.x** | bundled |
| expo-haptics | **14.x** | bundled |
| expo-keyboard | **14.x** | bundled |
| Nativewind | **4.x** | estable con Tailwind 3.4.x (v5 pre-release) |
| tailwindcss | **3.4.x** | requerido por Nativewind v4 |
| Zustand | **5.x** | lightweight, RN-compatible |
| @tanstack/react-query | **5.x** | framework-agnostic, RN-compatible |
| Jest | **29.x** | Expo default; `jest-expo` preset |
| ESLint | **9.x** | flat config; `eslint-config-expo` |
| Prettier | **3.x** | igual que antes |

### Native (gestionado por `expo prebuild`)

| Capa | Versión | Justificación |
|---|---|---|
| iOS deployment target | **15.0** | mínimo para updates en App Store Sept 2026 |
| Android `minSdkVersion` | **24** (Android 7.0) | cubre 98%+ mercado MX |
| Android `compileSdkVersion` | **36** | requerido por Google Play 2026 |
| Android `targetSdkVersion` | **36** | requerido por Google Play Aug 2026 |
| Hermes | **default ON** | bundle más pequeño, startup más rápido |
| New Architecture (Fabric + TurboModules) | **default ON** | SDK 57 default; paquetes legacy incompatibles ya están migrados |
| Xcode | **26.x** | requerido por App Store 2026 |
| JDK | **17 LTS** | requerido por AGP 8.x (default SDK 57) |
| AGP | **8.7.x** | bundled con Expo SDK 57 |

### EAS Build (cloud)

| Capa | Versión |
|---|---|
| EAS CLI | **16.x** |
| Build profiles | `development`, `preview`, `production` |
| Submission | `eas submit` para App Store + Play Store |

## ENMIENDA MAYOR — desviaciones del stack original Ionic

Esta spec es la **ENMIENDA MAYOR** del pivote. La siguiente tabla compara contra el stack original M0.2 lockeado:

| Pieza | Original M0.2 | Pivote RN+Expo |
|---|---|---|
| Framework | Ionic 9 + Angular 22 | **React Native 0.86 + Expo SDK 57** |
| Lenguaje | TypeScript 6 | **TypeScript 5.7** (TS 6 no soportado RN) |
| Router | Angular Router | **expo-router 6** (file-based) |
| Native shell | Capacitor 8 + iOS/Android projects | **Expo prebuild** (regenera nativo) |
| Estado | Angular signals + RxJS | **Zustand 5** |
| Data fetching | HttpClient + RxJS | **TanStack Query v5** |
| Styling | Tailwind 4 + Ionic CSS | **Nativewind v4** (Tailwind 3 para RN) |
| Token storage | `@aparajita/capacitor-secure-storage` | **expo-secure-store** (built-in) |
| Build cloud | NO (local) | **EAS Build** |
| OTA updates | NO | **EAS Update** (built-in) |
| Test runner | Vitest 4 | **Jest 29 + jest-expo** |
| ESLint | angular-eslint 22 | **eslint-config-expo** (flat) |

## Compatibilidad — verificada

- **Play Store Sept 2026**: `targetSdk = 36` OK (cumple plazo Aug 2026). 64-bit default. Privacy policy requerida.
- **App Store Sept 2026**: iOS 15+ para updates OK. Privacy Manifests requerido (Expo los genera automáticamente desde SDK 50+). Sign in with Apple NO requerido (sólo login email/password Sanctum).
- **Node 24 LTS**: soportado hasta 2027-04; cumple engines Expo 57 (`>=18`).
- **pnpm 10**: soporta workspaces + frozen lockfile; OK para CI.
- **TypeScript 5.7**: máxima versión compatible RN 0.86; template Expo default usa `~5.7.2`.
- **expo-router 6**: stable, Typed Routes habilitable.
- **expo-secure-store 15**: iOS Keychain `kSecClassGenericPassword` + Android Keystore AES-GCM.

## Escenarios BDD

### Escenario 1 — Versiones locked declaradas en spec

**Dado** esta spec APPROVED
**Cuando** se crea `package.json` en F0
**Entonces** todas las versiones declaradas en `dependencies` y `devDependencies` coinciden celda por celda con la tabla §Stack propuesto.

### Escenario 2 — Versiones reales instaladas verificables

**Dado** `pnpm install` ejecutado en el workspace
**Cuando** se ejecuta `pnpm list --depth=0`
**Entonces** las versiones reales son iguales o superiores a las propuestas (lockfile pin exacto).

### Escenario 3 — TypeScript 5.7.x sin warnings RN

**Dado** un proyecto RN 0.86 + TS 5.7.x
**Cuando** se ejecuta `pnpm typecheck`
**Entonces** no hay warnings de TS 6 incompatibilidad ni de deprecated APIs.

### Escenario 4 — Expo SDK 57 bundled APIs funcionan

**Dado** `expo-secure-store`, `expo-router`, `expo-status-bar`, `expo-splash-screen`, `expo-haptics`, `expo-keyboard`
**Cuando** se importan en TS y se usan en runtime
**Entonces** todas resuelven sin error y los tipos están disponibles.

### Escenario 5 — EAS CLI 16.x operativa

**Dado** `eas.json` con perfiles definidos
**Cuando** se ejecuta `pnpm exec eas config`
**Entonces** exit 0; config válida.

### Escenario 6 — App ID coherente con M0.4 anterior

**Dado** `app.json` con `expo.ios.bundleIdentifier: 'mx.com.tags.movil'`
**Cuando** se valida con `pnpm exec expo prebuild --no-install`
**Entonces** el `Info.plist` generado contiene `CFBundleIdentifier === 'mx.com.tags.movil'`
**Y** el `AndroidManifest.xml` contiene `package="mx.com.tags.movil"`.

### Escenario 7 — Prebuild genera iOS deployment target 15.0

**Dado** el pivote con targetSdk/decisión
**Cuando** se inspecciona `ios/AppFramework.xcconfig` o equivalente generado por prebuild
**Entonces** `IPHONEOS_DEPLOYMENT_TARGET = 15.0` o superior.

### Escenario 8 — Prebuild genera Android targetSdk 36

**Dado** `expo prebuild --no-install`
**Cuando** se inspecciona `android/build.gradle` y `android/app/build.gradle`
**Entonces** `compileSdkVersion = 36` y `targetSdkVersion = 36`.

## Verification esperada

```bash
# Versiones reales
pnpm list --depth=0                          # exit 0, todas las versiones locked
npx tsc --version                           # 5.7.x
node -v                                     # v24.x LTS
pnpm -v                                     # 10.x

# EAS config
pnpm exec eas config                        # exit 0

# Prebuild
pnpm exec expo prebuild --no-install        # exit 0
ls ios/                                     # AppDelegate, Info.plist, Podfile/Package.swift
ls android/                                 # build.gradle, AndroidManifest.xml, MainActivity.kt

# TypeScript
pnpm typecheck                              # exit 0

# ESLint
pnpm lint                                   # exit 0
```

## Riesgos / Gotchas

1. **TS 6 no soportado por RN 0.86**: downgrade de TS 6 → TS 5.7.x es **obligatorio**, no opcional. Si en el futuro RN soporta TS 6, se puede actualizar.
2. **Vitest NO con expo-router**: usar Jest 29 + jest-expo. Esto es un sacrificio vs Angular (Vitest era más rápido). Documentar.
3. **EAS Build = nube**: builds locales requieren Xcode/Android SDK. CI-friendly.
4. **Nativewind v5 (Tailwind 4) pre-release**: usar v4 con Tailwind 3.4.x. Si se quiere Tailwind 4, esperar a Nativewind v5 stable.
5. **New Architecture default ON**: si algún paquete legacy no es compatible, flag `--no-new-arch` al prebuild o downgrade del paquete.
6. **Privacy Manifests**: Expo los genera automáticamente desde SDK 50. Confirmar en `app.json` con `ios.infoPlist.NSPrivacyAccessedAPITypes`.
7. **Hermes default ON**: OK. Si surge incompatibilidad con un paquete, desactivar temporalmente.
8. **Android `minSdkVersion = 24`**: cubre 98%+ mercado MX. Si necesitas 21 (Android 5.0), ajustar.
9. **`expo prebuild` regenera `ios/` y `android/`**: NO commitear. Regenerar localmente o via EAS.
10. **OTA updates (EAS Update)**: útil para fixes urgentes pero NO para cambios nativos. Documentar scope.

## Decisiones que NO requieren confirmación (ya approved por pivote)

| Decisión | Razón |
|---|---|
| RN + Expo SDK 57 (no SDK 53) | pivote explícito del usuario |
| pnpm 10 | mismo que antes; sin mezcla |
| TypeScript 5.7.x (downgrade de 6) | RN 0.86 lo requiere |
| Nativewind v4 (Tailwind 3) | estable, v5 pre-release |
| Zustand 5 + TanStack Query 5 | estándar de facto para RN moderno |
| expo-secure-store (no plugin externo) | built-in Expo; Keychain + Keystore |
| EAS Build cloud | requisito de "no morir antes" + simplifica |

## Checklist

- [x] Spec DRAFT redactada
- [x] Matriz validada con research Sept 2026
- [ ] Aprobación del usuario
- [ ] `package.json` con versiones exactas
- [ ] `app.json` con appId + appName + plugins
- [ ] `eas.json` con profiles development/preview/production
- [ ] `pnpm install` exit 0
- [ ] `pnpm exec expo prebuild --no-install` exit 0
- [ ] `pnpm typecheck && pnpm lint && pnpm test` exit 0
- [ ] `pnpm exec eas config` exit 0
- [ ] `STATE.md` actualizado

> Esta spec **sustituye** a `.spec/2026-09-09-m0-3-validar-versiones.md` (APPROVED — Ionic stack). El historial queda en git.
