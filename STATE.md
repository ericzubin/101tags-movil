# PROJECT STATE — 101tags mobile

## Status
IN PROGRESS — F0 en curso (M0.2 cerrado)

## Adoption status
Greenfield. `ionic start` aún no se ha ejecutado. M0.1 y M0.2 cerradas en sus respectivas ramas (pendiente de merge a `main`).

## Current architecture
Todavía no existe el workspace técnico. La arquitectura objetivo, alcance, backlog y spec del scaffold están documentados en `PLAN.md`, `TASKS.md` y `.spec/00-ionic-scaffold.md` (APPROVED).

## Stack
- Objetivo original: Ionic 7 + Angular 17 + Capacitor 6 + Tailwind + pnpm.
- **Versiones exactas propuestas en `.spec/00-ionic-scaffold.md` §Versiones propuestas, pendientes de validación en M0.3 antes del scaffold.**
- API backend: Laravel 12 existente en `101tags.com-` (no modificar desde este repo sin spec + aprobación).
- Auth: Sanctum bearer tokens.
- Bearer token: requiere secure storage real respaldado por Keychain/Keystore; no usar `@capacitor/preferences` para el token (decisión M1.1).

## Important files

```text
/101tags-movil/
├── AGENTS.md
├── PLAN.md
├── DISCOVERY.md                      (memoria técnica global, 21 secciones)
├── TASKS.md                          (36 tareas F0–F7, 135 h base)
├── ISSUES.md                         (mapa TASKS.md ↔ GitHub Issues #1–#36)
├── STATE.md                          (este archivo)
├── README.md
├── package.json                      (placeholder; será reemplazado en M0.4)
├── .agent/WORKFLOW.md
└── .spec/
    ├── README.md
    └── 00-ionic-scaffold.md          (APPROVED en M0.2)
```

## Planning baseline
- `PLAN.md`: plan maestro revisado.
- `TASKS.md`: 36 tareas F0–F7.
- `ISSUES.md`: mapa TASKS.md ↔ GitHub Issues.
- Estimación base detallada: 135 h, a recalibrar después de F0.
- Notion: debe reflejar proyecto + tareas con prefijo `[101M]`.

## Backend validation realizada durante planificación
Se confirmaron de forma puntual contratos clave en `101tags.com-` para:
- `auth/customer`;
- `checkout/request-orders` + `Idempotency-Key`;
- notificaciones;
- chat/attachments.

M0.1 amplió esto a una auditoría exhaustiva de 58 endpoints buyer-side en la rama `chore/m0-1-auditar-contratos` (pendiente de merge).

## Testing
- Framework/runner: **decidido en M0.2** → Karma 6.4.x + Jasmine 5.x (default Angular CLI 17).
- Configuración final se crea en M0.4 al ejecutar `ionic start` y se valida en M0.6.
- Baseline actual: ninguno porque no existe código.

## Verification commands
- Tests: `pnpm test` (Karma headless) — pendiente de M0.4.
- Lint: `pnpm lint` (ESLint 8 + angular-eslint) — pendiente de M0.4.
- Formatter: `pnpm format:check` (Prettier 3) — pendiente de M0.4.
- Type check: `pnpm typecheck` (`tsc --noEmit`) — pendiente de M0.4.
- Build: `pnpm build` (`ionic build`) — pendiente de M0.4.
- Capacitor sync: `pnpm cap:sync` — pendiente de M0.4.

No inventar comandos hasta que existan en el proyecto.

## Existing test baseline
Ninguno. Proyecto sin código.

## Known pre-existing failures
Ninguno conocido porque aún no existe baseline ejecutable.

## Active specification
`.spec/00-ionic-scaffold.md` — **APPROVED** (status cerrado en M0.2)

## Current phase
F0 / M0.2 DONE — esperando visto bueno del usuario para abrir M0.3 (validar matriz de versiones).

## Last completed work

### M0.1 (Issue #1) — Auditar contratos backend / storefront — DONE
- Rama: `chore/m0-1-auditar-contratos` (push `origin/chore/m0-1-auditar-contratos`).
- 3 subagentes `explore` en paralelo: API contracts (58 endpoints), TS types (26 interfaces + 12 unions + 4 generics), 12 peculiaridades con `file:line`.
- Artefactos: `DISCOVERY.md` (versión con detalle de endpoints), `docs/audit/audit-1-api-contracts.md`, `docs/audit/audit-2-typescript-types.md`, `docs/audit/audit-3-peculiarities.md`, `.spec/2026-09-09-m0-1-auditar-contratos.md`.
- 9 escenarios BDD de verificación del artefacto.
- Commit: `9043306 chore(m0-1): auditar contratos backend / storefront (#1)`.
- **Estado de merge**: NO mergeado a `main`. El usuario (Eric) agregó 11 commits directamente a `main` (TASKS.md, ISSUES.md, su propia versión de DISCOVERY.md, AGENTS.md actualizada, README.md, .spec/00-ionic-scaffold.md DRAFT) sin pasar por PR. La rama `chore/m0-1-auditar-contratos` queda como artefacto paralelo cuyo merge se gestionará en una futura tarea (no es alcance de M0.2).

### M0.2 (Issue #2) — Cerrar y aprobar spec del scaffold — DONE
- Rama: `chore/m0-2-spec-scaffold` (basada en `origin/main`).
- Decisiones cerradas con visto bueno explícito del usuario:
  - `appId = mx.com.101tags.movil` (vs `com.101tags.comprador` que sugería PLAN.md).
  - i18n: hardcoded `es-MX` en MVP; `@angular/localize` se agrega sólo si se pide multi-idioma.
  - Tailwind: vanilla `tailwindcss@3.4.x` + tokens manuales (sin preset oficial Ionic).
  - Husky + commitlint: NO en MVP.
  - Coverage threshold: informativo, sin threshold de fallo en MVP.
  - Test runner: Karma 6.4.x + Jasmine 5.x.
  - Package manager: pnpm 9.x.
  - Lint: ESLint 8.57.x + angular-eslint 17.5.x.
  - Formatter: Prettier 3.x.
- Decisiones deferidas a M0.3: versiones exactas de Node/Angular/Ionic/Capacitor (propuestas en spec, pendientes de validar contra SDK/store requirements vigentes).
- Decisiones deferidas a specs posteriores (F1–F7): secure storage (M1.1), OpenPay nativo (M3.6), deep links reset (M1.4), pagination cache (F2), multi-house cart (M3.2), push notifications (NO en MVP).
- Estructura de carpetas lockada: `src/app/{core/{guards,interceptors,models,services},shared/{components,directives,pipes},pages}/` + `src/{theme,environments,assets,main.ts,index.html,styles.scss}` + `ios/` + `android/`.
- Scripts de `package.json` documentados como referencia.
- 13 escenarios BDD (los 9 originales del draft + 4 nuevos para appId, structure, pnpm-only, theming).
- Artefacto actualizado: `.spec/00-ionic-scaffold.md` status **DRAFT → APPROVED**.
- Discrepancias menores registradas:
  - `appId` con PLAN.md (`com.101tags.comprador` vs `mx.com.101tags.movil`).
  - M0.1 audit (`docs/audit/*`) en rama paralela aún no mergeado.
  - M0.3 gate de versiones preservado como pre-requisito antes de M0.4.

## Next action
1. **M0.3 (Issue #3)**: validar matriz de versiones Node 20, Angular 17, Ionic 7, Capacitor 6 contra requisitos vigentes de Android SDK, Xcode, Google Play y App Store al 2026. Si hay incompatibilidad, enmendar `.spec/00-ionic-scaffold.md` en esa misma tarea y re-aprobar antes de M0.4.
2. **M0.4 (Issue #4)**: ejecutar `ionic start` con pnpm, `ionic cap add ios android`.
3. **M0.5 (Issue #5)**: configurar theme, Tailwind, environments y proxy dev.
4. **M0.6 (Issue #6)**: baseline de calidad y estructura core.

## Handover

[RELEVO DE AGENTE]
- Fase actual: F0 / M0.2 DONE
- Spec activa: `.spec/00-ionic-scaffold.md` (APPROVED)
- Rama activa: `chore/m0-2-spec-scaffold` (push pendiente en este turno)
- Componente actual: documentación/planning; sin código generado todavía
- Tests: no existen aún (se crean en M0.4–M0.6)
- Última acción: aprobar `.spec/00-ionic-scaffold.md` con decisiones de F0 cerradas
- Problema actual: ninguno; proyecto en READY para M0.3
- Próximo paso exacto: M0.3 — validar matriz de versiones contra SDK/store requirements y, si todo OK, ejecutar M0.4 (`ionic start` + `cap add ios android`)
- Decisiones abiertas que NO bloquean M0.3: secure storage (M1.1), OpenPay nativo (M3.6), deep links reset (M1.4), pagination cache (F2), multi-house cart (M3.2)
- Decisión bloqueada por M0.3: versiones exactas en `package.json`
- Divergencia con `chore/m0-1-auditar-contratos`: NO resuelta en M0.2; queda como tarea futura (merge del audit a main y reconciliación con `DISCOVERY.md` del usuario)
