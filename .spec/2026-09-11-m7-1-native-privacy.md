# Spec: M7.1-native-privacy — Plugins nativos y privacidad (#32)

**Status**: APPROVED · **Spec ID**: 2026-09-11-m7-1-native-privacy
**Issue**: #32 · **Branch**: `feat/f7` (base `feat/f6`) · **Depends**: F1–F6

---

## Objetivo

Sincronizar plugins nativos y privacidad, con permisos **mínimos** (nada de permisos antes de necesitarlos).

## Estado actual (auditado)

`app.json` ya define: `expo-router`, `expo-secure-store`, `expo-font`, `expo-splash-screen`, `expo-build-properties` (iOS 15.1 / Android compile+target 36 / min 24), `expo-image`. Scheme `101tags`, bundle id `mx.com.tags.movil`, `typedRoutes:true`.

Deps nativas reales: `expo-clipboard`, `expo-constants`, `expo-document-picker`, `expo-font`, `expo-image`, `expo-linking`, `expo-secure-store`, `expo-splash-screen`, `expo-status-bar`, `expo-system-ui`. **No** hay cámara ni share.

## Alcance

1. **Auditoría de permisos**: no agregar `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `CAMERA`, `READ_EXTERNAL_STORAGE`, etc. salvo uso real. `expo-document-picker` usa SAF/UIDocumentPickerViewController → sin permisos de almacenamiento.
2. **Privacy manifest iOS** (`ios.privacyManifests`)**: declarar solo datos realmente recolectados (correo/nombre/teléfono para la cuenta; datos de pago gestionados por el backend; identificadores por token). Sin tracking/ads → `NSPrivacyTracking: false`.
3. **Plugins**: configurar `expo-document-picker` solo si requiere plugin en SDK 57 (si no, dejarlo como módulo). Mantener splach/status-bar/system-ui coherentes.
4. **App identity**: `name`/`slug`/`scheme`/`bundleIdentifier`/`package` definitivos = `mx.com.tags.movil`; `version` alineada a la de M7.5.
5. **Documentar** en la spec/DISCOVERY lo aplicado y lo diferido (EAS/devices en M7.2/M7.3).

## Verificación

- `app.json` es JSON válido y `pnpm typecheck`/`lint` exit 0.
- Test de config (Jest) que lee `app.json` y afirma: no hay permisos de cámara/galería/almacenamiento no usados; `privacyManifests.NSPrivacyTracking === false`; plugins nativos de módulos usados presentes.
- No se commitean secretos/keystores.

## Fuera de alcance / bloqueado

- Builds firmados y QA en dispositivo (M7.2/M7.3) requieren cuentas Apple/Google + EAS + dispositivo: **BLOQUEADO**.

## Definition of Done

- [ ] `app.json` con privacyManifests y permisos mínimos auditados.
- [ ] Test de config verde. `pnpm typecheck`/`lint` exit 0.
- [ ] Sin secretos. Sin deps nuevas salvo justificación.
