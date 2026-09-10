# Spec: Baseline de calidad, reglas ESLint custom y smoke tests ampliados (M0.6-PIVOT)

**Status**: DRAFT → DONE on TDD Green + verification
**Spec ID**: 2026-09-09-m0-6-pivot-quality-baseline
**Author**: agente (pivote M0.6 — sustituye el `M0.6` original Ionic/Angular de TASKS.md)
**Date**: 2026-09-09
**Related specs**:
- `.spec/00-rn-expo-scaffold.md` (APPROVED — fuente del scaffold RN+Expo 57)
- `.spec/2026-09-09-m0-3-validar-versiones.md` (APPROVED — matriz RN+Expo 57)
- `.spec/2026-09-09-m0-4-workspace-rn-expo.md` (DONE — scaffold concreto)
- `.spec/2026-09-09-m0-5-pivot-theme-nativewind-env.md` (DONE — Nativewind + envs)
- `DISCOVERY.md §PIVOTE` (justificación del stack RN+Expo)

> Esta spec sustituye la entrada `## M0.6 — Establecer baseline de calidad y estructura core` del `TASKS.md` original (que asumía Ionic 7 + Angular 17 + Cap 6) por la versión equivalente sobre el stack RN+Expo 57 lockeado en el pivote Sept 2026. La auditoría del backend (M0.1) y el resto del backlog son agnósticos y se conservan.

## Contexto

Tras M0.5-PIVOT (merge en commit `f0eb996`) el scaffold RN+Expo 57 cuenta con:

- `eslint.config.js` extendiendo `expo` vía `FlatCompat` con ignores para node_modules / ios / android / dist / coverage / configs.
- `tailwind.config.js` con `brand.*` sincronizado a `src/theme/tokens.ts` (test: `src/theme/__tests__/nativewind-tokens.spec.ts`).
- `src/theme/tokens.ts` con `brandColors` (`#E31E24` / `#0a0a0a` / `#F5F5F5` / extras).
- 49/49 tests verdes (7 suites: tokens, nativewind-tokens, env, secure-store, client, auth-store, splash-theme).
- `pnpm validate` (typecheck + lint + test:ci) → exit 0.
- `pnpm exec expo prebuild --no-install --clean` → exit 0, regenera ios/ + android/.
- `pnpm exec expo export --platform web` → 9 static routes, entry JS ~1.2MB.

Lo que falta para cerrar F0:

1. **Reglas ESLint custom** que blinden el branding contra regresiones (hex literales fuera de tokens, `any` fuera de tests, `import type` para type-only).
2. **Tests quality** que aseguren que las reglas custom ESLint están activas y se disparan correctamente.
3. **`docs/quality/baseline.md`** — snapshot real de versiones, baselines (test, lint, typecheck, bundle web, native prebuild).
4. **`pnpm baseline`** script que re-captura el baseline on-demand para los futuros releases.

## Problema

1. **Hex literales filtrándose a componentes**: en `src/app/(auth)/login.tsx` y `register.tsx` ya aparecía `placeholderTextColor="#999"` que rompía el principio "tokens centralizados". Si no se blinda, cualquier PR puede reintroducirlo.
2. **`: any`** en componentes puede colarse sin revisión y desactivar el type-check.
3. **Type-only imports sin `import type`** inflan el bundle y dificultan tree-shaking; debería ser regla.
4. **No existe un baseline capturado** del estado actual verificable de un vistazo. Si en F7 alguien quiere comparar "bundle pre vs post", tiene que re-medir todo a mano.
5. **No hay cobertura de las reglas ESLint custom** — sin tests nadie detecta si se rompió la regla al actualizar `eslint-config-expo`.

## Objetivo

Fortalecer el baseline de calidad con:

- 3 reglas ESLint custom activas (hex colors, no-any, consistent-type-imports).
- 3+ tests nuevos (`src/__tests__/quality/`) que validen el disparo de las reglas.
- `docs/quality/baseline.md` con snapshot real inicial.
- `scripts/baseline.ts` + `pnpm baseline` para re-capturar el baseline en cada release.

## Fuera de alcance

- Reglas adicionales (prettier integrado en lint, jsx-a11y, etc.) — quedan para specs posteriores.
- Dark mode runtime (Nativewind v4 + `userInterfaceStyle: 'automatic'` ya está activo).
- Cambios en `package.json` versiones.
- Tests E2E con Detox / Maestro (F7).
- Cambios backend Laravel.

## Arquitectura afectada

### Archivos a crear

- `.spec/2026-09-09-m0-6-pivot-quality-baseline.md` (esta spec).
- `src/__tests__/quality/hex-color-guard.spec.ts` — ESLint Node API: lint in-memory fixture con `#E31E24` en un componente simulado; assert 1 error con mensaje brand-tokens.
- `src/__tests__/quality/no-any.spec.ts` — ESLint Node API: lint fixture con `: any`; assert 1 error.
- `src/__tests__/quality/type-imports.spec.ts` — ESLint Node API: lint fixture con `import { Foo } from 'mod'` donde Foo es type-only; assert 1 error.
- `src/__tests__/quality/index.spec.ts` — smoke: el workspace tiene ≥54 tests en total y `pnpm lint` exit 0 (cobertura agregada).
- `scripts/baseline.js` — script en JS puro (sin deps nuevas) que ejecuta comandos reales y escribe `docs/quality/baseline.md`.
- `docs/quality/baseline.md` — snapshot real inicial.

### Archivos a modificar

- `eslint.config.js` — añadir los 3 bloques:
  1. Reglas globales: `'@typescript-eslint/no-explicit-any': 'error'`, `'@typescript-eslint/consistent-type-imports': 'error'`.
  2. `files: ['src/**/*.{ts,tsx}']`, `ignores: ['**/__tests__/**', '**/*.spec.ts', '**/*.spec.tsx']` + `no-restricted-syntax` con selector `Literal[value=/...hex.../]` y mensaje brand-tokens.
- `package.json` — añadir `baseline: "node scripts/baseline.js"` (preferimos Node nativo sobre `tsx` para evitar deps nuevas).
- `src/app/(auth)/login.tsx` + `src/app/(auth)/register.tsx` — reemplazar `placeholderTextColor="#999"` por `placeholderTextColor={brandColors.dark}` (necesario para no romper la regla hex custom).
- `src/app/__tests__/splash-theme.spec.ts` — si este test contiene el literal `#999` en la fuente de los archivos escaneados, ya no se considera violación porque los archivos escaneados (login/register) ya no contienen el literal. No requiere cambios.
- `STATE.md` — añadir sección "M0.6-PIVOT DONE" tras commit.

## Decisiones locked (heredadas)

| Decisión | Valor | Fuente |
|---|---|---|
| Stack | RN 0.86 + Expo SDK 57 | `.spec/00-rn-expo-scaffold.md` |
| ESLint | 9 + `eslint-config-expo` (FlatCompat) | `.spec/00-rn-expo-scaffold.md` |
| Branding tokens | `src/theme/tokens.ts` + `tailwind.config.js` | `.spec/2026-09-09-m0-5-pivot-theme-nativewind-env.md` |
| App ID | `mx.com.tags.movil` | AGENTS |
| Idioma | `es-MX` | AGENTS |
| Backend | Laravel 12 existente en `101tags.com-` | AGENTS §Compatibilidad |

### Decisión M0.6: scripting del baseline

- Se descarta `tsx` (requeriría añadir dep + lockfile update).
- Se opta por **`scripts/baseline.js`** (Node 24 LTS nativo ejecuta JS sin transpilación).
- Justificación: el script sólo necesita `child_process` + `node:fs`/`node:path` (todos built-in).
- Si en el futuro el script crece y se quiere tipado, se puede migrar a TS con `--experimental-strip-types` (Node 24) sin añadir deps.

## Contratos

### ESLint custom rules

- `eslint.config.js` (estructura final):
  ```js
  const { FlatCompat } = require('@eslint/eslintrc');
  const HEX_COLOR_PATTERN = /#[0-9A-Fa-f]{3,8}\b/;
  const ALLOWED_HEX_PATHS = [
    'src/theme/tokens.ts',
    'tailwind.config.js',
    'src/global.css',
  ];
  const compat = new FlatCompat({ baseDirectory: __dirname });
  module.exports = [
    {
      ignores: [
        'node_modules/**',
        '.expo/**',
        'dist/**',
        'web-build/**',
        'android/**',
        'ios/**',
        'coverage/**',
        '*.config.js',
        ...ALLOWED_HEX_PATHS,  // brand tokens y config global no se lintean con la regla hex
      ],
    },
    ...compat.config({ extends: ['expo'] }),
    {
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/consistent-type-imports': 'error',
      },
    },
    {
      files: ['src/**/*.{ts,tsx}'],
      ignores: ['**/__tests__/**', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: `Literal[value=/${HEX_COLOR_PATTERN.source}/]`,
            message:
              'No hex colors en componentes. Usá Nativewind (bg-brand-primary) o brandColors desde src/theme/tokens.ts.',
          },
        ],
      },
    },
  ];
  ```

- Notas:
  - Los tests `src/**/__tests__/**` y `**/*.spec.ts(x)` están **excluidos** de la regla hex (consistente con `splash-theme.spec.ts` que usa hex literals en strings de regex).
  - Los archivos `src/theme/tokens.ts`, `tailwind.config.js`, `src/global.css` están en `ignores` global — pueden contener hex.
  - `no-restricted-syntax` aplica **también a string templates y template literals** porque `Literal` en ESLint AST matchea tanto `Literal` numérico como string cuando su valor matchea la regex. Se confirma en TDD Red.
  - `@typescript-eslint/no-explicit-any` y `consistent-type-imports` son globales — sólo los tests los ignoran en su suite (ver `eslint-disable` o el override existente en `eslint-config-expo`).

### `scripts/baseline.js`

API mínima:

```js
// scripts/baseline.js
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// 1. Lee package.json → versiones (eslint, jest, typescript, nativewind, etc.)
// 2. Lee node_modules/typescript/package.json para ts real.
// 3. Ejecuta `pnpm test:ci` con `JEST_SUMMARY=true` → capturamos "Tests: X passed".
// 4. Ejecuta `pnpm lint` → exit 0 / 1.
// 5. Ejecuta `pnpm typecheck` → exit 0 / 1.
// 6. Lee dist o genera export --output-dir /tmp/m0-6-baseline-XXX → captura bytes + número de rutas estáticas + presencia de #E31E24 en entry JS.
// 7. Ejecuta `pnpm exec expo prebuild --no-install --clean` (sólo captura iOS deployment target + Android compileSdk/targetSdk/minSdk via grep en app.json).
// 8. Genera docs/quality/baseline.md con formato markdown table.
// 9. Imprime resumen al final.
```

Consideraciones:
- El script debe ser **idempotente** y **no destructivo**: nunca borra `ios/` o `android/` regenerados, sólo lee.
- Si prebuild falla, el baseline igual se escribe pero marca el campo como "UNKNOWN".
- Si web export falla, similar.
- El script NO se ejecuta dentro de `pnpm validate` (es opt-in via `pnpm baseline`).

### `docs/quality/baseline.md`

Estructura:

```markdown
# Quality Baseline — 101tags Mobile

> Captured: YYYY-MM-DD (auto-generated by `pnpm baseline`)

## Tools

| Tool | Version |
|---|---|
| ... | ... |

## Test baseline
- Suites: N
- Tests: M
- All green: ✅
- Exit code: 0

## Lint baseline
- Errors: 0
- Warnings: 0
- Exit code: 0
- Custom rules: ...

## Typecheck baseline
- Errors: 0
- Exit code: 0

## Bundle baseline (web export)
- Static routes: N
- Entry JS: ~MB
- Total bundle: ~MB
- Brand hex literals in bundle: ✅ (#E31E24, #0a0a0a)

## Native baseline
- iOS deployment target: 15.1
- Android compileSdk: 36
- Android targetSdk: 36
- Android minSdk: 24
- App ID: mx.com.tags.movil
- Hermes: ON
- New Architecture: ON
```

## Compatibilidad

- **Web (jsdom)**: tests quality usan ESLint Node API directamente; no requieren DOM.
- **Node 24 LTS**: `scripts/baseline.js` usa APIs nativas (`child_process.spawn`, `node:fs`, `node:path`).
- **EAS Build (producción)**: el baseline mide la build local + web export; el build cloud (EAS) queda fuera de scope.

## Riesgos

1. **`Literal[value=/regex/]` en ESLint AST**: la regla `no-restricted-syntax` puede no capturar string templates con hex (``#E31E24``). El selector matchea `Literal` (string/numeric), no `TemplateElement`. Si en algún momento alguien escribe `const x = \`#E31E24\`;`, no se detecta. Mitigación: documentado en spec; si surge necesidad, ampliar selector a `Literal` + `TemplateElement`.
2. **`scripts/baseline.js` lee versiones de `node_modules`**: si el árbol de node_modules no está instalado, falla con error claro. Mitigación: el script verifica `node_modules/typescript/package.json` antes de continuar.
3. **`pnpm baseline` puede tardar 1-2 minutos** (regenera web export). Se documenta en el README/spec.
4. **`eslint.config.js` con FlatCompat**: `eslint-config-expo` 9.x + ESLint 9.39 puede tener warnings de deprecation. No son errores; se documentan en baseline.
5. **Regla `no-restricted-syntax` puede ser ruidosa en tests que usan hex literals en regexes (e.g. `splash-theme.spec.ts`)**: tests están en `ignores` de la regla, OK.

## Plan de implementación

1. **Spec**: crear este archivo (DRAFT → APPROVED en TDD Green).
2. **TDD Red**:
   - Crear `src/__tests__/quality/hex-color-guard.spec.ts` con fixture que tiene `#E31E24` literal. **Al inicio este test falla** porque la regla aún no existe — pero como la fixture es in-memory, el test puede ejecutarse aunque la regla esté deshabilitada: asserta que ESLint reporta ≥1 error de tipo `no-restricted-syntax` con el mensaje brand-tokens. Si la regla no existe, el test reporta "expected 1+ errors, got 0".
   - Crear `src/__tests__/quality/no-any.spec.ts` similar para `: any`.
   - Crear `src/__tests__/quality/type-imports.spec.ts` similar para `import { Type }` cuando `Type` es type-only.
   - Crear `src/__tests__/quality/index.spec.ts` (smoke: workspace tiene ≥54 tests via `expect(...).toBeGreaterThanOrEqual(54)`).
3. **TDD Green**:
   - Actualizar `eslint.config.js` con los 3 bloques.
   - Reemplazar `placeholderTextColor="#999"` por `brandColors.dark` en `login.tsx` + `register.tsx`.
   - Verificar que `pnpm test:ci` reporta ≥54 tests verdes.
   - Verificar que `pnpm lint` exit 0.
4. **Refactor**: ningún cambio fuera de scope.
5. **Verification**:
   - `pnpm install` exit 0.
   - `pnpm typecheck` exit 0.
   - `pnpm lint` exit 0.
   - `pnpm test:ci` exit 0, ≥54 tests verdes.
   - `pnpm validate` exit 0.
   - `pnpm exec expo prebuild --no-install --clean` exit 0.
   - `pnpm exec expo export --platform web --output-dir /tmp/m0-6-baseline` exit 0.
   - `pnpm baseline` exit 0 + escribe `docs/quality/baseline.md`.
6. **Commit** (sin push).

---

## Escenarios BDD

### Escenario 1 — ESLint config con 3 reglas custom

**Dado** el workspace RN+Expo 57
**Cuando** se inspecciona `eslint.config.js`
**Entonces** se extiende `expo` vía `FlatCompat`
**Y** se define `rules['@typescript-eslint/no-explicit-any'] = 'error'`
**Y** se define `rules['@typescript-eslint/consistent-type-imports'] = 'error'`
**Y** se define un bloque `files: ['src/**/*.{ts,tsx}']` con `ignores` que excluye `**/__tests__/**` y `**/*.spec.*` y dentro `rules['no-restricted-syntax']` con selector `Literal[value=/#[0-9A-Fa-f]{3,8}\\b/]` y mensaje que menciona `Nativewind` o `brandColors` o `src/theme/tokens.ts`.

### Escenario 2 — Lint baseline en cero

**Dado** un checkout limpio + `pnpm install` ejecutado
**Cuando** se ejecuta `pnpm lint`
**Entonces** exit 0 y stdout reporta "0 errors, 0 warnings" (o equivalente).

### Escenario 3 — Hex color en componente dispara regla

**Dado** un archivo TS de prueba `src/app/__fixtures__/bad-component.tsx` con literal `#E31E24`
**Cuando** se ejecuta `pnpm lint` (con la regla activa)
**Entonces** exit != 0 y ESLint reporta `no-restricted-syntax` con mensaje brand-tokens.

### Escenario 4 — `any` en componente dispara regla

**Dado** un archivo TS de prueba con `const x: any = 1`
**Cuando** se ejecuta `pnpm lint`
**Entonces** exit != 0 y ESLint reporta `@typescript-eslint/no-explicit-any`.

### Escenario 5 — `docs/quality/baseline.md` existe y contiene campos requeridos

**Dado** el workspace con `pnpm baseline` ejecutado
**Cuando** se inspecciona `docs/quality/baseline.md`
**Entonces** contiene una sección "Tools" con tabla de versiones
**Y** contiene una sección "Test baseline" con al menos 49 tests
**Y** contiene una sección "Lint baseline" con 0 errors, 0 warnings
**Y** contiene una sección "Typecheck baseline" con 0 errors
**Y** contiene una sección "Bundle baseline (web export)" con número de static routes ≥9
**Y** contiene una sección "Native baseline" con iOS deployment target 15.1, Android compileSdk/targetSdk 36, minSdk 24, App ID `mx.com.tags.movil`.

### Escenario 6 — `pnpm validate` exit 0 (regression check)

**Dado** los cambios M0.6 aplicados
**Cuando** se ejecuta `pnpm validate`
**Entonces** exit 0 (`typecheck + lint + test:ci` en secuencia).

### Escenario 7 — Script `pnpm baseline` re-captura métricas

**Dado** el script `scripts/baseline.js`
**Cuando** se ejecuta `pnpm baseline`
**Entonces** exit 0 y se actualiza `docs/quality/baseline.md` con la fecha actual
**Y** no se commitean secrets, keystores ni `ios/`/`android/` regenerados.

### Escenario 8 — Tests quality verifican disparo de reglas

**Dado** los tests `src/__tests__/quality/{hex-color-guard,no-any,type-imports}.spec.ts`
**Cuando** se ejecuta `pnpm test:ci`
**Entonces** los 3+ tests verdes
**Y** cada uno usa la ESLint Node API para lint un archivo in-memory y assertea ≥1 error de la regla esperada.

### Escenario 9 — Total tests ≥54 verdes

**Dado** el workspace con los 3 nuevos spec files
**Cuando** se ejecuta `pnpm test:ci`
**Entonces** exit 0 y `Tests: ≥54 passed`.

### Escenario 10 — Typecheck en cero

**Dado** el workspace
**Cuando** se ejecuta `pnpm typecheck`
**Entonces** exit 0.

### Escenario 11 — Prettier check (N/A documentado)

**Dado** que `package.json` incluye `format:check` (Prettier)
**Cuando** se ejecuta `pnpm format:check`
**Entonces** exit 0 o N/A documentado en baseline si se omite intencionalmente.

### Escenario 12 — Sin regresión: prebuild + web export siguen verdes

**Dado** los cambios M0.6 aplicados
**Cuando** se ejecuta `pnpm exec expo prebuild --no-install --clean`
**Entonces** exit 0, regenera `ios/` + `android/` con appId `mx.com.tags.movil`.

**Dado** los cambios M0.6 aplicados
**Cuando** se ejecuta `pnpm exec expo export --platform web --output-dir /tmp/m0-6-baseline`
**Entonces** exit 0 y se generan ≥9 static routes.

---

## Verification esperada

```bash
cd /home/user/code/codeweb/101tags-movil-m06
source ~/.nvm/nvm.sh && nvm use 24

pnpm install                              # exit 0
pnpm typecheck                            # exit 0
pnpm lint                                 # exit 0
pnpm test:ci                              # exit 0, ≥54 tests verdes
pnpm validate                             # exit 0
pnpm exec expo prebuild --no-install --clean  # exit 0
pnpm exec expo export --platform web --output-dir /tmp/m0-6-baseline  # exit 0, ≥9 static routes
pnpm baseline                             # exit 0, escribe docs/quality/baseline.md
```

## Checklist

- [x] Spec DRAFT redactada
- [ ] TDD Red: tests nuevos fallan antes de reglas custom
- [ ] TDD Green: reglas activas + tests verdes
- [ ] Refactor (sin cambios fuera de scope)
- [ ] Verification real (comandos anteriores)
- [ ] `docs/quality/baseline.md` escrito con datos reales
- [ ] `STATE.md` actualizado con baseline M0.6-PIVOT
- [ ] Commit (sin push, sin PR)
