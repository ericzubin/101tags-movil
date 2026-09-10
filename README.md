# 101tags — Cliente móvil

Cliente móvil de 101tags para compradores (iOS + Android).

**Stack**: React Native 0.86 + Expo SDK 57 + Expo Router 6 + Nativewind 4 + Zustand 5 + TanStack Query 5 + Jest 29 + ESLint 9 + pnpm 10 + Node 24 LTS.

> Pivote desde Ionic+Angular+Cap (M0.1-M0.4-Ionic, mergeados en `main`) a React Native+Expo en M0.4-PIVOT. Justificación en [`DISCOVERY.md §PIVOTE`](./DISCOVERY.md) y [`.spec/00-rn-expo-scaffold.md`](./.spec/00-rn-expo-scaffold.md).

## Quick start

```bash
# Requisitos
nvm use 24           # Node 24 LTS
pnpm install         # instalar deps

# Desarrollo
pnpm start           # Expo dev server (Metro)
pnpm android         # abrir en Android (requiere Android SDK)
pnpm ios             # abrir en iOS (requiere macOS + Xcode)
pnpm web             # abrir en web

# Quality
pnpm typecheck       # tsc --noEmit
pnpm lint            # expo lint (ESLint 9 flat)
pnpm test            # Jest con jest-expo preset
pnpm validate        # typecheck + lint + test (CI-ready)

# Build cloud (EAS)
pnpm eas:config                    # valida eas.json
eas login                          # una vez
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

## Estructura

```
101tags-movil/
├── app.json                 (Expo config: ios bundleId, android package, plugins)
├── eas.json                 (EAS Build profiles: dev / preview / production)
├── babel.config.js          (Nativewind + Reanimated)
├── metro.config.js          (Metro + Nativewind)
├── tailwind.config.js       (Nativewind v4 + brand 101tags)
├── tsconfig.json            (extends expo/tsconfig.base + strict + paths)
├── jest.config.js           (jest-expo preset + setupFiles)
├── jest.setup.js            (mocks: expo-secure-store, expo-router, etc.)
├── eslint.config.js         (FlatCompat sobre eslint-config-expo)
├── global.css               (Tailwind directives)
├── src/
│   ├── app/                 ← expo-router file-based routes
│   │   ├── _layout.tsx      (root Stack + Providers + hydration)
│   │   ├── index.tsx        (redirect según auth)
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx    (home screen scaffold)
│   │   └── (auth)/
│   │       ├── _layout.tsx
│   │       ├── login.tsx
│   │       └── register.tsx
│   ├── core/
│   │   ├── api/             (HTTP client wrapper + tests)
│   │   ├── models/          (TS interfaces — Auth en M1.1; resto en F2+)
│   │   ├── query/           (TanStack QueryClient singleton)
│   │   ├── services/        (services de negocio — vacíos hasta F1)
│   │   └── storage/         (expo-secure-store wrapper + tests)
│   ├── stores/              (Zustand: auth-store + tests)
│   ├── theme/               (tokens 101tags + tests)
│   ├── constants/           (env config + tests)
│   └── components/          (UI shared — vacío)
├── assets/
│   └── images/              (icon, splash, favicon, android adaptive icons)
└── docs/audit/              (auditoría backend — agnóstico al stack)
```

## Seguridad

- Token Sanctum: **`expo-secure-store`** (Keychain iOS / Android Keystore AES-GCM). NUNCA AsyncStorage ni localStorage.
- Logout: `secureClearAuth()` borra token + user en storage cifrado.
- NUNCA loggear bearer tokens, passwords, ni secretos OpenPay.
- `.env*` y secrets en `.gitignore`.

Ver `AGENTS.md §Seguridad` y `AGENTS.md §Token Sanctum`.

## Backend

Laravel 12 en `/home/user/code/codeweb/101tags.com-/`. NO modificar. Sanctum bearer tokens contra `/api/*`. Auditoría completa en `docs/audit/`.

## Notion / Issues

- 38 issues técnicas en `ISSUES.md` + `TASKS.md`.
- Notion IDs `[101M]` espejan `TASKS.md`.
- Source of truth es el repo.

## Documentación

- `AGENTS.md`: reglas + scope + seguridad.
- `PLAN.md`: alcance + arquitectura + roadmap.
- `DISCOVERY.md`: memoria técnica + decisiones + §PIVOTE.
- `TASKS.md`: backlog + dependencias + estimación.
- `ISSUES.md`: mapping a GitHub Issues.
- `STATE.md`: estado real + handover.
- `.agent/WORKFLOW.md`: metodología SDD/BDD/TDD.
- `.spec/`: contratos ejecutables por tarea.
- `docs/audit/`: auditoría backend.
