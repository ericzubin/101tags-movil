# DEVELOPMENT WORKFLOW — 101tags mobile

Este flujo es **obligatorio** para toda tarea: feature, bugfix, refactor, cambio de API, cambio de DB, etc.

---

## FASE 0 — DISCOVERY

Antes de diseñar nada:

- Inspeccionar el código relacionado con la tarea.
- Localizar tests existentes.
- Localizar contratos de API.
- Localizar migrations (si aplica).
- Localizar documentación.
- Revisar dependencias relevantes.
- Comprobar `git status` y cambios sin commit.
- Confirmar el estado actual de la API Laravel (`/home/user/code/codeweb/101tags.com-/routes/api.php`).

**No implementar todavía.**

Salida: lista de hallazgos + preguntas abiertas.

---

## FASE 1 — SDD (Spec-Driven Development)

Crear `.spec/<nombre-de-la-tarea>.md` usando la plantilla de `.spec/README.md`.

La spec **debe** contener (cuando aplique):

- **Contexto**: situación actual.
- **Problema**: qué debe resolverse.
- **Objetivo**: resultado esperado.
- **Fuera de alcance**: qué NO se hace.
- **Arquitectura afectada**: componentes, capas, módulos.
- **Contratos**: endpoints HTTP, request/response, DTOs, eventos, signals, services.
- **Base de datos**: solo si la tarea lo requiere (esta app es frontend; normalmente no toca DB).
- **Seguridad**: autenticación, autorización, validación, sanitización.
- **Compatibilidad**: comportamiento existente a preservar.
- **Riesgos**: regresiones posibles.
- **Plan de implementación**: lista ordenada de cambios.

No implementar código de producción antes de cerrar la spec.

---

## FASE 2 — BDD (Behavior-Driven Development)

Convertir la spec en escenarios ejecutables.

Para cada comportamiento nuevo, escribir:

```
Dado <contexto inicial>
Cuando <acción>
Entonces <resultado esperado>
```

Mínimo requerido:

- Happy path.
- Validaciones (inputs inválidos).
- Errores (401, 403, 404, 422, 5xx según aplique).
- Permisos / ownership.
- Recursos inexistentes.
- Casos límite relevantes.
- Regresiones importantes.

Los escenarios BDD serán la **fuente** de los tests unitarios / de integración.

---

## FASE 3 — TDD RED

Antes de implementar nada:

1. Crear los tests basados en los escenarios BDD.
2. Ejecutarlos.
3. Confirmar que **fallan por la razón correcta**.

RED válido:

- La funcionalidad o comportamiento todavía no existe.

RED inválido (descartar y arreglar antes de avanzar):

- Syntax error.
- Import roto.
- Dependencia faltante accidental.
- Configuración dañada.
- Test mal construido.
- Entorno roto.

Registrar en `STATE.md`:

- Comando ejecutado.
- Tests corridos.
- Cantidad que pasa.
- Cantidad que falla.
- Razón del fallo.

No avanzar a Green sin una fase Red comprobada. Si el cambio no permite Red razonable (ej: cambio puramente visual), documentar el motivo explícitamente en la spec.

---

## FASE 4 — TDD GREEN

Implementar **exclusivamente** lo necesario para:

- Satisfacer la spec.
- Hacer pasar los tests.

Principios:

- Solución mínima correcta.
- No sobreingeniería.
- No abstracciones prematuras.
- Preservar convenciones del proyecto.
- Mantener compatibilidad.
- Manejar errores.
- Aplicar autorización y validación.

Ejecutar los tests de nuevo.

Objetivo: RED → GREEN.

Si aparecen tests que pasan sin haberlos escrito: documentar. Probablemente eran tests legacy que ya cubrían el comportamiento.

---

## FASE 5 — REFACTOR

Con tests verdes:

Revisar:

- Duplicación.
- Naming.
- Responsabilidades (cada clase / función una sola responsabilidad).
- Complejidad ciclomática.
- Separación de capas (services / pages / components / models).
- Performance (consultas, subscripciones, polling).
- Seguridad (no leak de tokens, validación de inputs).
- Código muerto.
- Legibilidad.

**No cambiar comportamiento BDD durante el refactor.**

Volver a ejecutar tests después de cada cambio de refactor.

---

## FASE 6 — VERIFICATION

Antes de declarar DONE, ejecutar (cuando existan):

1. Tests específicos del cambio.
2. Tests del módulo afectado.
3. Suite completa.
4. Lint.
5. Formatter / check.
6. Type check (`tsc --noEmit`).
7. Static analysis (si aplica).
8. Build (`ionic build` / `ng build`).

No inventar comandos. Detectarlos del proyecto.

Si una verificación no puede ejecutarse, documentar el motivo.

Actualizar `STATE.md` con:

- Comandos ejecutados.
- Resultados.
- Riesgos pendientes.
- `Current phase: DONE` o `Current phase: BLOCKED` (con motivo).

---

## MULTI-AGENTE

Roles:

| Rol | Responsabilidad | NO debe |
|---|---|---|
| **Architect** | Discovery, SDD, arquitectura, contratos | Implementar comportamiento final |
| **QA / Tester** | BDD, edge cases, tests, TDD Red | Implementar Green |
| **Developer** | Implementación para conseguir Green | Saltarse la spec |
| **Reviewer** | Diff review, regresiones, seguridad, refactor, Verification | Modificar sin coordinar |

Si el sistema actual **NO permite** crear subagentes reales:

Ejecutar los roles **secuencialmente** dentro del mismo agente:

```
Architect  →  QA  →  Developer  →  Reviewer
```

La metodología importa más que la existencia física de subagentes.

---

## TRABAJO PARALELO

Cuando varios agentes trabajen:

- Evitar editar el mismo archivo simultáneamente sin coordinación.
- Preferir separación por archivos o responsabilidades.
- Antes de integrar cambios:
  - Revisar diff.
  - Comprobar conflictos.
  - Ejecutar tests.
  - Verificar que ningún agente haya revertido cambios de otro.
- El Reviewer revisa el resultado integrado.

---

## HANDOVER / RELEVO

Si una tarea queda incompleta:

1. Actualizar `STATE.md` PRIMERO.
2. Generar bloque `[RELEVO DE AGENTE]` con:

```
[RELEVO DE AGENTE]
Fase actual: <fase>
Spec: <ruta>
Componente actual: <ruta>
Tests: <estado>
Última acción: <acción>
Problema actual: <si existe>
Próximo paso exacto: <acción>
```

3. Antes de continuar, el siguiente agente debe leer:
   - `AGENTS.md`
   - `STATE.md`
   - Spec activa
   - `git status`
   - Diff existente

No reiniciar el trabajo desde cero.

---

## BUGFIXES

Para bugs:

- SDD describe: comportamiento actual incorrecto + comportamiento esperado.
- BDD reproduce el bug.
- TDD Red incluye preferentemente un **regression test** que falle por el bug.
- Green corrige el bug.
- El regression test **permanece** después del arreglo.

---

## HOTFIXES

Solo cuando el usuario solicite explícitamente un hotfix rápido:

- Reducir documentación, pero NUNCA eliminar:
  - Comprensión del problema.
  - Regression test cuando sea técnicamente posible.
  - Verificación final.
- Después del hotfix, completar la documentación pendiente.
- "Hotfix" nunca es excusa para saltarse el protocolo normalmente.

---

## REFACTORS

- Un refactor **NO cambia** comportamiento observable.
- Antes: asegurar tests suficientes del comportamiento afectado.
- Si el área no tiene cobertura, crear tests de caracterización del comportamiento que se pretende preservar.
- Después: refactor → tests → confirmar mismo comportamiento.

---

## DEFINICIÓN DE DONE

Una tarea solo es DONE cuando:

- SDD: ✅ o N/A justificado
- BDD: ✅ o N/A justificado
- TDD Red: ✅ o N/A justificado
- TDD Green: ✅ o N/A justificado
- Refactor: ✅ o N/A justificado
- Verification: ✅ o N/A justificado

**Nunca** marcar ✅ si realmente no se ejecutó la fase.

Al terminar mostrar:

- Resumen.
- Spec (ruta).
- Archivos modificados.
- Tests creados / modificados.
- Tests ejecutados (comando + resultado).
- Verification realizada.
- Riesgos.
- Pendientes.
