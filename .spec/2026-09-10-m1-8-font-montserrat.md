# Spec: M1.8-font-montserrat — Cargar y aplicar Montserrat realmente (bundlear fuentes + expo-font + Font.loadAsync)

**Status**: APPROVED (auto-aprobado)
**Spec ID**: 2026-09-10-m1-8-font-montserrat
**Author**: Agente principal (Architect)
**Date**: 2026-09-10
**Banda**: Tier 4 — branding/cosmético
**Issue auditada que resuelve**: #56 (MEDIA)
**Decisión de producto**: **Bundlear Montserrat** (Regular 400 + Bold 700) en `assets/fonts/`. Justificación: branding declarado en `AGENTS.md` y `PLAN.md` (fuente Montserrat). Coste: ~150KB APK (aceptable). Alternativa system-ui descartada porque la marca es Montserrat.

---

## Contexto

Issue #56: Montserrat está declarada como brand font en `src/theme/tokens.ts` y `tailwind.config.js` pero NO está cargada realmente. El device/browser cae en fallback a `system-ui`/`sans-serif`. El usuario nunca ve Montserrat.

Evidencia de la auditoría:
- `expo-font` NO está en `package.json` (solo transitivo).
- No hay `.ttf`/`.otf` files en `assets/`.
- `app.json` no tiene bloque `fonts` ni `expo-font` en `plugins`.
- `Font.loadAsync`/`useFonts` no se llama en ningún sitio.
- Tests solo verifican presencia del string "Montserrat".

## Problema

- Toda la UI dice "Montserrat" pero renderiza como San Francisco (iOS) / Roboto (Android) / Arial (web).
- Brand inconsistente: las pantallas de auth, tabs, etc. NO reflejan la identidad visual declarada.
- Si marketing/assets dicen "Montserrat", el cliente ve otra fuente — desconexión.

## Objetivo

1. **Montserrat-Regular (400) y Montserrat-Bold (700) bundled** en `assets/fonts/`.
2. **`expo-font` agregado** a `package.json` (no solo transitivo).
3. **`expo-font` plugin agregado** a `app.json` con paths a los `.ttf`.
4. **`Font.loadAsync`** llamado en `app/_layout.tsx` antes de renderizar contenido; splash gate hasta que fuentes estén listas.
5. **Web (expo-router web export)** también carga Montserrat vía `@font-face` en `global.css` con la misma URL (CDN Google Fonts o path relativo al bundle).
6. Tests de brand actualizados para verificar que las fuentes existen en disco y que el wiring está completo (no solo string presence).

## Fuera de alcance

- Múltiples weights adicionales (sólo Regular + Bold para MVP).
- Montserrat-Italic, Montserrat-Light, etc.
- Cambiar `brandFonts.brand` a otra familia.
- Reescribir tipografía completa de la app (sólo cargar Montserrat, no cambiar jerarquía/type-scale).
- Tests visuales con snapshots de font rendering (eso requiere device, fuera del MVP).

## Arquitectura afectada

### Crear
- `assets/fonts/Montserrat-Regular.ttf` (~74KB)
- `assets/fonts/Montserrat-Bold.ttf` (~76KB)
- `src/app/__tests__/font-loading.spec.ts` — verifica que `Font.loadAsync` se llama con los assets correctos y que `_layout.tsx` espera el load.

### Modificar

- `package.json`: añadir `"expo-font": "~14.x"` a `dependencies`. Verificar versión compatible con SDK 57 (`expo-font@~14.0.x` o la que esté lockeada como transitiva — leer `pnpm-lock.yaml` para la versión exacta).
- `app.json`: añadir `expo-font` a `plugins`:
  ```json
  "plugins": [
    "expo-router",
    "expo-secure-store",
    "expo-font",
    ["expo-splash-screen", {...}],
    ["expo-build-properties", {...}]
  ]
  ```
  Y bloque `fonts` no es necesario si usamos `expo-font` plugin (lo hace vía assets auto-detect).
- `src/app/_layout.tsx`: añadir `useEffect` con `Font.loadAsync({ 'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'), 'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf') })`. Gate render con state `fontsLoaded`.
- `tailwind.config.js`: `fontFamily.brand` puede quedar como `'Montserrat-Regular'` (sin fallback en Tailwind config) + fallback CSS en global.css. O mantener `'Montserrat'` como family-name y mapear a Regular/Bold por peso en CSS.
- `src/global.css`: añadir `@font-face` para web export:
  ```css
  @font-face {
    font-family: 'Montserrat';
    font-weight: 400;
    font-style: normal;
    src: url('/assets/fonts/Montserrat-Regular.ttf') format('truetype');
  }
  @font-face {
    font-family: 'Montserrat';
    font-weight: 700;
    font-style: normal;
    src: url('/assets/fonts/Montserrat-Bold.ttf') format('truetype');
  }
  ```
- `src/theme/__tests__/tokens.spec.ts`: actualizar el test que verifica `fontFamily.includes('Montserrat')` — ahora debe verificar que el array resuelve a los weights correctos (Regular para 400, Bold para 700).
- `src/theme/__tests__/nativewind-tokens.spec.ts`: actualizar para verificar que tailwind config usa los weights correctos.
- Nuevo `src/app/__tests__/font-loading.spec.ts`:
  - Mock `expo-font` `loadAsync`.
  - Verificar que `_layout.tsx` lo llama con `'Montserrat-Regular'` y `'Montserrat-Bold'`.
  - Verificar que NO renderiza children hasta `fontsLoaded === true`.

### No tocar
- `src/core/api/*`, `src/core/services/*`, `src/stores/*` — fuera de alcance.
- Backend Laravel.

## Contratos

### Asset paths

- `assets/fonts/Montserrat-Regular.ttf`
- `assets/fonts/Montserrat-Bold.ttf`

### expo-font plugin auto-detect

`expo-font` plugin en `app.json` escanea `assets/fonts/` por defecto y registra los assets automáticamente. No requiere bloque `fonts` explícito si los archivos están en esa carpeta.

### Font name mapping (Tailwind / Nativewind)

```js
// tailwind.config.js
fontFamily: {
  brand: ['Montserrat-Regular', 'Montserrat-Bold', 'system-ui', 'sans-serif'],
}
```

Nativewind mapea font-weight → variant de Tailwind. Para que `font-bold` use Montserrat-Bold y `font-normal` use Montserrat-Regular, se requiere fontFamily consistente (mismo nombre) + CSS `@font-face` con diferentes `font-weight`. Esta es la práctica estándar.

Alternativa simple (recomendada): usar el nombre family `'Montserrat'` en `@font-face` con diferentes weights, y en Tailwind `fontFamily.brand = ['Montserrat', 'system-ui', 'sans-serif']`. Así `font-bold` resuelve a la variante 700.

### Font loading sequence (_layout.tsx)

```tsx
import { useEffect, useState } from 'react';
import * as Font from 'expo-font';

const [fontsLoaded, setFontsLoaded] = useState(false);

useEffect(() => {
  Font.loadAsync({
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
  }).then(() => setFontsLoaded(true));
}, []);

if (!fontsLoaded) return null;  // o splash
```

## Acceptance Criteria (BDD)

### AC1: Archivos TTF en assets/fonts/

```gherkin
Scenario: Archivos bundled
  Given assets/fonts/ en repo
  Then existe Montserrat-Regular.ttf (>50KB)
  And existe Montserrat-Bold.ttf (>50KB)
```

### AC2: expo-font en package.json

```gherkin
Scenario: Dependencia declarada
  Given package.json
  Then contiene "expo-font": "~<versión compatible SDK 57>"
```

### AC3: expo-font plugin en app.json

```gherkin
Scenario: Plugin registrado
  Given app.json plugins array
  Then contiene "expo-font"
```

### AC4: Font.loadAsync se llama en _layout.tsx

```gherkin
Scenario: Loading wired
  Given Font.loadAsync mockeado
  When app/_layout.tsx monta
  Then Font.loadAsync fue llamado con map conteniendo 'Montserrat-Regular' y 'Montserrat-Bold'
```

### AC5: Gate hasta fonts loaded

```gherkin
Scenario: Children no renderizan antes de fonts
  Given Font.loadAsync mockeado para NO resolver (Promise pendiente)
  When _layout.tsx monta
  Then children NO se renderizan (o se renderiza splash/gate)
```

### AC6: global.css tiene @font-face para web

```gherkin
Scenario: Web export
  Given src/global.css
  Then contiene @font-face { font-family: 'Montserrat'; font-weight: 400; ... }
  And contiene @font-face { font-family: 'Montserrat'; font-weight: 700; ... }
```

### AC7: Tailwind brand family correcto

```gherkin
Scenario: Tailwind config
  Given tailwind.config.js
  Then fontFamily.brand[0] === 'Montserrat' (family name unificado)
  And fontFamily.brand.includes('system-ui')
  And fontFamily.brand.includes('sans-serif')
```

### AC8: Test verifica wiring completo

```gherkin
Scenario: Test integrado
  When pnpm test src/app/__tests__/font-loading.spec.ts
  Then exit 0
  And ≥4 tests pasan
```

### AC9: Tests existentes actualizados (no rompe tokens/nativewind-tokens)

```gherkin
Scenario: Regresión tokens
  When pnpm test src/theme/__tests__/tokens.spec.ts
  Then exit 0
  And tests verifican weight mapping (no solo string presence)
```

## Definition of Done

- [ ] Spec escrita.
- [ ] `assets/fonts/Montserrat-Regular.ttf` descargado y committed (licencia OFL Google Fonts).
- [ ] `assets/fonts/Montserrat-Bold.ttf` descargado y committed.
- [ ] `expo-font` agregado a `package.json` (versión compatible SDK 57).
- [ ] `expo-font` agregado a plugins en `app.json`.
- [ ] `src/app/_layout.tsx` con `Font.loadAsync` + gate.
- [ ] `src/global.css` con `@font-face` (web).
- [ ] `src/app/__tests__/font-loading.spec.ts` creado (≥4 tests).
- [ ] Tests actualizados en `tokens.spec.ts` y `nativewind-tokens.spec.ts`.
- [ ] `pnpm typecheck` exit 0.
- [ ] `pnpm lint` exit 0.
- [ ] Cada `pnpm test <archivo>` exit 0.
- [ ] STATE.md, TASKS.md, spec DONE; commit docs a `developer`.
- [ ] PR contra `developer`, NO merge.

## Riesgos y pendientes

- **TTF source:** Montserrat está bajo SIL Open Font License (OFL). Google Fonts lo distribuye gratis. Descargar de `https://fonts.google.com/specimen/Montserrat` o via CDN. Verificar que el archivo es OFL antes de bundlear (es license-compatible con商用).
- **Versión expo-font:** SDK 57 puede esperar expo-font@~14.x. Leer `pnpm-lock.yaml` para la versión exacta que ya está como transitiva y bumpearla a directa. Si la versión transitiva es incompatible, instalar la correcta.
- **Web export `dist/`** se regenera y los TTF se incluyen automáticamente si `expo-font` plugin está bien configurado. Validar con `pnpm export --platform web` (alto I/O — pedir autorización antes).
- **Tamaño APK aumenta ~150KB.** Aceptable. Si se quisiera optimizar más tarde, subset WOFF2 para web only.
- **Tests visuales con device:** no incluidos. Asumimos que si fonts cargan + Tailwind referencia la family, render es correcto.
- **iOS `UIAppFonts` Info.plist**: `expo-font` plugin genera `UIAppFonts` automáticamente desde `assets/fonts/`. Sin acción manual.
- **Android resources**: idem, generado automáticamente.

## Handover

Al cerrar:
- ~8 tests nuevos / actualizados.
- Total tests: 232 → **~240**.
- Brand font realmente aplicado.
- Próximo: **M1.9-forgot-reset (backlog original)** o volver a issues de auditoría.
