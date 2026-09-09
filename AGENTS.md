# PROJECT AGENT INSTRUCTIONS — 101tags mobile

Este es un proyecto **greenfield**.

No existe LEGACY BASELINE porque la app todavía no se ha generado.

Cualquier trabajo sobre este proyecto debe seguir:

**SDD → BDD → TDD RED → TDD GREEN → REFACTOR → VERIFICATION**

---

## Antes de cualquier tarea

1. Leer este `AGENTS.md` completo.
2. Leer `STATE.md`.
3. Leer `.agent/WORKFLOW.md`.
4. Revisar `.spec/` (la spec activa si existe).
5. Inspeccionar el código relacionado.
6. Revisar `git status` y cambios sin commit.
7. No asumir que cambios pendientes son tuyos.
8. Preservar trabajo previo del usuario u otros agentes.

---

## Regla de alcance

- Modificar únicamente archivos necesarios para la tarea.
- No realizar refactors no relacionados.
- No "limpiar" código que no sea parte de la spec.

## Compatibilidad

- Esta app aún no tiene usuarios: cualquier contrato es trazable a la API Laravel existente (`/home/user/code/codeweb/101tags.com-/routes/api.php`).
- Consumir la API tal cual está. **No pedir cambios al backend** salvo que la spec lo justifique explícitamente y el usuario los apruebe.

## Dependencias

- No agregar ni actualizar dependencias sin justificación técnica clara documentada en la spec.
- Stack esperado (aún no instalado): Ionic 7, Angular 17, Capacitor 6, Tailwind, pnpm.
- Si la spec requiere algo distinto, documentarlo.

## Git

Nunca ejecutar automáticamente:

- `git add`
- `git commit`
- `git push`
- `git merge`
- `git rebase`
- `git reset --hard`
- `git checkout .`
- `git clean -fd`

Sin autorización explícita del usuario.

## Seguridad

Nunca:

- Hardcodear credenciales, tokens o secrets.
- Debilitar autenticación.
- Desactivar autorización.
- Eliminar validaciones.
- Exponer storage tokens.
- Saltarse HTTPS.

Para tokens Sanctum: usar **Capacitor Preferences con `secure: true`** (Keychain iOS / Keystore Android).

Para build targets: nunca commitear keystores ni `.env` con secretos reales.

## Tests

Nunca:

- Borrar tests que fallan.
- Comentar tests para hacer Green.
- Cambiar expectativas correctas para que coincidan con implementación incorrecta.
- Afirmar que los tests pasan sin ejecutarlos.

---

## Stack esperado

- Ionic 7 + Angular 17 (standalone components, signals, `inject()`)
- Capacitor 6 (iOS + Android)
- Tailwind CSS
- Sanctum bearer tokens contra `http://localhost:8000/api` en dev
- Idioma: es-MX
- Branding: rojo `#E31E24`, negro `#0a0a0a`, gris `#F5F5F5`, fuente Montserrat

---

## Multi-agente

Roles permitidos (ver `.agent/WORKFLOW.md`):

- **Architect** — Discovery + SDD + arquitectura
- **QA / Tester** — BDD + TDD Red
- **Developer** — implementación (TDD Green)
- **Reviewer** — verificación final + refactor

Si el sistema permite subagentes reales, usarlos.
Si NO los permite, ejecutar los roles **secuencialmente** dentro del mismo agente.
La metodología importa más que la existencia física de subagentes.
