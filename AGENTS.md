# PROJECT AGENT INSTRUCTIONS — 101tags mobile

Este es un proyecto **greenfield**.

No existe LEGACY BASELINE porque la app todavía no se ha generado.

Cualquier trabajo sobre este proyecto debe seguir:

**DISCOVERY → SDD → BDD → TDD RED → TDD GREEN → REFACTOR → VERIFICATION**

---

## Antes de cualquier tarea

1. Leer este `AGENTS.md` completo.
2. Leer `STATE.md`.
3. Leer `PLAN.md`.
4. Leer `DISCOVERY.md` para recuperar hallazgos, decisiones, riesgos y contexto técnico extra.
5. Leer `TASKS.md` y localizar el ID de backlog relacionado.
6. Leer `.agent/WORKFLOW.md`.
7. Revisar `.spec/` y leer la spec activa si existe.
8. Inspeccionar el código relacionado.
9. Revisar `git status` y cambios sin commit.
10. No asumir que cambios pendientes son tuyos.
11. Preservar trabajo previo del usuario u otros agentes.

## Fuente de verdad documental

- `AGENTS.md`: reglas de trabajo, alcance y seguridad.
- `.agent/WORKFLOW.md`: metodología obligatoria.
- `PLAN.md`: alcance, arquitectura, contratos y roadmap.
- `DISCOVERY.md`: memoria técnica consolidada de hallazgos, decisiones, correcciones, riesgos y notas extra.
- `TASKS.md`: backlog detallado, dependencias, estimaciones y aceptación.
- `.spec/*.md`: definición ejecutable de cada tarea.
- `STATE.md`: fase real, resultados y relevo.

Si dos documentos se contradicen, **detener implementación**, registrar la discrepancia en Discovery y corregir primero la documentación correspondiente. No resolver contradicciones silenciosamente en código.

---

## Regla de alcance

- Modificar únicamente archivos necesarios para la tarea/spec activa.
- No realizar refactors no relacionados.
- No “limpiar” código que no sea parte de la spec.
- Una tarea de `TASKS.md` no autoriza implementar tareas dependientes por adelantado.
- Si el alcance crece, dividir la spec/tarea antes de seguir.

## Compatibilidad y backend

- Esta app aún no tiene usuarios móviles; sus contratos son trazables a la API Laravel existente de `101tags.com-`.
- Consumir la API tal cual está. **No pedir ni implementar cambios al backend** salvo que Discovery demuestre una carencia, la spec lo justifique y el usuario lo apruebe explícitamente.
- Para contratos, priorizar en este orden: `routes/api.php` → implementación/controladores/requests → tests backend → `storefront/src/api/client.ts` → documentación.
- No duplicar en móvil reglas críticas que el servidor ya debe autorizar/validar; el cliente puede validar UX, pero el backend sigue siendo autoridad.

## Dependencias y versiones

- No agregar ni actualizar dependencias sin justificación técnica clara documentada en la spec.
- Stack objetivo original: Ionic 7, Angular 17, Capacitor 6, Tailwind, pnpm.
- Antes del scaffold, la spec F0 debe validar compatibilidad de esas versiones con requisitos vigentes de Android/iOS.
- Si hace falta una versión distinta, documentar impacto y obtener aprobación antes del cambio.
- No mezclar npm/yarn/pnpm ni generar múltiples lockfiles.

## Git

Nunca ejecutar automáticamente sin autorización explícita del usuario:

- `git add`
- `git commit`
- `git push`
- `git merge`
- `git rebase`
- `git reset --hard`
- `git checkout .`
- `git clean -fd`

Las escrituras de documentación solicitadas explícitamente por el usuario pueden persistirse en el repositorio, pero no autorizan por sí solas cambios funcionales ni merges de código.

## Seguridad

Nunca:

- Hardcodear credenciales, tokens o secrets.
- Debilitar autenticación.
- Desactivar autorización.
- Eliminar validaciones.
- Exponer storage tokens.
- Saltarse HTTPS en producción.
- Loggear passwords, bearer tokens, datos de tarjeta o secretos de OpenPay.

### Token Sanctum

- **No usar `@capacitor/preferences` como si fuera almacenamiento cifrado del bearer token.** Preferences es apropiado para datos ligeros/no sensibles.
- Antes de implementar Auth, la spec debe seleccionar una solución de secure storage respaldada por **Keychain en iOS / Keystore o equivalente seguro en Android**.
- La dependencia elegida debe quedar justificada y aprobada conforme a las reglas del proyecto.
- El logout debe borrar credenciales persistidas.

### Builds nativos

Nunca commitear:

- keystores;
- passwords de signing;
- certificados/provisioning profiles privados;
- `.env` con secretos reales;
- archivos exportados de credenciales de tiendas.

## Tests

Nunca:

- Borrar tests que fallan para conseguir Green.
- Comentar tests para hacer Green.
- Cambiar expectativas correctas para coincidir con implementación incorrecta.
- Afirmar que tests/lint/build pasan sin ejecutarlos.
- Saltarse TDD Red sin una justificación escrita en la spec.

Los escenarios BDD de la spec son la fuente del set mínimo de tests de la tarea.

---

## Stack funcional esperado

- Ionic + Angular standalone components, signals e `inject()`.
- Capacitor para iOS + Android.
- Tailwind CSS.
- Sanctum bearer tokens contra la API Laravel.
- Idioma: `es-MX`.
- Branding: rojo `#E31E24`, negro `#0a0a0a`, gris `#F5F5F5`, fuente Montserrat.
- Versiones exactas: se congelan en F0 después de validación, no por suposición.

---

## Multi-agente

Roles permitidos (ver `.agent/WORKFLOW.md`):

- **Architect** — Discovery + SDD + arquitectura.
- **QA / Tester** — BDD + edge cases + TDD Red.
- **Developer** — implementación mínima para TDD Green.
- **Reviewer** — revisión, seguridad, refactor y Verification.

Si el sistema permite subagentes reales, usarlos cuando mejoren el trabajo.
Si NO los permite, ejecutar los roles **secuencialmente** dentro del mismo agente.
La metodología importa más que la existencia física de subagentes.

## Sincronización con Notion

Notion es un espejo de seguimiento, no reemplaza las fuentes del repositorio.

- Los IDs/títulos `[101M]` de Notion deben corresponder a `TASKS.md`.
- Los hallazgos y contexto técnico extra se conservan primero en `DISCOVERY.md`.
- Cambios de alcance se documentan primero en repo (`PLAN.md`/`DISCOVERY.md`/`TASKS.md`/spec) y después se reflejan en Notion.
- No marcar una tarea Notion como `Done` si la spec/`STATE.md` no cumple la Definition of Done.
- Si Notion y repo difieren, el agente debe reportar y reconciliar la diferencia antes de continuar.
