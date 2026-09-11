# Spec: M2-review-P1-fixes — Correcciones de revisión externa sobre `developer`

**Status**: APPROVED (auto-aprobado)
**Spec ID**: 2026-09-11-m2-review-p1-fixes
**Author**: Agente principal (Architect)
**Date**: 2026-09-11
**Issue(s)**: reseña externa sobre PRs de F2 (no hay issue propio; se documenta aquí)
**Branch**: `fix/m2-review-p1` (base `developer` a48b268)
**Related specs**: `.spec/2026-09-11-m2-3-list.md`, `.spec/2026-09-11-m2-4-detail.md`, `.spec/2026-09-11-m2-5-ux.md`

---

## Contexto

La revisión externa de `developer` levantó 4 hallazgos P1:

1. Contrato de paginación.
2. Precio de variante al seleccionar.
3. Selector de variantes que puede quedar bloqueado.
4. `expo-image` fuera de la línea del SDK 57.

## Estado verificado

1. `Paginated<T>` **ya fue corregido a flat camelCase** en M2.3 (`src/core/models/common.model.ts`). No quedan `PaginatedMeta`/`current_page` en `src`. El comentario apunta a código pre-M2.3. **Falta** el test del `httpClient` con un paginator realista.
2. `src/app/product/[slug].tsx:108` usa `formatMXN(variant.priceOverride ?? product.minPrice)`. El backend (`CatalogFormatter.php:21`) envía `price = price_override ?? base_price` (precio efectivo de la variante), por lo que el fallback a `minPrice` puede mostrar el precio de otra variante. `priceOverride` solo se usa en esa línea.
3. `VariantSelector` deshabilita de forma cruzada (`isSelectable(size, selectedColor)`); con combinaciones disjuntas (S/Azul, M/Rojo) no hay ruta para cambiar.
4. `package.json` fija `expo-image ~2.0.7`; `node_modules/expo/bundledNativeModules.json` espera `~57.0.4`.

## Objetivo

Cerrar los 4 hallazgos con tests de regresión y evidencia, sin cambiar comportamiento fuera de alcance.

## Fuera de alcance

- Rediseño del selector más allá del fix (no se cambia la semántica de deshabilitado; ver Fix 3).
- Cambios de backend.
- Validación de build nativo EAS (F7).

## Fix 1 — Test de contrato del paginator en `httpClient`

No se modifica el modelo. Se añade a `src/core/api/__tests__/client.spec.ts` un test con una respuesta **realista** del `LengthAwarePaginator` de Laravel (snake_case, plano) que verifica que `httpClient.get()` la devuelve en camelCase plano.

```json
{
  "current_page": 2,
  "data": [{ "id": 1, "min_price": 100 }],
  "last_page": 5,
  "per_page": 12,
  "total": 60,
  "from": 13,
  "to": 24,
  "next_page_url": "https://api.test/api/catalog/products?page=3",
  "prev_page_url": "https://api.test/api/catalog/products?page=1"
}
```

Se afirma: `currentPage === 2`, `lastPage === 5`, `perPage === 12`, `total === 60`, `nextPageUrl` correcto, `prevPageUrl` correcto, `data[0].minPrice === 100` (y que no exista `meta`).

> Nota TDD: el transform ya existe (M2.3), así que este test **no tiene RED**: es un test de contrato/guard. Se documenta el motivo.

## Fix 2 — Precio efectivo de la variante

- Cambio mínimo en `src/app/product/[slug].tsx`:

```ts
const priceLabel = variant
  ? formatMXN(variant.price)
  : product.minPrice === product.maxPrice
    ? formatMXN(product.minPrice)
    : `${formatMXN(product.minPrice)} – ${formatMXN(product.maxPrice)}`;
```

- `variant.price` es el precio efectivo (`price_override ?? base_price`). `priceOverride` deja de usarse en UI.
- Corregir el fixture inconsistente de `[slug].spec.tsx` (`baseProduct` variante M/Blanco tenía `price: 100, priceOverride: 120`) a `price: 120`.

## Fix 3 — Selector: chips cruzados accionables (Opción B)

Se **mantiene** el deshabilitado cruzado y su `accessibilityState.disabled` (AC5 de M2.4 intacto). Cambio:

- Un chip **globalmente sin stock** (ninguna variante con stock para esa talla/color) queda `disabled` real de RN (no dispara `onPress`).
- Un chip **cruzado-deshabilitado** (disponible en general, pero no con el valor actual del otro eje) **no** usa la prop `disabled`; conserva el estilo atenuado y `accessibilityState.disabled=true`, y es **pulsable**.
- Los handlers en `product/[slug].tsx` auto-limpian el eje contrario cuando la combinación deja de ser válida:

```ts
const handleSelectSize = (next: string) => {
  setSize(next);
  setColor((cur) => (cur && !isSelectable(product.variants, next, cur) ? null : cur));
};
const handleSelectColor = (next: string) => {
  setColor(next);
  setSize((cur) => (cur && !isSelectable(product.variants, cur, next) ? null : cur));
};
```

- Thus S/Azul → tocar M (cruzada) limpia Azul y selecciona M → Rojo habilitado → M/Rojo.

**Caveat a11y aceptado:** un chip puede reportar `disabled` y ser pulsable. Se añade `accessibilityHint` aclaratorio ("cambia la otra selección si es necesario").

## Fix 4 — `expo-image` alineado al SDK 57

- Ejecutar `pnpm exec expo install expo-image` → `~2.0.7` a `~57.0.4`; actualiza `pnpm-lock.yaml` y `node_modules`.
- API usada (`Image`, `contentFit`, `source`) es estable; el mock de `jest.setup.js` es propio.

## Compatibilidad

- Fix 4 es un bump mayor aparente por esquema de versiones; validar `typecheck`/`lint`/tests de imagen.
- AC5 de M2.4 se preserva.

## Riesgos

- Inconsistencia a11y del Fix 3 (disabled anunciado pero accionable) — decisión de producto.
- Bump de `expo-image`: sólo validable a fondo con build EAS (F7).

## Plan de implementación

1. Fix 2 y Fix 3: TDD Red (tests) → Green (código) → Refactor.
2. Fix 1: test de contrato (guard, sin RED justificado).
3. Fix 4: `expo install` + verificación.
4. `pnpm typecheck`, `pnpm lint`, `pnpm test <archivo>` por spec tocado + regresión.

---

## Escenarios BDD

### AC1 — Paginator real

```gherkin
Dado que fetch devuelve un paginator Laravel plano (snake_case)
Cuando httpClient.get('/catalog/products?page=2')
Entonces el resultado tiene currentPage=2, lastPage=5, perPage=12, total=60
Y nextPageUrl/prevPageUrl mapeados
Y data[0].minPrice=100
Y no existe la clave meta
```

### AC2 — Precio de la variante seleccionada

```gherkin
Dado un producto con variante A (price 80) y variante B (price 100)
Cuando selecciono la variante B
Entonces product-price muestra "$100.00" (no "$80.00")
```

### AC3 — Chip cruzado accionable

```gherkin
Dado variantes S/Azul y M/Rojo
Y color Azul seleccionado
Cuando presiono la talla M (cruzada-deshabilitada)
Entonces se dispara onSelectSize('M')
```

### AC4 — Chip globalmente sin stock no accionable

```gherkin
Dado que la talla X no tiene stock en ninguna variante
Cuando presiono la talla X
Entonces NO se dispara onSelectSize
```

### AC5 — Ruta desbloqueada (integración)

```gherkin
Dado variantes S/Azul y M/Rojo
Cuando selecciono S, luego Azul, luego M
Entonces la talla M queda seleccionada y el color se limpia
Y al seleccionar Rojo queda M/Rojo seleccionado
```

### AC6 — expo-image alineado

```gherkin
Dado package.json
Entonces expo-image está en la línea ~57.0.4 del SDK 57
Y typecheck/lint/tests de imagen siguen verdes
```

## Definition of Done

- [x] Test de contrato del paginator (Fix 1) — `client.spec.ts` 11/11.
- [x] Precio `variant.price` + test de 2 variantes (Fix 2).
- [x] Selector Opción B + tests (Fix 3), AC5 de M2.4 intacto — `variant-selector` 7/7, `[slug]` 9/9.
- [x] `expo-image ~57.0.4` + lockfile (Fix 4) — `expo install` exit 0; plugin añadido a `app.json`.
- [x] `pnpm typecheck` exit 0, `pnpm lint` exit 0.
- [x] Regresión verde: `client`, `[slug]`, `variant-selector`, `variant-logic`, `image`, `product-gallery`, `product-card`, `catalog`.
- [ ] PR **abierto** contra `developer` (sin merge).
- [x] Docs (STATE/TASKS) actualizadas dentro de la rama/PR.
