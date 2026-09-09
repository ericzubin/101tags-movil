# Spec: M0.1 — Auditar contratos backend / storefront

**Status:** DONE
**Spec ID:** 2026-09-09-m0-1-auditar-contratos
**Author:** Agente (issue #1)
**Date:** 2026-09-09
**Related specs:** Ninguna (es la primera). Padrea M0.2–M0.6 y todo F1–F7.

**Issue GitHub:** https://github.com/ericzubin/101tags-movil/issues/1

**Branch:** `chore/m0-1-auditar-contratos`

---

## Contexto

El proyecto 101tags móvil es greenfield: aún no se ha generado el workspace Ionic. Antes de codear cualquier feature, hay que confirmar **qué** consume la app del backend Laravel 12 ya desplegado en `/home/user/code/codeweb/101tags.com-/` (no se modifica) y qué espejo de tipos ya existe en `storefront/src/types/*.ts`. Esa auditoría es **un artefacto de descubrimiento** que se reutilizará en las 37 issues restantes (M0.2–M7.5).

## Problema

Si empezamos a generar el workspace Ionic sin saber exactamente qué endpoints consumimos, qué DTOs tipar, ni qué peculiaridades respetar (idempotencia, OpenPay, deep links, anti-leak de chat, throttling), el código se escribirá contra suposiciones que el backend puede invalidar en cualquier momento. La app terminaría pegándose a un shape inventado y romperíamos en M3.x sin poder detectar dónde ni por qué.

## Objetivo

Producir `DISCOVERY.md` (resumen ejecutivo) + `docs/audit/*.md` (3 referencias profundas) que sirvan como fuente de verdad para:
- el mapeo **endpoint → DTO a crear en mobile**,
- el inventario de **tipos TypeScript ya espejados en el storefront**,
- la lista de **peculiaridades backend** que condicionan el diseño móvil,
- las **discrepancias con `PLAN.md`**,
- los **huecos tipográficos** que mobile debe resolver internamente.

## Fuera de alcance

- Modificar el backend Laravel (prohibido por `AGENTS.md` y por decisión confirmada del usuario).
- Reescribir `PLAN.md` (se sugieren updates en §5 de `DISCOVERY.md` pero no se aplican en esta issue).
- Crear código móvil (scaffold, modelos, servicios). Eso es M0.4+.
- Probar endpoints (no hay app móvil todavía). El testing del audit mismo es su completitud y exactitud.

## Arquitectura afectada

- **Crear**:
  - `DISCOVERY.md` en la raíz del repo (resumen ejecutivo).
  - `docs/audit/audit-1-api-contracts.md`.
  - `docs/audit/audit-2-typescript-types.md`.
  - `docs/audit/audit-3-peculiarities.md`.
- **No tocar**: ninguno de los archivos existentes (todo greenfield).
- **No crear**: ningún archivo de configuración móvil, ningún `package.json`, ningún modelo TS. Eso es M0.4–M0.5.

## Contratos

Esta issue no consume ni expone API. Es de discovery.

## Modelos / DTOs

Esta issue no crea modelos. El inventario de modelos a crear vive en `docs/audit/audit-2-typescript-types.md §7` (referencia para M0.4).

## Seguridad

Esta issue es READ-ONLY por construcción. No se ejecuta ningún comando de escritura contra el backend, no se almacenan credenciales, no se hace login. Sólo se lee código.

## Compatibilidad

- **No hay código existente que romper** (greenfield).
- `AGENTS.md`, `STATE.md`, `PLAN.md`, `.gitignore`, `package.json`, `.agent/WORKFLOW.md`, `.spec/README.md` deben quedar intactos.

## Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | Auditoría incompleta → specs futuras basadas en datos faltantes | Lista de criterios en §10 de `DISCOVERY.md` actúa como Definition of Done. Se verificó cada bullet. |
| R2 | Backend cambia entre esta auditoría y la implementación | M0.6 define baseline + tests de humo contra backend. Cualquier divergencia en la implementación reabre esta issue o crea issue dedicada. |
| R3 | Subagentes pierden contexto y producen info engañosa | Se hizo check cruzado entre los 3 subagentes: contradicciones (ej. demo-order 404 en prod vs sólo disponible en local) marcadas explícitamente. |
| R4 | 5 huecos tipográficos se ignoran | Listados como §6 de `DISCOVERY.md` con plan de creación en M0.4. |
| R5 | Decisiones pujadas (OpenPay, deep links) se ignoran | Marcadas como §7 de `DISCOVERY.md` con dueño de spec asignada. |

## Plan de implementación

| # | Paso | Salida |
|---|---|---|
| 1 | Lanzar 3 subagentes `explore` en paralelo: API contracts / TS types / peculiarities | 3 reportes exhaustivos |
| 2 | Consolidar los hallazgos en `DISCOVERY.md` + `docs/audit/*.md` | 4 archivos Markdown |
| 3 | Redactar esta spec, llevarla de `DRAFT` → `APPROVED` → `DONE` | `.spec/2026-09-09-m0-1-auditar-contratos.md` |
| 4 | Actualizar `STATE.md` con fase `DONE` | `STATE.md` |
| 5 | Commit + push a rama `chore/m0-1-auditar-contratos` | commit en repo |
| 6 | Resumen al usuario + esperar visto bueno para M0.2 | comunicación |

---

## Escenarios BDD (verificación del audit)

Cada escenario valida un aspecto del artefacto producido.

### Escenario 1 — Audit exhaustivo del comprador

**Dado** que el backend Laravel está en `/home/user/code/codeweb/101tags.com-/`
**Y** `routes/api.php` contiene 67+ rutas
**Cuando** se lee `routes/api.php` + Controllers de `app/Http/Controllers/Api/*`
**Entonces** `docs/audit/audit-1-api-contracts.md` lista todas las rutas buyer-side
**Y** separa explícitamente las que NO pertenecen al comprador (admin/*, supplier/*, webhook).

### Escenario 2 — TS types espejados

**Dado** que el storefront tiene 19 archivos en `storefront/src/types/*.ts`
**Cuando** se leen los 19 archivos + `api/client.ts`
**Entonces** `docs/audit/audit-2-typescript-types.md` los inventaría
**Y** lista los tipos reutilizables para mobile
**Y** marca los 5 gaps que mobile debe resolver.

### Escenario 3 — Peculiaridades con cita

**Dado** que `DISCOVERY.md` §4 declara 5 peculiaridades críticas
**Cuando** se abre `docs/audit/audit-3-peculiarities.md`
**Entonces** cada peculiaridad tiene cita `file:line` del backend Laravel.

### Escenario 4 — Discrepancias con PLAN.md

**Dado** que `PLAN.md` anticipa una arquitectura
**Y** el backend puede diferir
**Cuando** se comparan
**Entonces** `DISCOVERY.md §5` lista discrepancias detectadas con resolución.

### Escenario 5 — Huecos tipográficos accionables

**Dado** que faltan algunos DTOs en `storefront/types/*.ts`
**Cuando** se revisan los endpoints del backend
**Entonces** `DISCOVERY.md §6` lista los huecos con plan de creación en mobile (ruta del archivo TS a crear).

### Escenario 6 — Decisiones pujadas explícitas

**Dado** que esta auditoría no debe tomar decisiones de implementación
**Cuando** se detecta algo que afecta diseño (OpenPay nativo, deep links)
**Entonces** `DISCOVERY.md §7` lo registra como decisión con dueño de spec asignado.

### Escenario 7 — Implicaciones para M0.4

**Dado** que M0.4 generará el workspace Ionic
**Cuando** se lee `DISCOVERY.md §8`
**Entonces** se obtiene la lista de modelos iniciales + interceptores + estructura de carpetas
**Y** está alineada con `PLAN.md §Estructura`.

### Escenario 8 — Riesgos con mitigación

**Dado** que cualquier auditoría tiene riesgos de obsolescencia
**Cuando** se lee `DISCOVERY.md §9`
**Entonces** cada riesgo tiene mitigación concreta.

### Escenario 9 — Salida verificable

**Dado** que esta spec requiere una Definition of Done
**Cuando** se compara `DISCOVERY.md §10` con la realidad
**Entonces** todos los bullets están marcados como cubiertos.

---

## Checklist

- [x] Spec aprobada (status APPROVED → DONE)
- [x] BDD completo
- [x] Tests escritos (RED) — N/A: no hay código que probar todavía
- [x] Tests fallando correctamente — N/A
- [x] Implementación (GREEN) — producción del audit (artefacto de discovery)
- [x] Refactor — N/A (documentos)
- [x] Verification completa — BDD scenarios validados manualmente contra archivos generados
- [x] STATE.md actualizado

## Notas finales

- Esta issue es de **discovery**. Su "implementación" son documentos.
- No hay rama `main` modificada: todo en `chore/m0-1-auditar-contratos` esperando tu visto bueno para merge o para abrir M0.2 como nueva rama.
- Las **decisiones pujadas** (D-OPENPAY-NATIVE, D-DEEPLINK-RESET, etc.) se cerrarán en specs dedicadas, no aquí.
