# Spec: Nativewind theme tokens en componentes + environments ajustados (M0.5-PIVOT)

**Status**: DRAFT → DONE on TDD Green + verification
**Spec ID**: 2026-09-10-m0-5-pivot-theme-nativewind-env
**Author**: agente (pivote M0.5 — sustituye el `M0.5` original Ionic/Angular de TASKS.md)
**Date**: 2026-09-10
**Related specs**:
- `.spec/00-rn-expo-scaffold.md` (APPROVED — fuente del scaffold RN+Expo 57)
- `.spec/2026-09-09-m0-3-validar-versiones.md` (APPROVED — matriz RN+Expo 57)
- `.spec/2026-09-09-m0-4-workspace-rn-expo.md` (DONE — scaffold concreto)
- `DISCOVERY.md §PIVOTE` (justificación del stack RN+Expo)

> Esta spec sustituye la entrada `## M0.5 — Configurar theme, Tailwind, environments y proxy` del `TASKS.md` original (que asumía Ionic 7 + Angular 17 + Cap 6) por la versión equivalente sobre el stack RN+Expo 57 lockeado en el pivote Sept 2026. La auditoría del backend (M0.1) y el resto del backlog son agnósticos y se conservan.

## Contexto

Tras M0.4-PIVOT (merge en commit `a26b6c5`) el scaffold RN+Expo 57 ya tiene:

- `src/theme/tokens.ts` con `brandColors` (primary/primaryShade/primaryTint/dark/medium/success/warning/danger/white/black), `brandFonts` + `fontFamily`, `spacing` (xs/sm/md/lg/xl/xxl).
- `src/global.css` con directivas `@tailwind base/components/utilities` y `src/theme/tokens.css` con custom props `--color-brand-*`.
- `tailwind.config.js` con `brand.primary/dark/medium/success/warning/danger` y `fontFamily.brand` (Montserrat + system-ui + sans-serif).
- `src/constants/env.ts` con interface `Environment` + constante `environment` (production, apiBaseUrl, apiTimeoutMs, currency, defaultLocale, appName, appVersion).
- `src/app/(auth)/login.tsx`, `src/app/(auth)/register.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx` usando `StyleSheet.create` con valores de `brandColors`.
- `src/app/_layout.tsx` con `headerStyle: { backgroundColor: '#E31E24' }` literal en `Stack` de expo-router.
- `src/core/api/client.ts` que lee `environment.apiBaseUrl` y `environment.apiTimeoutMs` directamente.

El branding está en TS pero **no se usa masivamente Nativewind** para los componentes principales: la mayoría siguen con `StyleSheet.create`. El entorno está hardcodeado como objeto estático (sin getters para `__DEV__` + `Platform.OS`) y la URL de producción es un placeholder que no se sustituye por CI — todavía hay una sola constante que no permite `Platform.OS === 'web'` con `localhost:8080`.

## Problema

1. **Theme tokens sólo en TS**, sin uso extendido de Nativewind. La consistencia entre `tokens.ts`, `tailwind.config.js` y `global.css` no está automatizada (si cambia `brandColors.primary`, alguien debe recordar actualizar el `tailwind.config.js`).
2. **`getApiBaseUrl()` no existe**: cualquier cambio entre dev/prod pasa por `if (environment.production) ? ... : ...` pero el árbol actual es plano y `web` (jsdom) y nativo comparten la misma URL.
3. **`getApiTimeoutMs()` no existe**: el `apiTimeoutMs` está frozen en el `environment` singleton; no se puede cambiar en runtime ni discriminar por `__DEV__` correctamente.
4. **Componentes sin Nativewind**: `login.tsx`, `register.tsx`, `TabsLayout`, `_layout.tsx` y `(tabs)/index.tsx` usan `StyleSheet.create` para casi todo. La guía de Nativewind v4 es `className="bg-brand-primary ..."`. Aunque la estética es idéntica, perdemos la trazabilidad automática (si cambia el hex en `tokens.ts`, el `tailwind.config.js` puede divergir silenciosamente).
5. **`Stack` con `headerStyle: { backgroundColor: '#E31E24' }` hardcoded**: en `_layout.tsx` aparece un literal hex que debería referenciar `brandColors.primary` (o la clase Nativewind equivalente).
6. **`api/client.ts` lee el objeto estático `environment`**: debería usar los getters para evitar snapshots congelados.

## Objetivo

Consolidar el theme 101tags como sistema de tokens sincronizado entre `tokens.ts` (TS) + `tailwind.config.js` (Nativewind utilities) + `global.css` (CSS custom props), y forzar a que **al menos LoginScreen, RegisterScreen, TabsLayout y RootLayout** consuman esos tokens vía Nativewind (no `StyleSheet.create`). Añadir `getApiBaseUrl()` y `getApiTimeoutMs()` con lógica `__DEV__` + `Platform.OS`, actualizar `client.ts`, mantener la cobertura de tests al menos en 39 verdes y dejar `expo prebuild` regenerable.

## Fuera de alcance

- Tailwind v4 / Nativewind v5 (siguen pre-release; se mantiene Nativewind v4 + Tailwind 3.4 lockeado).
- Cambios en `package.json` (versiones lockeadas en M0.3-PIVOT).
- Nuevos modelos, pantallas, tabs, flujos de Auth/Checkout (F1-F6).
- Cambios backend Laravel (AGENTS.md §Compatibilidad y backend).
- Sustituir todas las pantallas por Nativewind: en este milestone sólo LoginScreen, RegisterScreen, TabsLayout y RootLayout son obligatorios; resto se materializa en specs de cada feature.
- Dark mode automático (queda alineado con `userInterfaceStyle: 'automatic'` en `app.json`, sin lógica runtime adicional).

## Arquitectura afectada

### Archivos a crear

- `src/theme/__tests__/nativewind-tokens.spec.ts` — valida sincronía tokens.ts ↔ tailwind.config.js.
- `src/app/__tests__/splash-theme.spec.ts` — smoke: layout no contiene hex literales fuera de `brandColors`.
- (extensión) `src/theme/__tests__/tokens.spec.ts` — añadir 3 tests nuevos (fontWeights, radii, spacing).
- (extensión) `src/constants/__tests__/env.spec.ts` — añadir 5 tests nuevos (getApiBaseUrl dev/prod/web, getApiTimeoutMs dev/prod).

### Archivos a modificar

- `src/theme/tokens.ts` — añadir `fontWeights`, `radii`, `spacing` expandido con `brand-1..brand-8`; `as const` por doquier.
- `tailwind.config.js` — sincronizar con `tokens.ts` (`brand.*`, `fontFamily.brand`, `spacing` `brand-1..brand-8`, `borderRadius` `brand-sm/md/lg/pill`).
- `src/global.css` — añadir `@layer base` con `:root { --color-brand-*: R G B }` en tripletas RGB + `body { @apply bg-brand-medium text-brand-dark font-brand }`. **No** se elimina `src/theme/tokens.css` (queda como referencia histórica y para web bundles).
- `src/constants/env.ts` — añadir `getApiBaseUrl()` y `getApiTimeoutMs()`; reemplazar el `apiBaseUrl` placeholder por `PROD_API_BASE_URL` (constante) consumida por el getter; mantener `Environment` interface usando getters.
- `src/core/api/client.ts` — usar `getApiBaseUrl()` + `getApiTimeoutMs()` en lugar de `environment.apiBaseUrl`/`environment.apiTimeoutMs`.
- `src/app/_layout.tsx` — eliminar el literal `'#E31E24'` en `headerStyle.backgroundColor`; usar `brandColors.primary` y `brandColors.medium` referenciados desde tokens. Mantener `Stack` (sigue siendo necesario para agrupar providers); los estilos inline con referencia a `brandColors` siguen siendo válidos y **NO** cuentan como hex literal hardcoded.
- `src/app/(auth)/login.tsx` — reemplazar `StyleSheet.create` por `className="..."` con tokens Nativewind (`bg-brand-medium`, `text-brand-dark`, `bg-brand-primary`, `rounded-brand-md`, etc.). Mantener `Pressable` + `TextInput` + `Text` (Nativewind v4 acepta className en estos componentes RN estándar gracias a `react-native-css-interop`).
- `src/app/(auth)/register.tsx` — mismo patrón que login.
- `src/app/(tabs)/_layout.tsx` — usar `brandColors.primary` para `tabBarActiveTintColor` y `tabBarStyle.backgroundColor` (referencia TS al token, no hex literal). El `headerStyle` se mantiene con `brandColors.primary` también. **NO** se cambia a `tabBarClassName` porque no es API pública estable en expo-router SDK 57 — la referencia TS es suficiente.
- `src/app/(tabs)/index.tsx` — refactor a Nativewind classes (`bg-brand-medium`, `text-brand-primary`, `bg-brand-white`, `rounded-brand-lg`, `shadow-*`).
- `src/app/index.tsx` — sin cambios (no toca theme).

## Decisiones locked (heredadas)

| Decisión | Valor | Fuente |
|---|---|---|
| Stack | RN 0.86 + Expo SDK 57 | `.spec/00-rn-expo-scaffold.md` |
| Nativewind | v4 + Tailwind 3.4 | M0.3-PIVOT |
| Token storage | `expo-secure-store` | DISCOVERY §5 / AGENTS §Token Sanctum |
| Branding | `#E31E24` / `#0a0a0a` / `#F5F5F5` / Montserrat | AGENTS §Stack funcional |
| Idioma | `es-MX` | AGENTS |
| App ID | `mx.com.tags.movil` | AGENTS |
| Backend | Laravel 12 existente en `101tags.com-` | AGENTS §Compatibilidad y backend |

## Contratos

### Theme

- `src/theme/tokens.ts` exporta `brandColors` (inmutable), `brandFonts`, `fontFamily`, `fontWeights`, `radii`, `spacing`.
- `tailwind.config.js` importa `tokens.ts` y referencia cada valor (NO duplica hex).
- `src/global.css` define `--color-brand-*` en **RGB tripletas** (`227 30 36` para `#E31E24`) para que Tailwind pueda aplicar opacity utilities (`bg-brand-primary/50`).
- Componentes usan `className="bg-brand-primary text-brand-white ..."` en vez de `style={{ backgroundColor: '#E31E24' }}`.

### Environments

- `getApiBaseUrl()`:
  - Si `__DEV__ === true`:
    - `Platform.OS === 'web'` → `http://localhost:8080/api`.
    - Otro (iOS/Android) → `http://localhost:8000/api`.
  - Si `process.env.EXPO_PUBLIC_ENV === 'production'` (inyectado por EAS Build) → `https://api.101tags.com/api`.
  - Default (cualquier otro caso) → `http://localhost:8000/api` (dev nativo).
- `getApiTimeoutMs()`:
  - `__DEV__ === true` → `15_000` ms.
  - Prod → `20_000` ms.
- `Environment.apiBaseUrl` se reescribe para que sea `() => getApiBaseUrl()` o se conserva como propiedad calculada. Para mantener backward compatibility mínima, `Environment.apiBaseUrl` se mantiene como string resuelto en module-load (snapshot), y se agregan los getters como API primaria.

### Storage

Sin cambios en este milestone (sigue `expo-secure-store` built-in).

### State

Sin cambios en `auth-store` / cart-store (se materializa en F1 / F3).

## Compatibilidad

- **Web (`jest-expo` jsdom)**: `Platform.OS === 'web'`. El test mock de `expo-secure-store` ya retorna `isAvailableAsync() === false` por default; se respeta.
- **Native (iOS/Android)**: `Platform.OS` no es `'web'`; URL `http://localhost:8000/api` apunta al backend Laravel dev.
- **EAS Build production**: `process.env.EXPO_PUBLIC_ENV === 'production'` activa la URL real `https://api.101tags.com/api`. La sustitución actual del placeholder `PROD_API_BASE_URL_PLACEHOLDER` se conserva hasta que CI inyecte el secret.

## Riesgos

1. **Nativewind className en componentes nativos**: funciona en RN gracias a `react-native-css-interop`. La regla `babel-preset-expo { jsxImportSource: 'nativewind' }` ya está activa; sin embargo si una clase no se compila (typo), no hay runtime error — sólo ausencia visual. Mitigación: tests de sincronía tokens + smoke.
2. **`tailwind.config.js` importando `tokens.ts`**: el preset `nativewind/preset` corre en Node CJS; el import debe ser compatible (`require()` con `ts-node`-style). Como `tailwind.config.js` está en CJS y `tokens.ts` es ESM-via-babel, **NO** podemos hacer `require('./src/theme/tokens.ts')` directamente. Mitigación: duplicar valores literales en `tailwind.config.js` **con un comment** apuntando a `tokens.ts`, o usar `module.exports = { ..., theme: { extend: { colors: { brand: { primary: '#E31E24', ... }}}}}` con test de sincronía (`nativewind-tokens.spec.ts`) que asserta deep-equal entre `tailwindConfig.theme.extend.colors.brand` y `brandColors`. Decisión: **duplicación controlada + test de sincronía** (mismo approach que ya estaba). Es la solución estándar recomendada por Nativewind v4 docs.
3. **`getApiBaseUrl()` con `__DEV__`**: `__DEV__` es global de Metro/Expo. En Jest puede estar definido o no. Mitigación: tests usan `jest.replaceProperty` o setean el global antes del import.
4. **`Platform.OS` en Jest**: el preset `jest-expo` ya mockea `react-native`. Confirmado que `Platform.OS === 'web'` o `'ios'` según setup; tests verifican ambos paths.
5. **`Stack` con `headerStyle: { backgroundColor: brandColors.primary }`**: NO es hex literal; referencia TS al token. Aceptado por `splash-theme.spec.ts`.
6. **`tailwind.config.js` como CJS con clases kebab-case**: las keys `primary-shade` y `primary-tint` se mantienen (Tailwind las convierte en `bg-brand-primary-shade` y `bg-brand-primary-tint`).

## Plan de implementación

1. **Spec**: crear este archivo `.spec/2026-09-09-m0-5-pivot-theme-nativewind-env.md` con status DRAFT → APPROVED en TDD Green.
2. **TDD Red**:
   - `src/theme/__tests__/tokens.spec.ts`: añadir tests `fontWeights`, `radii`, `spacing` (≥3).
   - `src/constants/__tests__/env.spec.ts`: añadir 5 tests `getApiBaseUrl dev/native/web/prod`, `getApiTimeoutMs dev/prod`.
   - `src/theme/__tests__/nativewind-tokens.spec.ts`: nuevo spec, 3 tests (sync colors, sync fontFamily, no hex literales divergentes).
   - `src/app/__tests__/splash-theme.spec.ts`: nuevo spec, ≥1 test (`Stack` no contiene `#E31E24` literal; los hex literales permitidos sólo viven en `brandColors`).
3. **TDD Green**:
   - `src/theme/tokens.ts`: añadir `fontWeights`, `radii`, ampliar `spacing` con `brand-1..brand-8` (mapeo a escala 4/8/12/16/20/24/32/48). `as const`.
   - `tailwind.config.js`: extender `colors.brand` con `primary-shade/tint/white/black`, `fontFamily.brand`, `spacing.brand-1..brand-8`, `borderRadius.brand-sm/md/lg/pill`.
   - `src/global.css`: añadir `@layer base` con `:root` y `body` usando tripletas RGB.
   - `src/constants/env.ts`: añadir `getApiBaseUrl()` y `getApiTimeoutMs()`. Exportar `PROD_API_BASE_URL` constante.
   - `src/core/api/client.ts`: importar y usar los getters.
   - `src/app/_layout.tsx`: reemplazar `'#E31E24'` por `brandColors.primary`.
   - `src/app/(auth)/login.tsx`: refactor a Nativewind classes (`className="..."`). Mantener `Pressable`/`TextInput`/`Text` (Nativewind los soporta).
   - `src/app/(auth)/register.tsx`: mismo refactor.
   - `src/app/(tabs)/_layout.tsx`: confirmar uso de `brandColors.*` (sin hex).
   - `src/app/(tabs)/index.tsx`: refactor a Nativewind classes.
4. **Refactor**: ningún cambio adicional fuera de scope.
5. **Verification**:
   - `pnpm install` exit 0.
   - `pnpm typecheck` exit 0.
   - `pnpm lint` exit 0.
   - `pnpm test:ci` exit 0, ≥39 tests verdes.
   - `pnpm validate` exit 0.
   - `pnpm exec expo prebuild --no-install --clean` exit 0.

---

## Escenarios BDD

### Escenario 1 — Brand colors declarados en las 3 capas

**Dado** el workspace con `src/theme/tokens.ts`, `tailwind.config.js` y `src/global.css`
**Cuando** se inspeccionan
**Entonces** `brandColors` declara primary `#E31E24`, primary-shade `#c81a20`, primary-tint `#e6353a`, dark `#0a0a0a`, medium `#F5F5F5`, success `#2dd36f`, warning `#ffc409`, danger `#eb445a`, white `#ffffff`, black `#000000`
**Y** `tailwind.config.js theme.extend.colors.brand.*` referencia los mismos valores (test de sincronía)
**Y** `src/global.css :root` define `--color-brand-primary: 227 30 36` y los demás tokens en tripletas RGB.

### Escenario 2 — `bg-brand-primary` resuelve a `#E31E24`

**Dado** un componente RN que usa `className="bg-brand-primary"` después del processing de Nativewind
**Cuando** se aplica la regla CSS
**Entonces** `background-color` se computa a `#E31E24` (verificable vía `tailwindConfig.theme.extend.colors.brand.primary`).

### Escenario 3 — `text-brand-dark` resuelve a `#0a0a0a`

**Dado** un `<Text className="text-brand-dark" />`
**Cuando** Nativewind compila la clase
**Entonces** `color` se computa a `#0a0a0a`.

### Escenario 4 — Font family `font-brand` incluye Montserrat + fallback

**Dado** `tailwind.config.js theme.extend.fontFamily.brand`
**Entonces** la lista contiene `'Montserrat'`, `'system-ui'` y `'sans-serif'` en ese orden.

### Escenario 5 — Spacing tokens `brand-1..brand-8` definidos

**Dado** `tailwind.config.js theme.extend.spacing`
**Entonces** existen claves `brand-1` (4), `brand-2` (8), `brand-3` (12), `brand-4` (16), `brand-5` (20), `brand-6` (24), `brand-7` (32), `brand-8` (48).

### Escenario 6 — `getApiBaseUrl()` retorna URL dev según `__DEV__`

**Dado** `__DEV__ === true` y `Platform.OS === 'ios'`
**Cuando** se invoca `getApiBaseUrl()`
**Entonces** retorna `'http://localhost:8000/api'`.

**Dado** `__DEV__ === true` y `Platform.OS === 'web'`
**Cuando** se invoca `getApiBaseUrl()`
**Entonces** retorna `'http://localhost:8080/api'`.

### Escenario 7 — `getApiBaseUrl()` retorna URL prod según `EXPO_PUBLIC_ENV`

**Dado** `__DEV__ === false` y `process.env.EXPO_PUBLIC_ENV === 'production'`
**Cuando** se invoca `getApiBaseUrl()`
**Entonces** retorna `'https://api.101tags.com/api'`.

### Escenario 8 — `getApiTimeoutMs()` retorna 15000 en dev

**Dado** `__DEV__ === true`
**Cuando** se invoca `getApiTimeoutMs()`
**Entonces** retorna `15000`.

### Escenario 9 — `getApiTimeoutMs()` retorna 20000 en prod

**Dado** `__DEV__ === false`
**Cuando** se invoca `getApiTimeoutMs()`
**Entonces** retorna `20000`.

### Escenario 10 — Componentes usan Nativewind (no StyleSheet.create)

**Dado** `LoginScreen`, `RegisterScreen`, `TabsLayout` y `RootLayout`
**Cuando** se inspecciona su árbol JSX
**Entonces** contienen atributos `className="bg-brand-..."` o referencias a `brandColors` desde TS
**Y** NO contienen `StyleSheet.create({` (excepto donde la spec justifique compatibilidad).

### Escenario 11 — Sin URL productiva hardcodeada fuera de `env.ts`

**Dado** un grep de `https://api.101tags.com` en todo el repo
**Cuando** se ejecuta
**Entonces** retorna 0 matches fuera de `src/constants/env.ts` y de archivos de spec/tests que documenten el placeholder.

### Escenario 12 — `pnpm validate` exit 0 + `pnpm exec expo prebuild --no-install --clean` exit 0

**Dado** el workspace con todos los cambios aplicados
**Cuando** se ejecuta `pnpm validate`
**Entonces** exit 0 y `pnpm test:ci` reporta ≥39 tests verdes.

**Dado** el workspace validado
**Cuando** se ejecuta `pnpm exec expo prebuild --no-install --clean`
**Entonces** exit 0, regenera `ios/` + `android/` con appId `mx.com.tags.movil`.

### Escenario 13 — No regresión: 28 tests previos siguen verdes

**Dado** los 28 tests existentes en `tokens.spec.ts`, `env.spec.ts`, `secure-store.spec.ts`, `client.spec.ts`, `auth-store.spec.ts`
**Cuando** se ejecuta `pnpm test:ci`
**Entonces** los 28 anteriores pasan **Y** los nuevos (≥11) también pasan (≥39 total).

---

## Verification esperada

```bash
cd /home/user/code/codeweb/101tags-movil-m05
source ~/.nvm/nvm.sh && nvm use 24

pnpm install                                          # exit 0
pnpm typecheck                                        # exit 0
pnpm lint                                             # exit 0
pnpm test:ci                                          # exit 0, ≥39 tests verdes
pnpm validate                                         # exit 0
pnpm exec expo prebuild --no-install --clean          # exit 0
```

## Checklist

- [x] Spec DRAFT redactada
- [ ] TDD Red: nuevos tests fallan antes de implementación
- [ ] TDD Green: implementar hasta verde
- [ ] Refactor (sin cambios fuera de scope)
- [ ] Verification real (comandos anteriores)
- [ ] STATE.md actualizado con baseline M0.5-PIVOT
- [ ] Commit (sin push, sin PR)

> Sustituye la entrada `## M0.5` del `TASKS.md` original. El resto del backlog (F1-F7) es agnóstico al stack.