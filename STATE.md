# PROJECT STATE — 101tags mobile

## Status
READY

## Adoption status
Greenfield. Aún no se ha ejecutado `ionic start`.

## Current architecture
Vacío. La estructura de carpetas (`src/`, `www/`, `ios/`, `android/`) se generará como parte de la primera tarea real siguiendo el protocolo SDD/BDD/TDD.

## Stack
- Planeado: Ionic 7 + Angular 17 + Capacitor 6 + Tailwind + pnpm
- API backend: Laravel 12 existente en `/home/user/code/codeweb/101tags.com-/` (NO modificar)
- Auth: Sanctum bearer tokens (`POST /api/auth/customer/login`)

## Important directories

```
/101tags/
├── AGENTS.md
├── STATE.md
├── .agent/WORKFLOW.md
└── .spec/README.md
```

(El scaffold técnico se añadirá durante la primera tarea.)

## Testing
- Framework: A definir en primera tarea (Karma + Jasmine por defecto de Angular, o Jest).
- Comandos: A definir.

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
NONE

## Current phase
READY

## Last completed work
Scaffolding inicial del entorno de trabajo (AGENTS, STATE, WORKFLOW, .spec, package.json placeholder).

## Next action
Wait for the next user task.
