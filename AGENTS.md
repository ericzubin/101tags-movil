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
- Stack objetivo **actual** (post-pivote Sept 2026): **React Native 0.86 + Expo SDK 57 + Expo Router 6 + Nativewind 4 + Zustand 5 + TanStack Query 5 + Jest 29 + ESLint 9 + pnpm 10 + Node 24 LTS**.
- El stack objetivo **original** (pre-pivote) era Ionic 7 + Angular 17 + Capacitor 6 + Tailwind + pnpm. Fue sustituido en M0.2-PIVOT / M0.3-PIVOT por decisión explícita del usuario. Ver `DISCOVERY.md §PIVOTE`.
- Antes del scaffold, la spec F0 debe validar compatibilidad vigente con requisitos de Android/iOS (Play Store targetSdk ≥ 35, App Store iOS ≥ 15) y de Expo/RN ecosystem.
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

- **No usar `@react-native-async-storage/async-storage` ni `localStorage` ni `expo-file-system` como almacenamiento cifrado del bearer token.** AsyncStorage es almacenamiento plano sin cifrado.
- La solución obligatoria es **`expo-secure-store`** (built-in Expo SDK 57): Keychain en iOS, Android Keystore AES-GCM en Android.
- Antes de implementar Auth, la spec debe confirmar el wrapper sobre `expo-secure-store` con fallback explícito para web (donde `isAvailableAsync()` retorna `false`).
- El logout debe borrar credenciales persistidas (`SecureStore.deleteItemAsync('auth.token')` + `SecureStore.deleteItemAsync('auth.user')`).

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

- **React Native 0.86** + **Expo SDK 57** (Sept 2026) + Expo Router 6 (file-based).
- **TypeScript 5.7.x** (TS 6 NO soportado por RN 0.86 todavía).
- **Hermes + New Architecture** habilitados por default.
- **Nativewind v4** + Tailwind 3.4 para styling (Nativewind v5/Tailwind 4 aún pre-release).
- **Zustand 5** para estado local + **TanStack Query v5** para data fetching.
- **expo-secure-store 15** para tokens (built-in; Keychain/Keystore).
- **EAS Build 16** para builds cloud iOS/Android.
- Sanctum bearer tokens contra la API Laravel (`Authorization: Bearer …`).
- Idioma: `es-MX`.
- Branding: rojo `#E31E24`, negro `#0a0a0a`, gris `#F5F5F5`, fuente Montserrat.
- App ID: `mx.com.tags.movil` (iOS bundleIdentifier + Android package).
- Versiones exactas: congeladas en M0.3-PIVOT (ver `.spec/2026-09-09-m0-3-validar-versiones.md`).
- Antes del M0.4 se ejecutó el pivote desde Ionic+Angular+Cap (M0.1-M0.4-Ionic) a este stack. Historial en git; ver `DISCOVERY.md §PIVOTE`.

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
