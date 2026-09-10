# PROJECT STATE — 101tags mobile

## Status
IN PROGRESS — F0 / M0.4 cerrado (scaffold real generado)

## Adoption status
**Scaffold generado**. Ionic 9 + Angular 22 + Capacitor 8 + Tailwind 4 + ESLint 9 + Vitest 4 + pnpm 10 + Node 24 LTS. Web build verde. `ios/` y `android/` carpetas presentes (compilación nativa pendiente en máquina destino con Xcode / Android SDK).

## Current architecture
Workspace completo en repo root:
- `src/app/{core/{guards,interceptors,models,services},shared/{components,directives,pipes},pages,home}/` con `.gitkeep` en los vacíos.
- `src/environments/{environment,environment.prod}.ts` con `apiBaseUrl`.
- `src/theme/variables.scss` con brand 101tags.
- `angular.json`, `ionic.config.json`, `capacitor.config.ts` (appId `mx.com.tags.movil`, appName `101tags`, plugins Splash+StatusBar).
- `ios/` (Capacitor 8, deployment target 15.0, SPM default) y `android/` (compileSdk 36, targetSdk 36).

## Stack (instalado y verificado)

| Capa | Versión real instalada |
|---|---|
| Node.js | 24.21.0 LTS (Krypton) |
| pnpm | 10.32.1 |
| Angular | 22.0.1 |
| TypeScript | 6.0.3 |
| RxJS | 7.8.2 |
| zone.js | 0.15.1 |
| Ionic Framework | 9.0.3 |
| Capacitor (core/cli/android/ios) | 8.5.1 |
| @capacitor plugins | app 8.1.1, haptics 8.0.2, keyboard 8.0.5, preferences 8.0.0, splash-screen 8.0.0, status-bar 8.0.3 |
| ESLint | 9.39.5 (flat config) |
| angular-eslint | 22.0.0 |
| typescript-eslint | 8.70.0 |
| Vitest | 4.1.11 |
| jsdom | 26.1.0 |
| Prettier | 3.9.6 |
| ionicons | 8.1.0 |

**Backend**: Laravel 12 existente en `101tags.com-/` (NO modificar).
**Auth**: Sanctum bearer tokens (F1).
**Secure storage**: pendiente M1.1 (NO `@capacitor/preferences` para el token bearer).

## Important files

```text
/101tags-movil/
├── AGENTS.md                       (preserved)
├── PLAN.md                         (preserved)
├── DISCOVERY.md                    (preserved — user's 21-section version)
├── TASKS.md                        (preserved)
├── ISSUES.md                       (preserved)
├── README.md                       (preserved)
├── STATE.md                        (este archivo)
├── .gitignore                      (preserved + cubre Capacitor artifacts)
├── .nvmrc                          (NEW: 24)
├── .editorconfig                   (NEW: Ionic defaults)
├── .browserslistrc                 (NEW: defaults)
├── .prettierrc                     (NEW: 100/singleQuote/trailingComma)
├── .vscode/                        (NEW: Ionic config)
├── angular.json                    (NEW: Angular 22 CLI)
├── ionic.config.json               (NEW: type=angular-standalone)
├── capacitor.config.ts             (NEW: appId mx.com.tags.movil)
├── eslint.config.js                (NEW: flat config)
├── tsconfig.json + tsconfig.app.json + tsconfig.spec.json  (NEW)
├── package.json                    (NEW: stack M0.3 + scripts reales)
├── pnpm-lock.yaml                  (NEW: sólo lockfile presente)
├── ios/                            (NEW: Capacitor 8, SPM default)
├── android/                        (NEW: Capacitor 8, compileSdk/targetSdk 36)
├── src/
│   ├── main.ts, index.html, global.scss, test-setup.ts
│   ├── app/{app.component,app.routes,home}/
│   ├── core/{guards,interceptors,models,services}/  (.gitkeep en cada)
│   ├── shared/{components,directives,pipes}/         (.gitkeep en cada)
│   ├── pages/                                         (.gitkeep)
│   ├── environments/{environment,environment.prod}.ts
│   ├── theme/variables.scss
│   └── assets/
├── .agent/WORKFLOW.md              (preserved)
└── .spec/
    ├── README.md
    ├── 00-ionic-scaffold.md        (APPROVED, enmendada por M0.3)
    ├── 2026-09-09-m0-1-auditar-contratos.md   (DONE)
    ├── 2026-09-09-m0-3-validar-versiones.md   (APPROVED)
    └── 2026-09-09-m0-4-workspace-ionic.md     (DONE — NUEVO)
```

## Testing
- **Runner**: Vitest 4.1.11 + jsdom 26.1.0 (Angular 22 CLI default). M0.2 había propuesto Karma+Jasmine; Angular 22 ya no soporta Karma por defecto. Aceptado en M0.4.
- **Smoke tests**: 2/2 pasan (template Ionic default).
- **Configuración fina**: M0.6.

## Verification commands (reales, ejecutadas)
- `nvm use 24` → Node v24.21.0 (LTS)
- `pnpm install` → exit 0, 208 packages, 7.1s
- `pnpm typecheck` → exit 0
- `pnpm build` → exit 0, 4.5s, `www/index.html` generado
- `pnpm exec ng test --watch=false` → exit 0, 2/2 tests
- `pnpm lint` → exit 0, "All files pass linting"
- `pnpm exec cap add android` → exit 0 (compileSdk 36, targetSdk 36)
- `pnpm exec cap add ios` → exit 0 (iOS 15.0, SPM default)
- `pnpm exec cap sync` → exit 0

## Existing test baseline
- 2/2 smoke tests verdes.

## Known pre-existing failures
- Browserslist warning: Chrome 110, Firefox 107, Safari 16.1 marcados "unsupported" por Angular 22. No bloquea build. Cleanup opcional en M0.5.
- `ionic cap add` invoca `npm` directamente y falla en este entorno con pnpm. Work-around aplicado: usar `pnpm exec cap add` directamente.

## Active specifications
- `.spec/00-ionic-scaffold.md` — **APPROVED** (enmendada por M0.3)
- `.spec/2026-09-09-m0-3-validar-versiones.md` — **APPROVED**
- `.spec/2026-09-09-m0-4-workspace-ionic.md` — **DONE** (NUEVO)

## Current phase
F0 / M0.4 DONE — pendiente abrir PRs (M0.1, M0.2, M0.3, M0.4) y mergear en orden. Después, M0.5 (theme/Tailwind/environments) o ir directo a F1.

## Last completed work

### M0.4 (Issue #4) — Generar workspace Ionic/Angular/Capacitor — DONE
- **Rama**: `chore/m0-4-workspace-ionic` (push en este turno).
- **Comando ejecutado**: `ionic start 101tags blank --type=angular-standalone --capacitor --package-id=mx.com.tags.movil --no-deps --no-git` en `/tmp/ionic-gen/`, luego `rsync -a` al repo root.
- **Personalizaciones aplicadas**:
  - `capacitor.config.ts`: appId `mx.com.tags.movil`, plugins Splash + StatusBar con `#E31E24`.
  - `src/theme/variables.scss`: colores brand 101tags (rojo, dark, medium) + Montserrat.
  - `src/environments/{environment,environment.prod}.ts`: apiBaseUrl dev/prod.
  - `src/app/core/{guards,interceptors,models,services}/`, `src/app/shared/{components,directives,pipes}/`, `src/app/pages/` con `.gitkeep`.
  - `package.json`: stack M0.3, `packageManager: "pnpm@10.32.1"`, scripts completos (typecheck/build/test/lint/format/cap:*/validate).
  - `.nvmrc`: `24`. `.prettierrc`: 100/singleQuote/trailingComma.
- **Capacitor platforms**:
  - Android: compileSdk 36, targetSdk 36 (default Cap 8 — sin bump manual necesario).
  - iOS: deployment target 15.0, Swift Package Manager como default (Cap 8). `CapApp-SPM/Package.swift` generado.
- **Tests/lint/build**: todos verdes (exit 0). Verificación ejecutada, no asumida.
- **Discrepancias detectadas**:
  - **D9**: `appId` cambió a `mx.com.tags.movil` (vs `mx.com.101tags.movil` que decía PLAN.md y `.spec/00-ionic-scaffold.md`). Capacitor rechazó el original por segmentos que empiezan con dígito (`101tags`).
  - **D10**: M0.2 proponía `app.config.ts` separado; Angular 22 usa `main.ts` para providers. Aceptado.
- **Comando final**: `pnpm exec cap sync` exit 0.

### Estado de las 4 ramas en `origin` (todas push OK)

```
chore/m0-1-auditar-contratos (9043306) — pendiente merge
chore/m0-2-spec-scaffold     (eca35e1) — pendiente merge
chore/m0-3-validar-versiones (d8cd4a7) — pendiente merge
chore/m0-4-workspace-ionic   (próximo push) — pendiente merge
```

## Next action

1. **Abrir PRs para las 4 ramas** (M0.1, M0.2, M0.3, M0.4) en orden cronológico.
2. **Aprobar/mergear los 4 PRs** en `main` (M0.1 → M0.2 → M0.3 → M0.4).
3. **M0.5 (Issue #5)**: Tailwind 4 CSS-first, theme fino, environments ajustes, proxy dev. Opcional cleanup de `.browserslistrc`.
4. **M0.6 (Issue #6)**: scripts reales de quality, ESLint rules custom, smoke tests, CI-ready.
5. **F1 (M1.1)**: secure storage + modelos Auth.

## Handover

[RELEVO DE AGENTE]
- Fase actual: F0 / M0.4 DONE — scaffold funcional
- Specs activas:
  - `.spec/00-ionic-scaffold.md` (APPROVED)
  - `.spec/2026-09-09-m0-3-validar-versiones.md` (APPROVED)
  - `.spec/2026-09-09-m0-4-workspace-ionic.md` (DONE)
- Componente actual: scaffold web + ios/ + android/ + 2/2 tests verdes
- Stack real instalado y verificado: Node 24.21 + pnpm 10.32 + Angular 22.0.1 + Ionic 9.0.3 + Capacitor 8.5.1 + TS 6.0.3 + ESLint 9.39 + Vitest 4.1
- Discrepancias activas: D9 (appId), D10 (main.ts vs app.config.ts)
- Tests: 2/2 smoke verdes
- Última acción: scaffold generado + verificado
- Próximo paso exacto: abrir PRs para las 4 ramas en GitHub (M0.1, M0.2, M0.3, M0.4) y mergear en orden
- Decisiones pendientes: Tailwind 4 sí/no (M0.5); secure storage (M1.1); OpenPay nativo (M3.6); deep links reset (M1.4)
- Pre-F7: compilación nativa requiere macOS con Xcode (iOS) o máquina con Android SDK + JDK 17+ (Android)
