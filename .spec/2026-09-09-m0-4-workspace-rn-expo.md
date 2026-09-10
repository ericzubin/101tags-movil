# Spec: Generar workspace React Native + Expo (M0.4-PIVOT)

**Status**: DRAFT → DONE on verification
**Spec ID**: 2026-09-10-m0-4-workspace-rn-expo
**Author**: agente (pivote — sustituye `.spec/2026-09-09-m0-4-workspace-ionic.md` versión Ionic)
**Date**: 2026-09-10
**Approved in**: M0.4-PIVOT (Issue #4 re-execute)
**Related specs**:
- `.spec/2026-09-09-m0-1-auditar-contratos.md` (DONE — agnóstico)
- `.spec/2026-09-09-m0-3-validar-versiones.md` (APPROVED — RN+Expo 57 stack)
- `.spec/00-rn-expo-scaffold.md` (APPROVED — fuente del scaffold)

> Esta spec sustituye a `.spec/2026-09-09-m0-4-workspace-ionic.md` (DONE — scaffold Ionic+Cap) que se descarta con el pivote. El trabajo previo queda en historial de git.

## Contexto

Tras aprobar el pivote de stack (M0.2-PIVOT, M0.3-PIVOT), F0 necesita regenerar el workspace. El scaffold actual (Ionic 9 + Angular 22 + Capacitor 8) se borra con `git rm` y se reemplaza por **React Native 0.86 + Expo SDK 57 + Expo Router 6**.

## Problema

`/home/user/code/codeweb/101tags-movil-rn/` (worktree de la rama `chore/rn-pivot-f0`) contiene actualmente:
- Docs preservados: `AGENTS.md`, `PLAN.md`, `DISCOVERY.md`, `TASKS.md`, `ISSUES.md`, `README.md`, `STATE.md`.
- `.agent/WORKFLOW.md`, `.spec/`, `docs/audit/` preservados.
- `package.json`, `pnpm-lock.yaml`, `tsconfig*.json`, `angular.json`, `ionic.config.json`, `capacitor.config.ts`, `eslint.config.js`, `.browserslistrc`, `.editorconfig`, `.nvmrc`, `.prettierrc`, `.postcssrc.json`, `.vscode/`, `src/`, `ios/`, `android/`: **borrados con `git rm -r`** en este pivote.

Necesitamos inicializar el scaffold Expo encima de la base preservada.

## Objetivo

Generar un workspace Expo SDK 57 real, verificable, con:

- `app.json` (Expo config).
- `eas.json` (EAS Build profiles).
- `package.json` (stack locked de M0.3-PIVOT).
- `app/` (expo-router).
- `src/core/{api,models,services,storage,query}/` con `.gitkeep`.
- `src/{components,theme,stores,constants}/` con `.gitkeep`.
- `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css`.
- `tsconfig.json`, `jest.config.js`, `jest.setup.js`, `eslint.config.js`.
- `assets/` (iconos, splash 101tags).
- Theme 101tags en `src/theme/tokens.ts` con `#E31E24` / `#0a0a0a` / `#F5F5F5` / Montserrat.
- Wrapper de `expo-secure-store` en `src/core/storage/secure-store.ts`.
- Cliente HTTP en `src/core/api/client.ts` con bearer.
- TanStack QueryClient en `src/core/query/client.ts`.
- Auth store en `src/stores/auth-store.ts` (Zustand scaffold).
- Home screen scaffold en `app/(tabs)/index.tsx`.

Y verificación real (no asumida):

- `pnpm install` exit 0.
- `pnpm typecheck` exit 0.
- `pnpm lint` exit 0.
- `pnpm test` exit 0 (≥1 smoke test verde).
- `pnpm exec expo prebuild --no-install` exit 0.
- `pnpm exec eas config` exit 0.
- `pnpm exec expo export --platform web` exit 0.

## Fuera de alcance

- Login funcional (F1 / M1.1-M1.5).
- Catálogo/productos (F2).
- Carrito/checkout/pagos (F3).
- Pedidos/chat/notificaciones (F4-F6).
- Compilación nativa local (sin Xcode/Android SDK). EAS Build = nube.
- Push notifications.
- OTA updates (EAS Update) — se materializa en F7.

## Decisiones locked (heredadas de M0.3-PIVOT)

| Decisión | Valor |
|---|---|
| RN | 0.86 |
| Expo SDK | 57 |
| React | 19.2.3 |
| TypeScript | 5.7.x |
| Router | expo-router 6 (file-based) |
| Secure storage | expo-secure-store (built-in) |
| Styling | Nativewind v4 + Tailwind 3.4 |
| Estado | Zustand 5 |
| Data | TanStack Query 5 |
| Tests | Jest 29 + jest-expo |
| Lint | ESLint 9 + eslint-config-expo flat |
| App ID | `mx.com.tags.movil` (ios + android) |
| App Name | `101tags` |
| Branding | `#E31E24` / `#0a0a0a` / `#F5F5F5` / Montserrat |

## Plan de implementación

### 1. Init del proyecto Expo

```bash
cd /tmp
pnpm create expo-app@latest 101tags-expo --template default
# or
pnpx create-expo-app@latest 101tags-expo --template default
```

Esto genera scaffold base con expo-router preconfigurado.

### 2. Rsync al repo

```bash
rsync -a /tmp/101tags-expo/ /home/user/code/codeweb/101tags-movil-rn/
# Excluir node_modules (lo regeneramos con pnpm install)
# Preservar archivos del repo que ya existen (AGENTS.md, PLAN.md, etc.)
```

### 3. Instalar dependencias locked

```bash
cd /home/user/code/codeweb/101tags-movil-rn
nvm use 24
pnpm install
pnpm add expo-secure-store expo-router expo-status-bar expo-splash-screen expo-haptics expo-keyboard expo-constants expo-linking expo-router
pnpm add nativewind@^4 react-native-reanimated react-native-safe-area-context
pnpm add zustand @tanstack/react-query
pnpm add @react-native-async-storage/async-storage
pnpm add -D tailwindcss@^3 @nativewind/tailwindcss prettier-plugin-tailwindcss
pnpm add -D jest jest-expo @testing-library/react-native @types/jest
pnpm add -D eslint-config-expo eslint@^9 typescript@~5.7 typescript-eslint
pnpm add -D @types/react @types/react-native
```

### 4. Configurar

- `app.json` con branding 101tags, plugins (expo-secure-store, expo-router, splash, status-bar).
- `eas.json` con profiles development/preview/production.
- `babel.config.js` con `nativewind/babel` y `react-native-reanimated/plugin`.
- `metro.config.js` con `withNativeWind`.
- `tailwind.config.js` con brand colors.
- `global.css` con `@tailwind base/components/utilities`.
- `tsconfig.json` con extends `expo/tsconfig.base` + strict.
- `jest.config.js` con preset `jest-expo`.
- `jest.setup.js` con mocks de native modules.
- `eslint.config.js` flat con `eslint-config-expo`.
- `.prettierrc` con 100/singleQuote/trailingComma.
- `.gitignore` Expo defaults + `node_modules/`, `ios/Pods/`, `.expo/`, `dist/`.

### 5. Theme + branding

- `src/theme/tokens.ts` con brand colors exportados como constantes TS.
- `app/(tabs)/_layout.tsx` con `<Tabs>` y theme via Nativewind classes.
- `app/(tabs)/index.tsx` (home) con brand colors de fondo.

### 6. Storage + API + State (scaffold)

- `src/core/storage/secure-store.ts` — wrapper `expo-secure-store` con fallback web.
- `src/core/api/client.ts` — fetch wrapper con bearer token + 401 redirect.
- `src/core/query/client.ts` — TanStack QueryClient + default options.
- `src/stores/auth-store.ts` — Zustand store con `user`, `token`, `setSession`, `clearSession`, `hydrate`.
- `src/constants/env.ts` — `apiBaseUrl`, `currency`, `defaultLocale`, `appName`.

### 7. Smoke tests

- `src/core/storage/secure-store.spec.ts` — set/get/delete + web fallback.
- `src/core/api/client.spec.ts` — bearer injection + 401 handling.
- `src/theme/tokens.spec.ts` — brand color constants correctas.
- `src/constants/env.spec.ts` — env values coherentes.
- `src/stores/auth-store.spec.ts` — setSession / clearSession state transitions.

### 8. Verificación

```bash
pnpm install                              # exit 0
pnpm typecheck                            # exit 0
pnpm lint                                 # exit 0
pnpm test                                 # exit 0, todos los smoke verdes
pnpm exec expo prebuild --no-install      # exit 0, ios/ + android/ generados
pnpm exec eas config                      # exit 0
pnpm exec expo export --platform web      # exit 0, dist/ generado
```

### 9. Documentación + STATE

- `STATE.md` actualizado: F0 / M0.4-PIVOT DONE con baseline real.
- `DISCOVERY.md` actualizado: §PIVOTE con justificación + decisiones.
- `AGENTS.md` actualizado: §Stack funcional esperado.
- `README.md` actualizado: quick start Expo.
- `PLAN.md` actualizado: stack objetivo.

### 10. Commit + PR + merge

```bash
git add -A
git commit -m "feat(F0): pivote de stack Ionic+Angular+Cap → RN+Expo SDK 57

M0.4-PIVOT ejecuta el scaffold real con React Native 0.86 + Expo SDK 57 +
Expo Router 6, sustituyendo el scaffold Ionic+Angular+Cap generado por el
M0.4 original (que se conserva en historial de git).

Stack locked en M0.3-PIVOT:
- RN 0.86, Expo SDK 57, React 19.2.3, TypeScript 5.7.x
- expo-router 6 (file-based)
- expo-secure-store 15 (Keychain iOS / Keystore Android)
- Nativewind 4 + Tailwind 3.4 (estilo)
- Zustand 5 (estado local)
- TanStack Query 5 (data fetching)
- Jest 29 + jest-expo (tests)
- ESLint 9 + eslint-config-expo flat

Branding 101tags:
- App ID mx.com.tags.movil (ios + android)
- #E31E24 / #0a0a0a / #F5F5F5 / Montserrat

Verificación real (no asumida):
- pnpm install exit 0
- pnpm typecheck exit 0
- pnpm lint exit 0
- pnpm test exit 0 (N/N smoke tests verdes)
- pnpm exec expo prebuild --no-install exit 0
- pnpm exec eas config exit 0
- pnpm exec expo export --platform web exit 0

Refs:
- .spec/00-rn-expo-scaffold.md (APPROVED)
- .spec/2026-09-09-m0-3-validar-versiones.md (APPROVED — versión RN+Expo)
- .spec/2026-09-09-m0-4-workspace-rn-expo.md (esta spec)

Sustituye:
- .spec/00-ionic-scaffold.md (descartado, en git history)
- .spec/2026-09-09-m0-4-workspace-ionic.md (descartado, en git history)
- scaffold de M0.4-Ionic (borrado con git rm, en git history)"

git push origin chore/rn-pivot-f0
gh pr create --base main --head chore/rn-pivot-f0 --title "feat(F0): pivote RN+Expo SDK 57 + scaffold (#4-PIVOT)" --body "..."
gh pr merge --squash --delete-branch
```

## Escenarios BDD (heredados + específicos M0.4-PIVOT)

Ver `.spec/00-rn-expo-scaffold.md` §Escenarios BDD para los 15 escenarios completos.

### Escenario extra 16 — Migración limpia desde Ionic

**Dado** que el repo contenía el scaffold Ionic+Angular+Cap
**Cuando** se aplica este pivote
**Entonces** el `git diff` contra el commit anterior a M0.4 original muestra `delete` para `src/`, `ios/`, `android/`, configs de Capacitor/Ionic/Angular
**Y** el `git log` preserva los commits de M0.1-M0.4-Ionic como historial
**Y** no hay pérdida de specs M0.1 (auditoría agnóstica al stack).

## Riesgos / Gotchas

1. **`pnpm create expo-app`** puede generar archivos extra que necesitamos limpiar (icons por defecto, splash screens por defecto de Expo).
2. **`rsync` puede pisar archivos del repo**: usar `--ignore-existing` para `AGENTS.md`, `PLAN.md`, etc., o copiar selectivamente.
3. **Nativewind v4 setup**: requiere cambios en `babel.config.js` (orden importa) + `metro.config.js` (wrap con `withNativeWind`). Si el orden es incorrecto, los utilities no se compilan.
4. **Jest con expo-router**: requiere `jest.setup.js` con mocks de `expo-router` y `expo-secure-store`.
5. **ESLint 9 flat config + `eslint-config-expo`**: la versión de `eslint-config-expo` debe ser compatible con flat. Verificar en SDK 57.
6. **EAS Build config inicial**: requiere `eas.json` con `cli.version`. Si no, `eas config` falla.
7. **`expo prebuild --no-install`** genera `ios/` y `android/` pero NO instala Pods ni Gradle deps. La compilación real es via EAS Build cloud.
8. **Permisos de macOS para EAS Build local**: irrelevante porque vamos a cloud.
9. **Privacy Manifests**: Expo genera automático. Verificar en `app.json`.
10. **`expo-secure-store` en web/jsdom**: `isAvailableAsync()===false`. El wrapper debe manejar este caso.

## Checklist

- [x] Spec DRAFT redactada
- [ ] Aprobación usuario
- [ ] `pnpm create expo-app` ejecutado en `/tmp/101tags-expo/`
- [ ] Rsync selectivo al repo preservando docs
- [ ] `pnpm install` exit 0
- [ ] Stack locked instalado
- [ ] `app.json` + `eas.json` configurados
- [ ] Nativewind + babel + metro configurados
- [ ] Tailwind config con brand 101tags
- [ ] `tsconfig.json` con strict + extends expo/tsconfig.base
- [ ] `jest.config.js` + `jest.setup.js` con jest-expo preset
- [ ] `eslint.config.js` flat con eslint-config-expo
- [ ] Smoke tests escritos (TDD Red → Green)
- [ ] Theme tokens + branding aplicados
- [ ] Storage + API + Query + Store scaffolds
- [ ] Home screen funcional
- [ ] `pnpm exec expo prebuild --no-install` exit 0
- [ ] `pnpm exec eas config` exit 0
- [ ] `pnpm exec expo export --platform web` exit 0
- [ ] `STATE.md` baseline real
- [ ] `DISCOVERY.md` §PIVOTE añadido
- [ ] `AGENTS.md` stack actualizado
- [ ] `README.md` quick start actualizado
- [ ] Commit + push + PR + merge

> Sustituye `.spec/2026-09-09-m0-4-workspace-ionic.md` (DONE — scaffold Ionic). El scaffold anterior queda en git history.
