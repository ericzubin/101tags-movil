# 101tags — App móvil (Ionic + Angular + Capacitor)

App móvil para compradores de 101tags, orientada a iOS + Android y diseñada para consumir la API Laravel existente de `101tags.com-`.

## Estado actual

**PLANNED / READY — todavía no se ha generado el scaffold técnico ni existe implementación funcional.**

La primera spec existe en estado `DRAFT`; no debe ejecutarse `ionic start` hasta cerrar las decisiones de F0 y aprobarla.

## Documentación

| Archivo | Propósito |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Reglas obligatorias para agentes, seguridad y alcance |
| [`PLAN.md`](./PLAN.md) | Plan maestro, arquitectura, alcance, API y fases |
| [`TASKS.md`](./TASKS.md) | Backlog detallado: 36 tareas, dependencias, estimaciones y aceptación |
| [`STATE.md`](./STATE.md) | Estado real del proyecto y próximo paso |
| [`.agent/WORKFLOW.md`](./.agent/WORKFLOW.md) | Flujo DISCOVERY → SDD → BDD → TDD → Verification |
| [`.spec/README.md`](./.spec/README.md) | Convención/plantilla de specs |
| [`.spec/00-ionic-scaffold.md`](./.spec/00-ionic-scaffold.md) | Primera spec — scaffold, actualmente DRAFT |

## Flujo de trabajo

Todo cambio funcional debe seguir:

**DISCOVERY → SDD → BDD → TDD RED → TDD GREEN → REFACTOR → VERIFICATION**

No implementar una spec mientras siga en `DRAFT`.

## Próximo paso

Revisar y cerrar F0: contratos, matriz de versiones/requisitos de tiendas y decisiones del scaffold; después aprobar `.spec/00-ionic-scaffold.md`.
