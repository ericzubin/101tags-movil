# PROJECT STATE — 101tags mobile

## Status
IN PROGRESS — F0 fase 0 en curso

## Adoption status
Greenfield aún, scaffold no generado. Issue #1 (M0.1) cerrada.

## Current architecture
Vacío en cuanto a código. Documento `DISCOVERY.md` + `docs/audit/*` producidos como artefacto de discovery.

## Stack
- Planeado: Ionic 7 + Angular 17 + Capacitor 6 + Tailwind + pnpm
- API backend: Laravel 12 existente en `/home/user/code/codeweb/101tags.com-/` (NO modificar)
- Auth: Sanctum bearer tokens (`POST /api/auth/customer/login`)

## Important directories

```
/101tags-movil/
├── AGENTS.md
├── STATE.md
├── PLAN.md
├── DISCOVERY.md                         ← NUEVO (artefacto de M0.1)
├── docs/audit/                          ← NUEVO (referencias M0.1)
│   ├── audit-1-api-contracts.md
│   ├── audit-2-typescript-types.md
│   └── audit-3-peculiarities.md
├── .agent/WORKFLOW.md
├── .spec/
│   ├── README.md
│   └── 2026-09-09-m0-1-auditar-contratos.md  ← NUEVO (spec M0.1)
├── package.json (placeholder)
└── .gitignore
```

## Testing
- Framework: A definir en M0.6 (Karma+Jasmine default Angular o Jest).
- Comandos: A definir en M0.6.

## Verification commands
- Tests: A definir
- Lint: A definir
- Formatter: A definir
- Type check: `tsc --noEmit` (cuando exista `tsconfig.json`)
- Build: `ionic build` (cuando exista)

## Existing test baseline
Ninguno. Proyecto sin código.

## Known pre-existing failures
Ninguno.

## Active specification
`.spec/2026-09-09-m0-1-auditar-contratos.md` — status DONE

## Current phase
DONE — Issue #1 cerrada, esperando visto bueno del usuario antes de pasar a #2

## Last completed work
**2026-09-09 — Issue #1 (M0.1): Auditar contratos backend / storefront**
- 3 subagentes `explore` lanzados en paralelo (API contracts / TS types / peculiarities).
- Hallazgos consolidados en `DISCOVERY.md` (resumen ejecutivo, 10 secciones, 7 discrepancias con PLAN.md, 5 huecos tipográficos, 12 peculiaridades documentadas con cita file:line, 6 decisiones pujadas a futuras specs).
- 3 archivos de referencia detallada: `docs/audit/audit-1-api-contracts.md`, `audit-2-typescript-types.md`, `audit-3-peculiarities.md`.
- Spec `.spec/2026-09-09-m0-1-auditar-contratos.md` redactada con status `DONE` y 9 escenarios BDD de verificación.
- Branch `chore/m0-1-auditar-contratos` con commit local listo para push (rama aún no pusheada; usuario debe aprobar).

## Comandos ejecutados
- `git switch -c chore/m0-1-auditar-contratos`
- Reads: AGENTS.md, STATE.md, PLAN.md, .agent/WORKFLOW.md, .spec/README.md
- Reads: routes/api.php, app/Http/Controllers/Api/* (vía subagentes), storefront/src/types/* (vía subagentes), app/Services/* (vía subagentes), config/* (vía subagentes)
- Tools ejecutados (no-modify): grep, read, bash read-only (ls, git status, git branch, route:list)

## Resultados
- 58 endpoints buyer-side documentados (a través de `audit-1-api-contracts.md` §2).
- 26 interfaces + 12 unions + 4 generics del storefront inventariados (`audit-2-typescript-types.md` §2).
- 12 peculiaridades backend con cita `file:line` (`audit-3-peculiarities.md` §1-§12).
- 7 discrepancias con `PLAN.md` resueltas (`DISCOVERY.md §5`).
- 5 huecos tipográficos listados con plan de creación en M0.4 (`DISCOVERY.md §6`).

## Riesgos pendientes (no resueltos por M0.1, pujados a specs futuras)
- **D-OPENPAY-NATIVE** (M3.6 spec): SDK nativo vs in-app browser al storefront vs diferir tarjeta house. Documentar trade-offs ANTES de codear.
- **D-DEEPLINK-RESET** (M1.4 spec): scheme nativo o copy/paste manual de token.
- **D-PAGINATION-CACHE** (F2 specs): endpoints a cachear offline.
- **D-MULTI-HOUSE-CART** (M3.2 spec): carrito mixto house+externo.
- **D-NOTIFICATIONS-PUSH**: confirmado NO en MVP (sólo in-app).

## Next action
Esperar visto bueno del usuario para mergear `chore/m0-1-auditar-contratos` (o continuar desde esa rama) y abrir issue #2 (M0.2 — Cerrar y aprobar spec del scaffold).
