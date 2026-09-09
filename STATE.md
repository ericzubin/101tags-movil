# PROJECT STATE — 101tags mobile

## Status
PLANNED / READY

## Adoption status
Greenfield. Aún no se ha ejecutado `ionic start` y no existe implementación funcional.

## Current architecture
Todavía no existe el workspace técnico. La arquitectura objetivo, alcance y backlog ya están documentados en `PLAN.md` y `TASKS.md`.

## Stack
- Objetivo original: Ionic 7 + Angular 17 + Capacitor 6 + Tailwind + pnpm.
- **Versiones exactas pendientes de validación en M0.3 antes del scaffold.**
- API backend: Laravel 12 existente en `101tags.com-` (no modificar desde este repo sin spec + aprobación).
- Auth: Sanctum bearer tokens.
- Bearer token: requiere secure storage real respaldado por Keychain/Keystore; no asumir `@capacitor/preferences` como storage cifrado.

## Important files

```text
/101tags-movil/
├── AGENTS.md
├── PLAN.md
├── TASKS.md
├── STATE.md
├── .agent/
│   └── WORKFLOW.md
└── .spec/
    ├── README.md
    └── 00-ionic-scaffold.md
```

## Planning baseline
- `PLAN.md`: plan maestro revisado.
- `TASKS.md`: 36 tareas F0–F7.
- Estimación base detallada: 135 h, a recalibrar después de F0.
- Notion: debe reflejar proyecto + tareas con prefijo `[101M]`.

## Backend validation realizada durante planificación
Se confirmaron de forma puntual contratos clave en `101tags.com-` para:
- `auth/customer`;
- `checkout/request-orders` + `Idempotency-Key`;
- notificaciones;
- chat/attachments.

Esto **no sustituye** el Discovery completo M0.1 antes de implementación.

## Testing
- Framework/runner: pendiente de cerrar en `.spec/00-ionic-scaffold.md` después de validar el scaffold/versiones.
- Baseline actual: ninguno porque no existe código.

## Verification commands
- Tests: pendiente de scaffold.
- Lint: pendiente de scaffold.
- Formatter: pendiente de scaffold.
- Type check: previsto `tsc --noEmit` o equivalente real del scaffold.
- Build: previsto `ionic build`/comando real detectado tras scaffold.
- Capacitor sync: pendiente de scaffold.

No inventar comandos hasta que existan en el proyecto.

## Existing test baseline
Ninguno. Proyecto sin código.

## Known pre-existing failures
Ninguno conocido porque aún no existe baseline ejecutable.

## Active specification
`.spec/00-ionic-scaffold.md` — **DRAFT**

## Current phase
READY / PRE-DISCOVERY

No implementar mientras la spec siga DRAFT.

## Last completed work
- Revisión de `PLAN.md`, `AGENTS.md`, `.agent/WORKFLOW.md`, `.spec/README.md`, `README.md`, `STATE.md` y `package.json` placeholder.
- Creación de `TASKS.md` con backlog detallado.
- Creación de `.spec/00-ionic-scaffold.md` en DRAFT.
- Corrección documental del requisito de secure storage.
- Ampliación de `PLAN.md`, `AGENTS.md` y `README.md` para usar una única jerarquía de fuentes.

## Next action
1. Ejecutar M0.1 Discovery completo de contratos backend/storefront.
2. Ejecutar M0.3 validación de versiones y requisitos de tiendas.
3. Completar las decisiones pendientes de `.spec/00-ionic-scaffold.md`.
4. Solicitar/aplicar aprobación y cambiar la spec a `APPROVED`.
5. Sólo después generar el scaffold en M0.4.

## Handover

[RELEVO DE AGENTE]
Fase actual: READY / PRE-DISCOVERY
Spec: `.spec/00-ionic-scaffold.md` (DRAFT)
Componente actual: documentación/planning
Tests: no existen aún
Última acción: consolidación de plan + backlog
Problema actual: versiones exactas y storage seguro aún deben cerrarse por spec
Próximo paso exacto: M0.1 + M0.3, luego aprobar la spec del scaffold
