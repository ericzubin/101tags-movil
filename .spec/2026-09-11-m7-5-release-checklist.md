# Spec: M7.5-release-checklist — Release checklist y paquete para tiendas (#36)

**Status**: PARTIAL · **Spec ID**: 2026-09-11-m7-5-release-checklist
**Issue**: #36 · **Branch**: `feat/f7` · **Depends**: M7.4

---

## Objetivo

Dejar el paquete listo para tiendas: versionado, IDs, inventario de assets/metadata y documentación de pasos, **sin secretos** y sin contar la revisión externa como trabajo controlable por código.

## Alcance (code/docs)

1. **Versiones**: `app.json` `version` (semver) y `android.versionCode` / `ios.buildNumber` definidos y coherentes (inicial `1.0.0` / code 1 / build 1). Documentar la política de bump.
2. **IDs**: `bundleIdentifier`/`package` = `mx.com.tags.movil` (validado en M7.1).
3. **Inventario**: listar iconos/splash/adaptive icons existentes, política de privacidad (pantalla `legal/privacy` + dependencia de texto legal), y metadata técnica (permisos, deeplink `101tags://`).
4. **Release docs** (`docs/release/RELEASE-CHECKLIST.md`): pasos App Store Connect / Google Play / EAS, variables de entorno (sin secretos), criterios que requieren cuentas (marcados BLOQUEADOS).
5. **Artefactos sin secretos**: `eas.json` con perfiles; verificar que ningún secreto/keystore/cert está trackeado.

## BLOQUEADO

- Subida a tiendas, aprobación/revisión externa, generación de artefactos firmados reales → cuentas/conexión del usuario.

## Verificación

- `app.json`/`docs` coherentes; `pnpm typecheck`/`lint` exit 0; test/auditoría de que no hay secretos trackeados (`git ls-files` sin `*.keystore|*.jks|*.p12|*.mobileprovision|credentials.json|.env`).

## Definition of Done

- [ ] Versiones/IDs/bundle definitivos.
- [ ] `docs/release/RELEASE-CHECKLIST.md` con pasos y bloqueos.
- [ ] Sin secretos en repo.
