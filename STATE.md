# PROJECT STATE — 101tags mobile

## Status
IN PROGRESS — F0 en curso (M0.3 cerrado con ENMIENDA MAYOR)

## Adoption status
Greenfield. `ionic start` aún no se ha ejecutado. M0.1, M0.2 y M0.3 cerradas en sus respectivas ramas (pendientes de merge a `main`).

## Current architecture
Todavía no existe el workspace técnico. La arquitectura objetivo, alcance, backlog y spec del scaffold están documentados en `PLAN.md`, `TASKS.md`, `.spec/00-ionic-scaffold.md` (APPROVED, enmendada por M0.3) y `.spec/2026-09-09-m0-3-validar-versiones.md` (APPROVED).

## Stack (ENMENDADO por M0.3)
- **Node.js 24.x LTS ("Krypton")** — Node 20 está EOL desde 2026-04-30.
- **Angular 22.1.x** — Angular 17 está EOL.
- **Ionic 9.0.x** — Ionic 7 está End of Support.
- **Capacitor 8.5.x** — Capacitor 6 está EOL.
- **Tailwind 4.3.x** (CSS-first config, sin `tailwind.config.js`).
- **TypeScript 6.x**, **RxJS 7.8.x**, **zone.js 0.15+/0.16+**.
- **ESLint 10.x** + flat config obligatorio.
- **pnpm 10.x** (usuario ya tiene 10.32.1).
- **Karma 6.4.x + Jasmine 5.x** (default Angular CLI 22).
- API backend: Laravel 12 existente en `101tags.com-` (no modificar desde este repo sin spec + aprobación).
- Auth: Sanctum bearer tokens.
- Bearer token: requiere secure storage real respaldado por Keychain/Keystore; no usar `@capacitor/preferences` para el token (decisión M1.1).

Pre-M0.4 (usuario): `nvm install 24 && nvm alias default 24` (nvm 0.40.3 ya está instalado).

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
    ├── 00-ionic-scaffold.md          (APPROVED — enmendada por M0.3)
    ├── 2026-09-09-m0-1-auditar-contratos.md   (DONE)
    └── 2026-09-09-m0-3-validar-versiones.md   (APPROVED)
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
- Framework/runner: **decidido en M0.2** → Karma 6.4.x + Jasmine 5.x (default Angular CLI 22).
- Configuración final se crea en M0.4 al ejecutar `ionic start` y se valida en M0.6.
- Baseline actual: ninguno porque no existe código.

## Verification commands
- Tests: `pnpm test` (Karma 6.4 headless) — pendiente de M0.4.
- Lint: `pnpm lint` (ESLint 10 flat config) — pendiente de M0.4.
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
- `.spec/00-ionic-scaffold.md` — **APPROVED** (enmendada por M0.3, ENMIENDA MAYOR de versiones)
- `.spec/2026-09-09-m0-3-validar-versiones.md` — **APPROVED**

## Current phase
F0 / M0.3 DONE — **esperando visto bueno explícito del usuario sobre la ENMIENDA MAYOR antes de abrir M0.4**.

## Last completed work

### M0.1 (Issue #1) — Auditar contratos backend / storefront — DONE
- Rama: `chore/m0-1-auditar-contratos` (push OK, pendiente de merge).
- 3 subagentes `explore` en paralelo: API contracts (58 endpoints), TS types, 12 peculiaridades con `file:line`.
- Artefactos: `DISCOVERY.md` (versión con detalle de endpoints), `docs/audit/audit-1-api-contracts.md`, `docs/audit/audit-2-typescript-types.md`, `docs/audit/audit-3-peculiarities.md`, `.spec/2026-09-09-m0-1-auditar-contratos.md`.
- Commit: `9043306 chore(m0-1): auditar contratos backend / storefront (#1)`.

### M0.2 (Issue #2) — Cerrar y aprobar spec del scaffold — DONE
- Rama: `chore/m0-2-spec-scaffold` (push OK, pendiente de merge).
- Decisiones cerradas (todas siguen vigentes tras M0.3): pnpm, Karma+Jasmine, ESLint 8 (ahora 10), Prettier 3, es-MX hardcoded, vanilla Tailwind (ahora 4.3 CSS-first), no husky, no coverage threshold, `appId = mx.com.101tags.movil`.
- 13 escenarios BDD originales.
- Commit: `eca35e1 chore(m0-2): aprobar spec del scaffold (#2)`.

### M0.3 (Issue #3) — Validar matriz de versiones y requisitos de tiendas — DONE (ENMIENDA MAYOR)
- Rama: `chore/m0-3-validar-versiones` (push en este turno).
- 6 subagentes `explore` en paralelo: Node.js LTS, Angular+ESLint, Ionic, Capacitor, iOS+Xcode+App Store, Android+Play Store.
- 58 fetches totales (~12 por subagente). Una fuente (`developer.android.com` directo) bloqueada; mitigada con `web.archive.org`.
- **Veredicto: ENMIENDA MAYOR**. Cada pieza del stack original está EOL/End-of-Support al 2026-09.
- Stack enmendado: Node 24, Angular 22.1, Ionic 9, Capacitor 8.5, Tailwind 4.3, ESLint 10 flat, pnpm 10, TS 6, RxJS 7.8, zone 0.15+, Karma 6.4 + Jasmine 5, JDK 17, Xcode 26.6, iOS deployment ≥15.0, Android targetSdk 36 (bumpeado manualmente sobre Cap 8 default 35), AGP 8.7.2.
- Artefactos producidos:
  - `.spec/2026-09-09-m0-3-validar-versiones.md` (APPROVED) con matriz + veredicto + 6 escenarios BDD + 8 riesgos con mitigación.
  - `.spec/00-ionic-scaffold.md` (enmendada in-place, ahora con 14 BDD scenarios).
- Pre-M0.4 (usuario): `nvm install 24 && nvm alias default 24` (nvm 0.40.3 ya está instalado; Node 25.0.0 Current activo).
- **Requiere visto bueno explícito del usuario** sobre la ENMIENDA MAYOR antes de M0.4 (per `AGENTS.md §Dependencias y versiones`).

## Next action

1. **Esperar visto bueno del usuario sobre ENMIENDA MAYOR**.
2. **M0.4 (Issue #4)** en rama `chore/m0-4-workspace-ionic`: ejecutar `ionic start` con pnpm + `@ionic/cli 9`, agregar `ionic cap add ios android`. Bump manual de `targetSdk` Android a 36. Documentar Swift Package Manager como default en iOS.
3. **M0.5 (Issue #5)**: Tailwind 4 CSS-first, theme, environments, proxy.
4. **M0.6 (Issue #6)**: baseline de calidad — `.eslint.config.js` flat, scripts reales, smoke test.

## Handover

[RELEVO DE AGENTE]
- Fase actual: F0 / M0.3 DONE — **bloqueado por visto bueno sobre ENMIENDA MAYOR**
- Specs activas:
  - `.spec/00-ionic-scaffold.md` (APPROVED, enmendada por M0.3)
  - `.spec/2026-09-09-m0-3-validar-versiones.md` (APPROVED)
- Ramas en `origin` (todas pendientes de merge):
  - `chore/m0-1-auditar-contratos` (9043306)
  - `chore/m0-2-spec-scaffold` (eca35e1)
  - `chore/m0-3-validar-versiones` (próximo push)
- Componente actual: documentación/planning; sin código generado todavía
- Tests: no existen aún (se crean en M0.4–M0.6)
- Última acción: validar matriz de versiones → ENMIENDA MAYOR aplicada a `.spec/00-ionic-scaffold.md`
- Problema actual: ninguno técnico; **esperando OK del usuario sobre ENMIENDA MAYOR**
- Próximo paso exacto (post-aprobación): M0.4 — `nvm install 24 && nvm alias default 24`, luego `ionic start` con stack enmendado
- Decisiones abiertas que NO bloquean M0.4: secure storage (M1.1), OpenPay nativo (M3.6), deep links reset (M1.4), pagination cache (F2), multi-house cart (M3.2)
- Decisiones abiertas que SÍ requieren gate pre-M0.4: confirmación del usuario sobre el stack enmendado de M0.3
- Divergencia con `chore/m0-1-auditar-contratos`: NO resuelta; queda como tarea futura (merge del audit a main y reconciliación con `DISCOVERY.md` del usuario)
