# PROJECT STATE — 101tags mobile

## Status
IN PROGRESS — F0 / M0.4-PIVOT cerrado (scaffold RN+Expo SDK 57 real generado)

## Adoption status
**Scaffold generado**. React Native 0.86 + Expo SDK 57 + Expo Router 6 + Nativewind v4 + Zustand 5 + TanStack Query 5 + Jest 29 + ESLint 9 + pnpm 10 + Node 24 LTS. `ios/` y `android/` regenerados con `expo prebuild`. Compilación nativa cloud via EAS Build (sin Xcode/Android SDK local).

## Current architecture

Workspace completo en repo root:
- `app.json` (Expo) + `eas.json` (EAS Build profiles).
- `app/` (expo-router file-based): `_layout.tsx`, `index.tsx`, `(tabs)/`, `(auth)/`.
- `src/core/{api,models,services,storage,query}/` con `secure-store.ts`, `client.ts`, `query/client.ts`, `.gitkeep`.
- `src/stores/auth-store.ts` (Zustand).
- `src/theme/tokens.ts` (brand 101tags + extras).
- `src/constants/env.ts` (apiBaseUrl, currency, locale).
- `src/global.css` (Tailwind directives).
- `babel.config.js` + `metro.config.js` + `tailwind.config.js` (Nativewind).
- `tsconfig.json` + `jest.config.js` + `jest.setup.js` + `eslint.config.js` (FlatCompat).
- `assets/images/` (icon, splash, favicon, android adaptive icons).
- `ios/` + `android/` regenerados con `expo prebuild` (regenerables; no commiteados a git).

## Stack (instalado y verificado)

| Capa | Versión real instalada |
|---|---|
| Node.js | 24.21.0 LTS (Krypton) |
| pnpm | 10.32.1 |
| Expo SDK | 57.0.21 |
| React Native | 0.86.3 |
| React | 19.2.3 |
| expo-router | 57.0.20 |
| expo-secure-store | 57.0.3 |
| expo-splash-screen | 57.0.8 |
| expo-status-bar | 57.0.1 |
| expo-system-ui | 57.0.3 |
| expo-build-properties | 1.0.9 |
| TypeScript | 5.9.3 |
| Jest | 29.7.0 |
| jest-expo | 57.0.2 |
| ESLint | 9.39.0 + eslint-config-expo 9.1.0 (FlatCompat) |
| Nativewind | 4.2.6 |
| Tailwind CSS | 3.4.17 |
| Zustand | 5.0.4 |
| @tanstack/react-query | 5.102.8 |
| Prettier | 3.6.2 |
| eas-cli | 24.0.0 |

### Native (gestionado por `expo prebuild`)

| Capa | Versión |
|---|---|
| iOS deployment target | 15.1 (default 16.4 para react-native itself) |
| Android `compileSdkVersion` | 36 |
| Android `targetSdkVersion` | 36 |
| Android `minSdkVersion` | 24 (Android 7.0) |
| App ID iOS | `mx.com.tags.movil` |
| App ID Android | `mx.com.tags.movil` (namespace + applicationId) |
| Hermes | default ON |
| New Architecture (Fabric + TurboModules) | default ON |

**Backend**: Laravel 12 existente en `101tags.com-/` (NO modificar).
**Auth**: Sanctum bearer tokens (F1).
**Secure storage**: **`expo-secure-store`** (built-in; Keychain iOS / Android Keystore AES-GCM).

## Important files

```text
/101tags-movil/
├── AGENTS.md                       (preserved + stack actualizado)
├── PLAN.md                         (preserved, stack objetivo a actualizar)
├── DISCOVERY.md                    (preserved + §PIVOTE añadido)
├── TASKS.md                        (preserved)
├── ISSUES.md                       (preserved)
├── README.md                       (rewrite — quick start Expo)
├── STATE.md                        (este archivo)
├── .gitignore                      (Expo defaults)
├── .nvmrc                          (24)
├── .prettierrc                     (100/singleQuote/trailingComma)
├── app.json                        (Expo: name, slug, ios bundleId, android package, plugins)
├── eas.json                        (EAS Build profiles: dev/preview/production)
├── package.json                    (stack RN+Expo 57)
├── pnpm-lock.yaml                  (único lockfile)
├── babel.config.js                 (Nativewind + Reanimated)
├── metro.config.js                 (Metro + Nativewind)
├── tailwind.config.js              (Nativewind v4 + brand tokens)
├── tsconfig.json                   (extends expo/tsconfig.base + strict)
├── jest.config.js                  (jest-expo preset)
├── jest.setup.js                   (mocks)
├── eslint.config.js                (FlatCompat + eslint-config-expo)
├── src/
│   ├── global.css                  (Tailwind directives)
│   ├── app/
│   │   ├── _layout.tsx             (Providers + hydration + Stack)
│   │   ├── index.tsx               (redirect según auth)
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx         (Bottom tabs)
│   │   │   └── index.tsx           (home screen)
│   │   └── (auth)/
│   │       ├── _layout.tsx
│   │       ├── login.tsx
│   │       └── register.tsx
│   ├── theme/
│   │   ├── tokens.ts               (brandColors + brandFonts + spacing)
│   │   ├── tokens.css              (CSS custom props)
│   │   └── __tests__/tokens.spec.ts
│   ├── constants/
│   │   ├── env.ts                  (Environment interface + impl dev/prod)
│   │   └── __tests__/env.spec.ts
│   ├── core/
│   │   ├── api/
│   │   │   ├── client.ts           (HTTP client wrapper con bearer)
│   │   │   └── __tests__/client.spec.ts
│   │   ├── models/                 (.gitkeep — Auth en M1.1)
│   │   ├── services/               (.gitkeep)
│   │   ├── storage/
│   │   │   ├── secure-store.ts     (expo-secure-store wrapper)
│   │   │   └── __tests__/secure-store.spec.ts
│   │   └── query/
│   │       └── client.ts           (TanStack QueryClient singleton)
│   ├── stores/
│   │   ├── auth-store.ts           (Zustand)
│   │   └── __tests__/auth-store.spec.ts
│   └── components/                 (.gitkeep)
├── assets/
│   └── images/                     (icon, splash, favicon, android adaptive)
├── ios/                            (regenerable con `expo prebuild`)
├── android/                        (regenerable con `expo prebuild`)
├── docs/audit/                     (preserved)
└── .spec/
    ├── README.md                   (actualizado: storage expo-secure-store)
    ├── 00-rn-expo-scaffold.md      (APPROVED — pivote)
    ├── 2026-09-09-m0-1-auditar-contratos.md   (DONE — agnóstico)
    ├── 2026-09-09-m0-3-validar-versiones.md   (APPROVED — RN+Expo)
    └── 2026-09-09-m0-4-workspace-rn-expo.md   (DRAFT → DONE)
```

## Testing

- **Runner**: Jest 29 + jest-expo preset + `@testing-library/react-native`.
- **5 spec files / 28 tests verdes**:
  - `src/theme/__tests__/tokens.spec.ts` (5 tests)
  - `src/constants/__tests__/env.spec.ts` (7 tests)
  - `src/core/storage/__tests__/secure-store.spec.ts` (7 tests)
  - `src/core/api/__tests__/client.spec.ts` (4 tests)
  - `src/stores/__tests__/auth-store.spec.ts` (5 tests)

## Verification commands (reales, ejecutadas)

- `nvm use 24` → Node v24.21.0 (LTS)
- `pnpm install` → exit 0, 11.8s
- `pnpm typecheck` → exit 0 (tsc 5.9.3)
- `pnpm lint` → exit 0 (expo lint → ESLint 9 flat)
- `pnpm test:ci` → 28/28 tests verdes
- `pnpm validate` → typecheck + lint + test:ci → exit 0
- `pnpm exec expo prebuild --no-install --clean` → exit 0, ios/ + android/ generados
  - iOS deployment target: 15.1
  - Android compileSdk/targetSdk: 36, minSdk: 24
  - App ID iOS: `mx.com.tags.movil` (PRODUCT_BUNDLE_IDENTIFIER)
  - App ID Android: `mx.com.tags.movil` (namespace + applicationId)
- `pnpm exec expo export --platform web --output-dir dist` → exit 0, 9 static routes, dist/ con `E31E24` y `Montserrat` en JS bundle
- `pnpm exec eas --version` → `eas-cli/24.0.0`
- `eas.json` valid JSON, `app.json` valid via `expo config --type public`

## Existing test baseline
- 28/28 smoke tests verdes.

## Known pre-existing items
- ESLint 9.39.0 deprecated (warning only); Next ESLint version pending.
- `jest-expo` 57.0.5 disponible (estamos en 57.0.2); upgrade opcional.
- `typescript` 7.0.2 disponible (estamos en 5.9.3); TS 6 ya está soportado por RN 0.86; upgrade opcional en F1.

## PIVOTE — Ionic+Angular+Cap → RN+Expo SDK 57

Tras M0.1-M0.4-Ionic mergeados en `main` (commits 35822a7, ff1a808, 8925bea, 3157993), el usuario pivotó a RN+Expo por:
1. Reutilización futura de código React del equipo.
2. Tooling más moderno (expo-router file-based, EAS Build cloud, OTA updates).
3. Mismas garantías de no-obsolecencia (SDK 57 es actual Sept 2026).

Decisiones:
- SDK 57 (no SDK 53 como el usuario mencionó inicialmente) por ser la versión actual.
- TypeScript 5.9.3 (TS 6 funciona con RN 0.86, pero optamos por 5.9.x por estabilidad probada).
- Expo Router 6 (file-based; reemplaza React Navigation).
- Nativewind v4 + Tailwind 3.4 (Nativewind v5/Tailwind 4 aún pre-release).
- Zustand 5 + TanStack Query 5 (estándar RN moderno).
- expo-secure-store built-in (Keychain/Keystore).
- EAS Build cloud (no requiere Xcode local).
- App ID `mx.com.tags.movil` (mismo que M0.4-Ionic; coherencia).

Lo que se descartó:
- Ionic 9 + Angular 22 + Capacitor 8 (scaffold de M0.4-Ionic borrado).
- @capacitor-community/secure-storage (no existe; sustituido por expo-secure-store built-in).
- `@aparajita/capacitor-secure-storage` (ya no necesario).
- M0.5/M0.6/M1.1 planeados para Angular/Ionic (Tailwind 4 CSS-first, ESLint angular-eslint, etc.) — se sustituyen por equivalentes RN+Expo en próximas specs.

## Active specifications
- `.spec/00-rn-expo-scaffold.md` — **APPROVED** (pivote, sustituye 00-ionic-scaffold.md)
- `.spec/2026-09-09-m0-3-validar-versiones.md` — **APPROVED** (RN+Expo 57 stack; sustituye versión Ionic)
- `.spec/2026-09-09-m0-4-workspace-rn-expo.md` — **DRAFT → DONE** (scaffold RN+Expo)
- `.spec/2026-09-09-m0-1-auditar-contratos.md` — **DONE** (preserved, agnóstico al stack)

## Current phase
F0 / M0.4-PIVOT DONE — scaffold RN+Expo 57 funcional. Pendiente: PR + merge a `main`. Después M0.5 (Nativewind + theme), M0.6 (ESLint baseline), M1.1 (Auth models + secure-storage wrapper funcional).

## Next action

1. **PR + merge**: rama `chore/rn-pivot-f0` → `main`. Mensaje documenta pivote + sustituciones.
2. **M0.5-PIVOT**: Nativewind theme tokens en componentes + environments ajustados + branding refinado.
3. **M0.6-PIVOT**: ESLint custom rules + smoke tests reales + docs/quality/baseline.md.
4. **M1.1**: Auth models (7) + SecureStorageService + AuthService + interceptor.

## Handover

[RELEVO DE AGENTE]
- Fase actual: F0 / M0.4-PIVOT DONE — scaffold RN+Expo 57 funcional
- Specs activas:
  - `.spec/00-rn-expo-scaffold.md` (APPROVED)
  - `.spec/2026-09-09-m0-3-validar-versiones.md` (APPROVED — RN+Expo)
  - `.spec/2026-09-09-m0-4-workspace-rn-expo.md` (DONE)
  - `.spec/2026-09-09-m0-1-auditar-contratos.md` (DONE — preserved)
- Componente actual: app/ (expo-router) + ios/ + android/ + 28/28 tests verdes
- Stack real instalado y verificado: Node 24.21 + pnpm 10.32 + Expo SDK 57.0.21 + RN 0.86.3 + React 19.2.3 + TS 5.9.3 + ESLint 9.39 + Jest 29.7 + jest-expo 57.0.2
- Discrepancias activas: PIVOTE documentado (sustituye stack Ionic+Angular+Cap)
- Tests: 28/28 smoke verdes
- Última acción: scaffold generado + prebuild OK + web export OK + 28/28 tests verdes
- Próximo paso exacto: commit + push + PR + merge de `chore/rn-pivot-f0` a `main`
- Decisiones pendientes: OpenPay nativo (M3.6), deep links reset (M1.4), EAS Update (F7)
- Pre-F7: compilación nativa cloud via EAS Build (sin Xcode/Android SDK local; primera compilación EAS debe hacerse con `eas login` + `eas build`)
