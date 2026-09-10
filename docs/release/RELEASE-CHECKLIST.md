# Release Checklist — 101tags mobile

Documento de release para iOS/Android. Todo lo marcado **BLOQUEADO** depende de cuentas,
credenciales o dispositivos externos y **no** se considera trabajo controlable por código
(ver `TASKS.md` M7.5 y specs `2026-09-11-m7-2-android.md`, `2026-09-11-m7-3-ios.md`,
`2026-09-11-m7-5-release-checklist.md`).

---

## 1. Identidad y versionado

| Campo                 | Valor               | Fuente                                   |
| --------------------- | ------------------- | ---------------------------------------- |
| Nombre / slug         | `101tags`           | `app.json` → `expo.name` / `expo.slug`   |
| iOS bundleIdentifier  | `mx.com.tags.movil` | `app.json` → `expo.ios.bundleIdentifier` |
| Android package       | `mx.com.tags.movil` | `app.json` → `expo.android.package`      |
| Deep link scheme      | `101tags`           | `app.json` → `expo.scheme`               |
| `version` (semver)    | `1.0.0`             | `app.json` → `expo.version`              |
| Android `versionCode` | `1` (entero)        | `app.json` → `expo.android.versionCode`  |
| iOS `buildNumber`     | `"1"` (string)      | `app.json` → `expo.ios.buildNumber`      |

### Política de bump

- `version` = `MAJOR.MINOR.PATCH` (semver):
  - `MAJOR`: cambios incompatibles / rediseño de flujo.
  - `MINOR`: funcionalidad nueva retrocompatible.
  - `PATCH`: correcciones.
- `android.versionCode` y `ios.buildNumber`: enteros positivos **estrictamente crecientes** en
  cada envío a tienda; **nunca** se reutilizan ni decrementan. Se mantienen sincronizados (mismo
  número) para simplificar.
- `eas.json` → `cli.appVersionSource: "remote"`: en el primer build EAS inicializa el contador
  remoto a partir de `app.json` y luego lo incrementa del lado servidor. Los valores de `app.json`
  son la **base** del repo.
- Tag de release en git (`v1.0.0`) es manual y requiere autorización explícita (§Git de `AGENTS.md`).

---

## 2. Deep links y reset de contraseña

- El scheme `101tags` está configurado en `app.json`. Expo genera automáticamente el
  `intent-filter` (Android) y el URL type (iOS); Expo Router mapea `101tags:///<ruta>` a las rutas
  de archivo. **No** se requiere `android.intentFilters` adicional para el scheme base.
- **Hallazgo (Discovery):** el correo de reset de contraseña genera hoy una URL **web**, no un deep
  link nativo:
  - `PasswordResetService::buildResetUrl` (Laravel) → `{STOREFRONT_URL}/restablecer-contrasena?token=<token>&email=<email>`.
  - No existe link `101tags://reset...` en el contrato del backend.
  - No existe ruta nativa `reset-password` en `src/app/`; la pantalla
    `src/app/(auth)/forgot-password.tsx` solo llama `POST /auth/customer/forgot-password` y muestra
    un mensaje genérico.
- Si en el futuro se agrega pantalla nativa de reset, el deep link que Expo Router esperaría es:

  ```
  101tags:///reset-password?token=<token>&email=<email>
  ```

  (ruta de archivo `src/app/reset-password.tsx`). **Documentado, no implementado**: agregar la ruta
  y/o cambiar el correo del backend es otra tarea y requiere aprobación del usuario.

- `expo-linking` está incluido como dependencia pero hoy no lo usa ninguna pantalla.
- **BLOQUEADO:** validar el reset/deep link en un build firmado instalado requiere dispositivo/simulador.

---

## 3. Inventario de assets, permisos y UX legal

### Assets

| Asset                          | Ruta                                                         | Uso                                                        |
| ------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------- |
| Icono global/iOS               | `assets/images/icon.png`                                     | `expo.icon`                                                |
| Splash                         | `assets/images/splash-icon.png`                              | `expo.splash` + plugin `expo-splash-screen` (bg `#E31E24`) |
| Android adaptive foreground    | `assets/images/android-icon-foreground.png`                  | `expo.android.adaptiveIcon`                                |
| Android adaptive background    | `assets/images/android-icon-background.png`                  | `expo.android.adaptiveIcon`                                |
| Android adaptive monochrome    | `assets/images/android-icon-monochrome.png`                  | `expo.android.adaptiveIcon`                                |
| Web favicon                    | `assets/images/favicon.png`                                  | `expo.web.favicon`                                         |
| Fuente Montserrat Regular/Bold | `assets/fonts/Montserrat-Regular.ttf`, `Montserrat-Bold.ttf` | plugin `expo-font`                                         |

### Permisos y plataforma

- Permisos mínimos (M7.1): sin cámara, fotos, micrófono ni storage.
- iOS `privacyManifests`: sin tracking; declara `Name`, `Email`, `PhoneNumber` con propósito
  `AppFunctionality`.
- `android.compileSdkVersion`/`targetSdkVersion` = 36, `minSdkVersion` = 24.
- iOS `deploymentTarget` = 15.1.
- `ITSAppUsesNonExemptEncryption` = `false`.

### Política de privacidad (dependencia de negocio)

- Pantalla: `src/app/legal/privacy.tsx` (`testID="legal-privacy"`) → `LegalDocumentScreen`.
- La pantalla consume `/footer` (`contentService.getFooter()`) y muestra los links legales reales,
  pero el **texto completo** de Términos/Privacidad **no** está expuesto por el backend:
  se muestra `LEGAL_PENDING_NOTICE` (“contenido pendiente, dependencia de negocio”).
- **Dependencia de negocio:** para la revisión de tiendas se requiere una **URL pública de política
  de privacidad**; hoy está pendiente de que negocio provea el texto/URL. No inventar copy legal.

---

## 4. Variables de entorno (sin secretos)

| Variable                     | Dev                         | Preview/Production            | Notas                   |
| ---------------------------- | --------------------------- | ----------------------------- | ----------------------- |
| `EXPO_PUBLIC_API_BASE_URL`   | `http://localhost:8000/api` | `https://api.101tags.com/api` | Debe terminar en `/api` |
| `EXPO_PUBLIC_ENV`            | `development`               | `preview` / `production`      | Etiqueta de entorno     |
| `EXPO_PUBLIC_API_TIMEOUT_MS` | `15000`                     | `30000`                       | Timeout HTTP (ms)       |

- Se declaran en tres lugares coherentes: `.env.example` (plantilla), `app.json` → `extra`, y
  `eas.json` → `build.<perfil>.env`.
- Las `EXPO_PUBLIC_*` se **inyectan al bundle** y son públicas por diseño; **nunca** poner tokens,
  secrets ni credenciales en ellas.
- No commitear `.env` real. El único archivo de entorno trackeado es `.env.example` (plantilla sin
  secretos). Cualquier secret de build debe vivir en EAS (`eas secret`), no en el repo.

---

## 5. Pasos de build y subida a tiendas

> Requiere cuenta Expo/EAS + Apple Developer + Google Play Console (ver §7).

### EAS Build

1. `eas login` (cuenta Expo/EAS del usuario).
2. `eas init` para vincular el proyecto (genera `extra.eas.projectId`; revisar antes de commitear).
3. Desarrollo (dev client): `eas build -p android --profile development` / `-p ios`.
4. Preview (APK interno): `eas build -p android --profile preview`.
5. Producción: `eas build -p android --profile production` (AAB) y `eas build -p ios --profile production`.
6. Credenciales: `eas credentials` — keystore/certificados gestionados por EAS, **nunca** en git.
7. Submit: `eas submit -p android --profile production` y `eas submit -p ios --profile production`.

### App Store Connect

- Crear app con bundle id `mx.com.tags.movil`.
- Metadata: nombre, descripción, screenshots, categoría, age rating.
- Privacy policy URL (dependencia de negocio, §3) y App Privacy.
- `ITSAppUsesNonExemptEncryption = false` ya declarado.
- Subir a TestFlight → revisión → release.

### Google Play Console

- Crear app con package `mx.com.tags.movil`.
- Subir AAB de producción.
- Store listing, content rating, Data safety form y privacy policy URL.
- Track interno → cerrado → producción.

---

## 6. Gate previo a release (controlado por repo)

- `pnpm typecheck` y `pnpm lint` exit 0.
- `pnpm test src/__tests__/release-config.spec.ts` (auditoría de `eas.json`, versiones/IDs,
  `.gitignore` y `git ls-files` sin credenciales).
- `git ls-files` sin `*.keystore`, `*.jks`, `*.p12`, `*.mobileprovision`, `*.cer`, `*.p8`,
  `credentials.json` ni `.env` real.
- Revisar diff de `app.json`/`eas.json` antes de tag/release.

---

## 7. BLOCKED / BLOQUEADO (recursos externos — NO marcado DONE)

- [ ] **Build firmado Android (AAB) reproducible** → requiere cuenta Expo/EAS + keystore del usuario.
- [ ] **Build/archive iOS firmado** → requiere cuenta Apple Developer + certificados/provisioning.
- [ ] **`eas init` / projectId vinculado** → requiere cuenta Expo/EAS (no se commitea ID de cuenta).
- [ ] **Deep link/reset verificado en build instalado** → requiere dispositivo/simulador firmado.
- [ ] **QA de flujos críticos en dispositivo/emulador** → requiere dispositivo.
- [ ] **Envío a App Store Connect y revisión de Apple** → cuenta Apple; la revisión externa no es
      controlable por código.
- [ ] **Envío a Google Play y revisión** → cuenta Google Play Console; revisión externa.
- [ ] **Notificaciones push** → fuera del MVP (solo notificaciones in-app).

Estos criterios **no** se marcan DONE hasta que el usuario aporte cuentas, credenciales y dispositivos.
