# Spec: Scaffold React Native + Expo de 101tags mobile

**Status**: DRAFT → APPROVED on TDD Green (M0.2-PIVOT)
**Spec ID**: 2026-09-10-rn-expo-scaffold
**Author**: agente (pivote desde Ionic+Angular+Cap — ver DISCOVERY.md §PIVOTE)
**Date**: 2026-09-10
**Approved in**: M0.2-PIVOT (reemplaza APPROVED anterior en `.spec/00-ionic-scaffold.md`)
**Related specs**:
- `.spec/2026-09-09-m0-1-auditar-contratos.md` (DONE — agnóstico al stack)
- `.spec/2026-09-09-m0-3-validar-versiones.md` (APPROVED — RN+Expo, sustituye versión Ionic)
- `.spec/2026-09-09-m0-4-workspace-rn-expo.md` (DRAFT — scaffold concreto)

## Contexto

El proyecto `101tags-movil` es **greenfield**. Tras M0.1-M0.4 se generó un scaffold completo con **Ionic 9 + Angular 22 + Capacitor 8**, mergeado a `main`. El usuario decidió en esta iteración **pivotar el stack** a **React Native 0.86 + Expo SDK 57 + Expo Router 6** por las siguientes razones (registradas en `DISCOVERY.md §PIVOTE`):

1. Reutilización futura de código React del equipo.
2. Preferencia por tooling más moderno (expo-router file-based, EAS Build cloud, OTA updates).
3. Mismas garantías de no-obsolecencia (SDK 57 es actual Sept 2026).

La auditoría del backend Laravel (`docs/audit/`) y las 38 issues de `TASKS.md` son **completamente agnósticas al stack** y se conservan tal cual.

## Problema

El scaffold actual (Angular + Ionic + Capacitor) ya no es el stack objetivo. Los siguientes puntos deben rehacerse:

- `src/` (Angular) → `app/` + `src/` (Expo Router).
- `ios/` + `android/` (Capacitor) → nativo Expo (gestionado por `expo prebuild`).
- Angular providers / interceptors → providers Zustand + TanStack Query.
- `@capacitor/preferences` para storage no-sensible → `@react-native-async-storage/async-storage`.
- `@aparajita/capacitor-secure-storage` para token → `expo-secure-store` (built-in Expo).
- `ionic.config.json` + `capacitor.config.ts` → `app.json` (Expo) + `eas.json` (EAS Build).
- `angular.json` build config → Metro config + Babel.
- ESLint angular-eslint → `eslint-config-expo` (flat config).

## Objetivo

Generar un workspace Expo SDK 57 reproducible, con TypeScript estricto, expo-router file-based, Nativewind para theme, expo-secure-store para tokens, Zustand para estado local, TanStack Query para fetching, EAS Build para builds en la nube, y un baseline de calidad verde (typecheck + lint + test + build + EAS config).

## Fuera de alcance

- Login/registro funcional (F1).
- Catálogo/productos (F2).
- Carrito/checkout/pagos (F3).
- Pedidos/chat/notificaciones (F4-F6).
- Cambios en Laravel, DB o storefront web.
- Push notifications (F5/F7).
- Compilación nativa local en este host (sin Xcode/Android SDK). EAS Build = nube.

## Decisiones locked

| Decisión | Valor | Fuente |
|---|---|---|
| Framework | React Native 0.86 | research Sept 2026 |
| Expo SDK | **57.0.0** (no SDK 53 — más actual) | research Sept 2026 + decisión "no morir antes" |
| React | 19.2.3 | bundled con Expo SDK 57 |
| TypeScript | **5.7.x** (TS 6 NO soportado por RN 0.86) | research Sept 2026 |
| Router | **expo-router 6.x** file-based | bundled |
| Secure storage | **expo-secure-store 15.x** (built-in, Keychain iOS / Keystore Android) | built-in Expo SDK 57 |
| Styling | **Nativewind v4** (Tailwind 3.4.x para RN) | estable, v5 aún pre-release |
| Estado local | **Zustand 5.x** | lightweight, RN-friendly |
| Data fetching | **TanStack Query v5** | de facto standard |
| Test runner | **Jest 29 + jest-expo preset** | Expo default, Vitest experimental con expo-router |
| ESLint | 9.x + `eslint-config-expo` flat | research Sept 2026 |
| Package manager | **pnpm 10.x** | ya en uso, único |
| Build cloud | **EAS Build** (no requiere Xcode local) | research Sept 2026 |
| App ID dev | `mx.com.tags.movil` (igual que antes; coherencia) | heredado de M0.4 D9 |
| App Name | `101tags` | heredado |
| Branding | `#E31E24` / `#0a0a0a` / `#F5F5F5` / Montserrat | AGENTS.md |
| Idioma | `es-MX` hardcoded | heredado M0.2 |
| Moneda | `MXN` | heredado |

## Arquitectura afectada

### Estructura final (target)

```
101tags-movil/
├── AGENTS.md                       (preserved, updated stack section)
├── PLAN.md                         (preserved)
├── DISCOVERY.md                    (preserved + §PIVOTE añadido)
├── TASKS.md                        (preserved)
├── ISSUES.md                       (preserved)
├── README.md                       (updated)
├── STATE.md                        (rewrite: F0 pivoted)
├── .gitignore                      (Expo defaults)
├── .nvmrc                          (Node 24 LTS, igual que antes)
├── package.json                    (NEW: stack RN+Expo 57)
├── pnpm-lock.yaml                  (NEW)
├── app.json                        (NEW: Expo config)
├── eas.json                        (NEW: EAS Build profiles)
├── babel.config.js                 (NEW: Nativewind)
├── metro.config.js                 (NEW: Metro)
├── tailwind.config.js              (NEW: Nativewind preset)
├── global.css                      (NEW: Tailwind directives)
├── tsconfig.json                   (NEW)
├── jest.config.js                  (NEW: jest-expo preset)
├── jest.setup.js                   (NEW: mocks)
├── eslint.config.js                (NEW: eslint-config-expo flat)
├── .prettierrc                     (NEW: 100/singleQuote/trailingComma)
├── .gitignore                      (Expo defaults)
├── app/                            (NEW: expo-router)
│   ├── _layout.tsx                 (root Stack)
│   ├── index.tsx                   (redirect → /home)
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx               (home tab)
│   │   └── ...
│   └── ...
├── src/
│   ├── components/                 (.gitkeep)
│   ├── core/
│   │   ├── api/                    (.gitkeep — cliente HTTP + TanStack)
│   │   ├── models/                 (.gitkeep — 7 modelos Auth en M1.1)
│   │   ├── services/               (.gitkeep — auth, storage)
│   │   ├── storage/                (.gitkeep — expo-secure-store wrapper)
│   │   └── query/                  (.gitkeep — TanStack client)
│   ├── theme/                      (.gitkeep — tokens 101tags en TS)
│   ├── stores/                     (.gitkeep — Zustand)
│   └── constants/                  (.gitkeep — env, branding)
├── assets/                         (iconos 101tags)
├── docs/audit/                     (preserved)
└── .spec/                          (preserved + rewrites)
```

### Archivos a crear (en orden)

1. `app.json` (Expo config).
2. `eas.json` (EAS Build profiles: development/preview/production).
3. `package.json` (stack RN+Expo 57 + scripts).
4. `pnpm-lock.yaml` (después de `pnpm install`).
5. `babel.config.js` (Nativewind + Reanimated).
6. `metro.config.js` (Metro + Nativewind).
7. `tailwind.config.js` (Nativewind preset + brand colors).
8. `global.css` (Tailwind directives).
9. `tsconfig.json` (extends `expo/tsconfig.base`).
10. `jest.config.js` (preset `jest-expo`).
11. `jest.setup.js` (mocks de native modules).
12. `eslint.config.js` (eslint-config-expo flat).
13. `.prettierrc` (100/singleQuote/trailingComma).
14. `.gitignore` (Expo defaults).
15. `.nvmrc` (24).
16. `app/_layout.tsx` (root Stack).
17. `app/index.tsx` (redirect).
18. `app/(tabs)/_layout.tsx` (Bottom tabs scaffold).
19. `app/(tabs)/index.tsx` (home tab scaffold).
20. `src/theme/tokens.ts` (brand colors + typography en TS).
21. `src/constants/env.ts` (apiBaseUrl, currency, locale).
22. `src/core/storage/secure-store.ts` (wrapper expo-secure-store).
23. `src/core/api/client.ts` (fetch wrapper con bearer).
24. `src/core/query/client.ts` (TanStack QueryClient).
25. `src/stores/auth-store.ts` (Zustand scaffold).
26. `src/components/.gitkeep`, etc.

### Archivos a modificar

- `AGENTS.md` — sección "Stack funcional esperado" actualizada a RN+Expo 57.
- `STATE.md` — F0 marcada como pivoted; baseline real.
- `README.md` — quick start actualizado a Expo.
- `DISCOVERY.md` — añadir §PIVOTE con justificación.
- `PLAN.md` — sección stack objetivo actualizada.

### Archivos a borrar

- `src/` (Angular): incluyendo `app/`, `core/`, `shared/`, `pages/`, `home/`, `environments/`, `theme/`, `main.ts`, `index.html`, `global.scss`, `test-setup.ts`.
- `ios/`, `android/` (Capacitor).
- `angular.json`, `ionic.config.json`, `capacitor.config.ts`.
- `eslint.config.js` (angular-eslint) → reemplazado.
- `tsconfig.app.json`, `tsconfig.spec.json` → reemplazado por `tsconfig.json` único.
- `.browserslistrc`, `.editorconfig`, `.postcssrc.json`, `proxy.conf.json` (todos no aplican en RN).
- `src/tailwind.css` (inexistente aún, sólo en plan).

## Contratos

### API (consumo)

- Dev: `http://<LAN-IP>:8000/api` (móvil no usa proxy; usa la IP del host dev porque el dispositivo físico está en LAN, no en localhost).
- Producción: `https://api.101tags.com/api` (placeholder CI).
- Auth: `Authorization: Bearer <sanctum-token>` (header en cada request autenticado).
- Sanitización: chat bloquea `@`, `mailto:`, `tel:`, `whatsapp`, `http://`, `https://` literal (mismo filtro que backend).
- Throttle respetado del lado servidor.

### Storage

**`expo-secure-store` (sensible)**:
- `auth.token` — Sanctum bearer.
- `auth.user` — JSON serializado del `CustomerUser`.

**`@react-native-async-storage/async-storage` (no sensible)**:
- `cart.items` — fallback local del carrito (si offline).
- `ui.preferences` — settings UI.

**No usar**:
- `@react-native-async-storage/async-storage` para token (no es cifrado).
- `localStorage` (no aplica en RN nativo).
- `expo-file-system` para tokens.

### Estado / Stores

```ts
// src/stores/auth-store.ts (Zustand)
interface AuthState {
  user: CustomerUser | null;
  token: string | null;
  isHydrated: boolean;
  setSession: (token: string, user: CustomerUser) => Promise<void>;
  clearSession: () => Promise<void>;
  hydrate: () => Promise<void>;   // lee de secure-store al iniciar
}

// src/stores/cart-store.ts (Zustand) — scaffold en M0.5/M3.1
interface CartState {
  items: CartLine[];
  addItem: (item: CartLine) => void;
  removeItem: (variantId: number) => void;
  clear: () => void;
}
```

### Rutas (expo-router)

- `/` → redirect → `/home`
- `/home` (tab)
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/product/[slug]`
- `/cart`
- `/checkout`
- `/account`
- `/account/orders`
- `/account/orders/[orderNumber]`
- `/account/chat/[orderNumber]`

(Sólo `/home` se crea en M0.4; resto se materializa en specs de cada fase.)

### Temas (Nativewind)

`tailwind.config.js`:

```js
module.exports = {
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#E31E24',
          dark: '#0a0a0a',
          medium: '#F5F5F5',
          success: '#2dd36f',
          warning: '#ffc409',
          danger: '#eb445a',
        },
      },
      fontFamily: {
        brand: ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

Utilidades generadas: `bg-brand-primary`, `text-brand-dark`, `font-brand`, etc.

## Escenarios BDD

### Escenario 1 — TypeScript estricto verde

**Dado** un checkout limpio del repo con Node 24 + pnpm 10
**Cuando** se ejecuta `pnpm typecheck`
**Entonces** exit 0 sin errores TS.

### Escenario 2 — Lint verde con ESLint 9 flat

**Dado** el workspace inicializado con eslint-config-expo
**Cuando** se ejecuta `pnpm lint`
**Entonces** exit 0 ("All files pass linting").

### Escenario 3 — Jest + jest-expo boots

**Dado** el `jest.config.js` con preset `jest-expo`
**Cuando** se ejecuta `pnpm test`
**Entonces** Jest arranca con jsdom-like environment y al menos 1 smoke test pasa.

### Escenario 4 — Expo prebuild genera plataformas

**Dado** `app.json` con `ios.bundleIdentifier: 'mx.com.tags.movil'`
**Cuando** se ejecuta `pnpm exec expo prebuild --no-install`
**Entonces** se generan las carpetas `ios/` y `android/` con configs nativas correctas
**Y** el bundle ID / package coinciden con `mx.com.tags.movil`.

### Escenario 5 — Expo dev server arranca

**Dado** `app.json` válido + Metro config
**Cuando** se ejecuta `pnpm start`
**Entonces** Metro arranca en `http://localhost:8081` sin errores fatales.

### Escenario 6 — Expo web bundle compila

**Dado** que el target web está habilitado en `app.json`
**Cuando** se ejecuta `pnpm exec expo export --platform web`
**Entonces** se genera `dist/` con bundle JS + CSS.

### Escenario 7 — expo-secure-store API disponible

**Dado** que `expo-secure-store` está en `package.json`
**Cuando** se importa `import * as SecureStore from 'expo-secure-store'` en un archivo TS
**Entonces** typecheck no se queja
**Y** los métodos `setItemAsync`, `getItemAsync`, `deleteItemAsync` están tipados.

### Escenario 8 — EAS Build config válida

**Dado** `eas.json` con perfiles `development`, `preview`, `production`
**Cuando** se ejecuta `pnpm exec eas config`
**Entonces** la configuración es válida.

### Escenario 9 — Branding tokens presentes en tema

**Dado** `tailwind.config.js` con `brand.primary: '#E31E24'`
**Cuando** se ejecuta `pnpm exec expo export --platform web`
**Entonces** el bundle CSS contiene `#E31E24`
**Y** las clases `bg-brand-primary` están disponibles.

### Escenario 10 — Tema 101tags accesible en runtime

**Dado** el root layout (`app/_layout.tsx`)
**Cuando** se renderiza la app en `expo start`
**Entonces** el background usa `#E31E24` o `#0a0a0a` según contexto
**Y** la tipografía por defecto es Montserrat (con fallback system-ui).

### Escenario 11 — `appId` y `appName` correctos

**Dado** `app.json`
**Cuando** se inspecciona
**Entonces** `expo.ios.bundleIdentifier === 'mx.com.tags.movil'`
**Y** `expo.android.package === 'mx.com.tags.movil'`
**Y** `expo.name === '101tags'`.

### Escenario 12 — Sin secretos reales

**Dado** el diff completo del pivote
**Cuando** se revisan `app.json`, `eas.json`, `.env*`, `*.keystore`
**Entonces** no hay tokens, URLs productivas hardcodeadas, ni credenciales reales
**Y** el placeholder `PROD_API_BASE_URL_PLACEHOLDER` aparece en `src/constants/env.ts`.

### Escenario 13 — pnpm único package manager

**Dado** un checkout limpio
**Cuando** se inspecciona el repo
**Entonces** existe sólo `pnpm-lock.yaml`
**Y** `package.json` declara `"packageManager": "pnpm@10"`.

### Escenario 14 — Estructura de carpetas F0-ready

**Dado** el scaffold generado
**Cuando** se inspecciona `app/` + `src/`
**Entonces** existen `app/(tabs)/`, `src/core/{api,models,services,storage,query}/`, `src/{components,theme,stores,constants}/`
**Y** cada subcarpeta tiene `.gitkeep` hasta que se materialice su contenido.

### Escenario 15 — Secure storage wrapper funcional

**Dado** `src/core/storage/secure-store.ts` exporta `secureSet`, `secureGet`, `secureDelete`
**Cuando** se ejecuta un smoke test que escribe `token-123` en `auth.token` y lo lee
**Entonces** el valor retornado es `token-123`
**Y** en web (jsdom) `secureGet` retorna `null` con warning (no error) por `isAvailableAsync()===false`.

## Verification esperada

```bash
# Tipos y build
pnpm typecheck              # exit 0 (tsc 5.7)
pnpm lint                   # exit 0 (eslint 9 + eslint-config-expo)
pnpm test                   # exit 0 (jest-expo)
pnpm exec expo prebuild --no-install    # exit 0, genera ios/ + android/
pnpm exec expo export --platform web    # exit 0, genera dist/

# EAS config
pnpm exec eas config        # exit 0

# Build cloud (opcional, requiere login EAS)
eas build --profile preview --platform android  # async, no se ejecuta en CI/local

# Branded tokens
grep -c '#E31E24' dist/_expo/static/css/*.css  # > 0 (si web target compila Tailwind)
```

## Riesgos / Gotchas

1. **TS 6 NO soportado por RN 0.86**: downgradar de TS 6 a TS 5.7.x.
2. **Vitest no funciona con expo-router**: usar Jest 29 + jest-expo (sacrifice DX vs Angular).
3. **EAS Build = nube**: builds locales requieren Xcode/Android SDK. No se ejecuta localmente; CI-friendly.
4. **`expo-secure-store` en web/jsdom**: `isAvailableAsync()===false` → wrapper debe manejar este caso (retornar null + warning, no throw).
5. **Nativewind v5 (Tailwind 4)**: pre-release. Usar v4 (Tailwind 3) por estabilidad.
6. **Hermes obligatorio**: SDK 57 default ON; desactivar solo si tienes razón.
7. **New Architecture (Fabric)**: SDK 57 default ON. Algunos paquetes legacy pueden no ser compatibles.
8. **Expo prebuild regenera `ios/` y `android/`**: NO commitear esos directorios al repo (igual que el approach de Capacitor). Regenerar con `prebuild` cuando sea necesario.

## Checklist

- [x] Spec DRAFT redactada
- [ ] Aprobación del usuario (M0.2-PIVOT)
- [ ] TDD Red: smoke tests que fallen antes de implementar
- [ ] `pnpm create expo-app` scaffold base
- [ ] `pnpm add expo-secure-store expo-router nativewind zustand @tanstack/react-query`
- [ ] `pnpm add -D tailwindcss@3 jest jest-expo @types/jest eslint-config-expo`
- [ ] `app.json` + `eas.json` con branding 101tags
- [ ] `babel.config.js` + `metro.config.js` con Nativewind
- [ ] `tailwind.config.js` con brand tokens
- [ ] `tsconfig.json` + `jest.config.js` + `jest.setup.js`
- [ ] `eslint.config.js` flat con eslint-config-expo
- [ ] Smoke tests (TypeScript, ESLint, Jest, expo-secure-store wrapper, theme tokens)
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm exec expo prebuild --no-install && pnpm exec expo export --platform web` exit 0
- [ ] `STATE.md` actualizado con baseline real
- [ ] Commit + push
- [ ] PR + merge

> Esta spec sustituye a `.spec/00-ionic-scaffold.md` (APPROVED Ionic+Angular+Cap) que se descarta con el pivote. El stack lockeado en M0.3 versión Ionic también se descarta y se reemplaza por el de M0.3-PIVOT (RN 0.86 + Expo 57).
