# Spec: M7.4-qa-regression — Regresión, red, accesibilidad y estados límite (#35)

**Status**: PARTIAL · **Spec ID**: 2026-09-11-m7-4-qa-regression
**Issue**: #35 · **Branch**: `feat/f7` · **Depends**: M7.2, M7.3

---

## Objetivo

Verificar el flujo crítico y endurecer estados límite **a nivel automatizado (Jest)** y auditoría estática. La validación en dispositivo (E2E nativo) queda **BLOQUEADA**.

## Alcance automatizable

1. **Flujo login → catálogo → carrito → checkout → pedido**: test de integración de stores/servicios (sin UI nativa) que recorre los contratos con `httpClient` mockeado: auth → catalog → cart sync → request-orders → payment-instructions. Verifica que cada paso usa el dato del anterior.
2. **Guest checkout / OXXO-SPEI / comprobante**: cubrir las ramas cuando config lo habilita (ya hay tests por unidad; agregar un test de flujo que los encadene).
3. **Errores 401/403/404/422/429/5xx y offline**: test que afirma que `httpClient`/stores mapean cada status a un estado definido (mensaje + recuperación), sin crash ni éxito falso.
4. **Timers/listeners huérfanos**: test del polling de chat (ya existe) + auditoría de que `useFocusEffect`/intervals se cancelan.
5. **Smoke de accesibilidad (estático)**: test que recorre pantallas críticas y afirma `accessibilityLabel`/`accessibilityRole`/`testID` en controles clave (botones de carrito, checkout, pago, logout) y que los targets táctiles clave tienen `minHeight` razonable.

## BLOQUEADO

- E2E en dispositivo/emulador real, offline real, y verificación táctil/contraste en pantalla → requiere dispositivo (M7.2/M7.3).

## Verificación

- Nuevos tests de flujo/errores/a11y verdes; `pnpm typecheck`/`lint` exit 0.

## Definition of Done

- [ ] Tests de flujo + errores + a11y (automatizados) verdes.
- [ ] Limitaciones de dispositivo documentadas como BLOQUEADO.
