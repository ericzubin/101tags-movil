# PROJECT STATE — 101tags mobile

## Status
IN PROGRESS — F0 cerrado (M0.5 + M0.6) + F1/M1.1 cerrado (Auth models + SecureStorageService + AuthService + interceptor 401). Próximo: **M1.2 — Auth service, interceptor y restauración de sesión**.

## Adoption status
**App funcional con auth wired**. React Native 0.86 + Expo SDK 57 + Expo Router 6 + Nativewind v4 + Zustand 5 + TanStack Query 5 + Jest 29 + ESLint 9 + pnpm 10 + Node 24 LTS. `ios/` y `android/` regenerables con `expo prebuild`. Compilación nativa cloud via EAS Build.

## Current architecture

Workspace completo en repo root con auth wired:
- `app.json` (Expo) + `eas.json` (EAS Build profiles).
- `src/app/` (expo-router file-based): `_layout.tsx` (Providers + httpClient wiring + Stack), `index.tsx` (redirect), `(tabs)/`, `(auth)/login.tsx + register.tsx`.
- `src/core/api/client.ts` con `setAuthTokenProvider` + `setOnUnauthorized` (interceptor 401).
- `src/core/models/auth.ts` (7 types: CustomerUser, LoginRequest, RegisterRequest, AuthSession, AuthError, AuthErrorCode).
- `src/core/services/secure-storage-service.ts` (singleton expo-secure-store con web fallback) + `auth-service.ts` (singleton login/register/logout/me/refresh).
- `src/stores/auth-store.ts` (Zustand) usa AuthService.
- `src/theme/tokens.ts` (brandColors + brandFonts + spacing).
- `src/constants/env.ts` (getApiBaseUrl/getApiTimeoutMs dev/prod).
- `src/global.css` (Tailwind directives).
- `src/__tests__/quality/` (4 tests: hex-color-guard, no-any, type-imports, workspace).
- `babel.config.js` + `metro.config.js` + `tailwind.config.js` (Nativewind).
- `tsconfig.json` + `jest.config.js` + `jest.setup.js` + `eslint.config.js` (FlatCompat + custom rules).
- `assets/images/` + `ios/` + `android/` (regenerables).

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
| ESLint | 9.39.0 + eslint-config-expo 9.1.0 + 3 custom rules (no-hex, no-any, type-imports) |
| Nativewind | 4.2.6 |
| Tailwind CSS | 3.4.17 |
| Zustand | 5.0.4 |
| @tanstack/react-query | 5.102.8 |
| Prettier | 3.6.2 |
| eas-cli | 24.0.0 |

### Native (gestionado por `expo prebuild`)
| Capa | Versión |
|---|---|
| iOS deployment target | 15.1 |
| Android `compileSdkVersion` | 36 |
| Android `targetSdkVersion` | 36 |
| Android `minSdkVersion` | 24 (Android 7.0) |
| App ID iOS | `mx.com.tags.movil` |
| App ID Android | `mx.com.tags.movil` |
| Hermes | default ON |
| New Architecture (Fabric + TurboModules) | default ON |

**Backend**: Laravel 12 existente en `101tags.com-/` (NO modificar).  
**Auth**: Sanctum bearer tokens.  
**Secure storage**: **`expo-secure-store`** (built-in; Keychain iOS / Android Keystore AES-GCM).

## Important files (post-M1.1)

```
/101tags-movil/
├── AGENTS.md                       (§ Disciplina de I/O + § Cuotas multi-agente)
├── PLAN.md, DISCOVERY.md, TASKS.md, ISSUES.md, README.md
├── STATE.md                        (este archivo)
├── .gitignore, .nvmrc, .prettierrc, .prettierignore
├── app.json, eas.json
├── package.json, pnpm-lock.yaml
├── babel.config.js, metro.config.js, tailwind.config.js
├── tsconfig.json, jest.config.js, jest.setup.js, eslint.config.js
├── scripts/baseline.js             (captura metrics de calidad)
├── docs/quality/baseline.md        (snapshot)
├── src/
│   ├── global.css
│   ├── app/
│   │   ├── _layout.tsx             (QueryClientProvider + httpClient wiring + Stack)
│   │   ├── index.tsx               (redirect index)
│   │   ├── (tabs)/{_layout,index}.tsx
│   │   └── (auth)/{_layout,login,register}.tsx
│   ├── theme/
│   │   ├── tokens.ts, tokens.css
│   │   └── __tests__/{tokens,nativewind-tokens}.spec.ts
│   ├── constants/
│   │   ├── env.ts
│   │   └── __tests__/env.spec.ts
│   ├── core/
│   │   ├── api/
│   │   │   ├── client.ts           (httpClient: bearer + 401 interceptor)
│   │   │   └── __tests__/client.spec.ts
│   │   ├── models/
│   │   │   ├── auth.ts             (7 types)
│   │   │   └── __tests__/auth.spec.ts
│   │   ├── services/
│   │   │   ├── secure-storage-service.ts  (singleton)
│   │   │   ├── is-secure-storage-available.ts
│   │   │   ├── auth-service.ts    (singleton login/register/logout/me/refresh)
│   │   │   └── __tests__/{secure-storage-service,auth-service}.spec.ts
│   │   ├── storage/
│   │   │   ├── secure-store.ts
│   │   │   └── __tests__/secure-store.spec.ts
│   │   └── query/client.ts
│   ├── stores/
│   │   ├── auth-store.ts
│   │   └── __tests__/auth-store.spec.ts
│   ├── components/.gitkeep
│   └── __tests__/
│       ├── splash-theme.spec.ts
│       └── quality/
│           ├── hex-color-guard.spec.ts
│           ├── no-any.spec.ts
│           ├── type-imports.spec.ts
│           └── workspace.spec.ts
├── assets/images/
├── ios/, android/                  (regenerable)
└── .spec/
    ├── 00-rn-expo-scaffold.md                      (APPROVED)
    ├── 2026-09-09-m0-1-auditar-contratos.md       (DONE)
    ├── 2026-09-09-m0-3-validar-versiones.md       (APPROVED)
    ├── 2026-09-09-m0-4-workspace-rn-expo.md       (DONE)
    ├── 2026-09-09-m0-5-pivot-theme-nativewind-env.md (DONE)
    ├── 2026-09-09-m0-6-pivot-quality-baseline.md  (DONE)
    └── 2026-09-09-m1-1-auth-models-service.md     (DONE)
```

## Testing (baseline post-M1.1)

**Runner**: Jest 29 + jest-expo preset + `@testing-library/react-native`.

**11 spec files / 90 tests verdes**:
- `src/theme/__tests__/tokens.spec.ts` (8)
- `src/theme/__tests__/nativewind-tokens.spec.ts` (4)
- `src/constants/__tests__/env.spec.ts` (12)
- `src/core/storage/__tests__/secure-store.spec.ts` (7)
- `src/core/api/__tests__/client.spec.ts` (4)
- `src/core/models/__tests__/auth.spec.ts` (~10)
- `src/core/services/__tests__/secure-storage-service.spec.ts` (~8)
- `src/core/services/__tests__/auth-service.spec.ts` (~12)
- `src/stores/__tests__/auth-store.spec.ts` (5)
- `src/app/__tests__/splash-theme.spec.ts` (8)
- `src/__tests__/quality/{hex-color-guard,no-any,type-imports,workspace}.spec.ts` (~12)

Delta acumulado: 28 (M0.4) → 49 (M0.5, +21) → 78 (M1.1, +29) → 90 (M0.6 + tests quality, +12).

## Verification commands (ejecutadas)
- `node -v` → v24.21.0
- `pnpm -v` → 10.32.1
- `pnpm typecheck` → exit 0
- `pnpm lint` → exit 0
- `pnpm test:ci` → 90/90 (verificado en cada issue, no re-ejecutado a posteriori)
- `pnpm exec expo prebuild --no-install --clean` → exit 0 (cuando fue necesario)
- `pnpm exec expo export --platform web --output-dir dist` → exit 0 (validación F0)
- `pnpm exec eas --version` → `eas-cli/24.0.0`

## Disciplina de I/O (permanente en AGENTS.md)
- Max 2 workers I/O pesados simultáneos (tests/builds/installs/exports).
- Max 3 subagentes de análisis/edición simultáneos.
- Builds completos uno a uno.
- `nice -n 10 ionice -c2 -n7` para procesos pesados.
- **PROHIBIDO sin auth**: `pnpm install` (si node_modules existe), `pnpm test:ci` full suite, `pnpm validate`, `pnpm exec expo prebuild --clean`, `pnpm exec expo export --platform web`, `rm -rf node_modules`, find recursivo sobre node_modules.
- **PERMITIDO sin preguntar**: typecheck, lint, `pnpm test <archivo>` único, `pnpm test -t "..."`, git status/diff/log, grep/read (excluyendo node_modules), gh pr/issue.

## Known pre-existing items
- ESLint 9.39.0 deprecated (warning only).
- `jest-expo` 57.0.5 disponible (estamos en 57.0.2); upgrade opcional.
- `typescript` 7.0.2 disponible (estamos en 5.9.3); upgrade opcional en F1.

## PIVOTE — Ionic+Angular+Cap → RN+Expo SDK 57
Histórico documentado en `DISCOVERY.md §PIVOTE`. Decisión: SDK 57 + RN 0.86 + TS 5.9.x + Expo Router 6 + Nativewind v4 + Zustand 5 + TanStack Query 5 + expo-secure-store built-in.

## Active specifications
- `.spec/00-rn-expo-scaffold.md` — **APPROVED** (pivote)
- `.spec/2026-09-09-m0-3-validar-versiones.md` — **APPROVED**
- `.spec/2026-09-09-m0-1-auditar-contratos.md` — **DONE**
- `.spec/2026-09-09-m0-4-workspace-rn-expo.md` — **DONE**
- `.spec/2026-09-09-m0-5-pivot-theme-nativewind-env.md` — **DONE** (PR #45)
- `.spec/2026-09-09-m0-6-pivot-quality-baseline.md` — **DONE** (PR #49)
- `.spec/2026-09-09-m1-1-auth-models-service.md` — **DONE** (PR #47)

## Current phase
**F1 / M1.2 — Auth service, interceptor y restauración de sesión**.

## Next actions (roadmap)
1. **M1.2** — sesión restore al boot + guards navegación + 401 redirect (inmediato).
2. **M1.3** — Login/registro UX polish (validaciones, loading states, error UX).
3. **M1.4** — Forgot/reset password + deep links.
4. **M1.5** — Splash animado + tabs base (Inicio/Catálogo/Carrito/Cuenta).
5. **F2.x** — Home + catálogo + producto.
6. **F3.x** — Cart + checkout + pagos (OXXO/SPEI/OpenPay condicional).
7. **F4.x** — Pedidos + cancelaciones + rating.
8. **F5.x** — Chat + notificaciones in-app.
9. **F6.x** — Perfil + cupones + contenido estático.
10. **F7.x** — Plugins nativos + Android/iOS signing + QA + release.

## Handover

[RELEVO DE AGENTE]
- Fase actual: F1 / M1.2 — siguiente issue del backlog.
- Componente actual: app + auth wiring + 90 tests verdes.
- Stack: Node 24.21 + pnpm 10.32 + Expo SDK 57.0.21 + RN 0.86.3 + React 19.2.3 + TS 5.9.3 + ESLint 9.39 + Jest 29.7 + jest-expo 57.0.2 + Nativewind 4.2.6 + Zustand 5 + TanStack Query 5.
- Decisiones pendientes: OpenPay nativo (M3.6), deep links reset (M1.4), EAS Update (F7), TS 6 upgrade (opcional).
- Pre-F7: compilación nativa cloud via EAS Build (sin Xcode/Android SDK local; primera compilación EAS debe hacerse con `eas login` + `eas build`).
- Próximo paso exacto: arrancar M1.2.
