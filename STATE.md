# PROJECT STATE — 101tags mobile

## Status
IN PROGRESS — F0 cerrado + F1 entero cerrado + P0 parchado ✅ + **F2 COMPLETO E INTEGRADO en `developer`** (95c8f24, PR #73). M2.0-setup (PR #70) + M2.1-home (PR #71) + M2.4-detail (PR #72) + M2.2-categories (PR #74) + M2.3-list (PR #75) + M2.5-ux (PR #76). Issues #12, #13, #14, #15, #16 cerradas. Próximo: arrancar **F3 (#17)**; el merge **`developer` → `main` (PR #67) lo hará el usuario**. Housekeeping: issues stale F1 #7/#8/#9 cerradas.

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

Delta acumulado: 28 (M0.4) → 49 (M0.5, +21) → 78 (M1.1, +29) → 90 (M0.6 + tests quality, +12) → ~130 (M1.3, +40: errors.spec.ts 8 + auth.spec.ts 15 + login.spec.tsx 10 + register.spec.tsx 7).

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
- `.spec/2026-09-09-m1-2-session-restore-guards.md` — **DONE** (PR #50)
- `.spec/2026-09-09-m1-3-login-register-ux.md` — **DONE** (PR #59)
- `.spec/2026-09-10-m1-4-hardening.md` — **DONE** (PR #60)
- `.spec/2026-09-10-m1-5-session-cycle.md` — **DONE** (PR #61)
- `.spec/2026-09-10-m1-6-abort-timeout.md` — **DONE** (PR #62)
- `.spec/2026-09-10-m1-7-gitignore.md` — **DONE** (PR #63)
- `.spec/2026-09-10-m1-8-font-montserrat.md` — **DONE** (PR #64)
- `.spec/2026-09-10-m1-9-forgot-reset.md` — **DONE** (PR #65)
- `.spec/2026-09-10-m1-10-splash-tabs.md` — **DONE** (PR #66)
- `.spec/2026-09-11-p0-hydrate-boot-bearer.md` — **DONE** (PR #68)
- `.spec/2026-09-11-m2-0-setup.md` — **DONE** (PR #70)
- `.spec/2026-09-11-m2-1-home.md` — **DONE** (PR #71)
- `.spec/2026-09-11-m2-4-detail.md` — **DONE** (PR #72)
- `.spec/2026-09-11-m2-2-categories.md` — **DONE (PR #74)**
- `.spec/2026-09-11-m2-3-list.md` — **DONE (PR #75)**
- `.spec/2026-09-11-m2-5-ux.md` — **DONE (PR #76)**

## Current phase
**F2 COMPLETO E INTEGRADO en `developer`** (95c8f24, PR #73). Próximo: **`developer` → `main` (PR #67, requiere autorización del usuario)** y arrancar F3 (#17).

## Next actions (roadmap)
1. **Cierre F2** — `developer` → `main` (PR #67, con autorización) → iniciar F3.
2. **F3.x** — Cart + checkout + pagos (issues #17-#22).
3. **F4.x** — Pedidos + cancelaciones + rating (issues #23-#25).
4. **F5.x** — Chat + notificaciones in-app (issues #26-#28).
5. **F6.x** — Perfil + cupones + contenido estático (issues #29-#31).
6. **F7.x** — Plugins nativos + Android/iOS signing + QA + release (issues #32-#36).
7. **META** — Issues #37 (Notion sync), #38 (Project/Milestones), #58 (CI obligatorio).

## Handover

[RELEVO DE AGENTE]
- Fase actual: **F2 COMPLETO E INTEGRADO en `developer`** (95c8f24, PR #73). PRs #70-#72, #74, #75, #76. Issues #12, #13, #14, #15, #16 cerradas. Housekeeping: #7/#8/#9 cerradas. Rama `f2/catalogo` eliminada tras el squash.
- Próximo paso exacto: el usuario hará **`developer` → `main`** (PR #67) cuando lo decida; el agente arranca F3 (#17, cart service) en ramas feature → `developer`.
- **Contrato corregido en M2.3:** `Paginated<T>` flat camelCase (`data`, `currentPage`, `lastPage`, `perPage`, `total`, `from`, `to`, `nextPageUrl`, `prevPageUrl`), acorde al `LengthAwarePaginator` de `/api/catalog/products`. Documentado en `DISCOVERY.md §10.1`.
- Stack: Node 24.21 + pnpm 10.32 + Expo SDK 57.0.21 + RN 0.86.3 + React 19.2.3 + TS 5.9.3 + ESLint 9.39 + Jest 29.7 + jest-expo 57.0.2 + Nativewind 4.2.6 + Zustand 5 + TanStack Query 5.
- Decisiones pendientes: guest checkout (M3.3/DISCOVERY §8), OpenPay móvil (M3.6/§9), signing F7 (Apple/Google, insumos del usuario).
- Nota: `pnpm format:check` puede marcar `SortChips.tsx`/`FiltersSheet.tsx`/`CategoryGrid.tsx` (prettier pre-existente); no forma parte del gate actual (`validate` = typecheck+lint+test).

## PRs abiertos pendientes de revisión (sin merge)

> Política vigente: el agente **no mergea a `developer`** ni cierra issues; deja PRs abiertos y el usuario los revisa/mergea después.

- `fix/m2-review-p1` → PR **abierto** contra `developer`. Cierra 4 hallazgos P1 de revisión: test de paginator en `httpClient`, precio efectivo `variant.price`, selector con combinaciones disjuntas (Opción B: chips cruzados accionables + auto-limpieza del eje contrario), y `expo-image ~57.0.4`. Spec `.spec/2026-09-11-m2-review-p1-fixes.md`.
