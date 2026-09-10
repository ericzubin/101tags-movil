# Spec: M2.2-categories — Árbol de categorías en la tab Catálogo (#13)

**Status**: APPROVED (auto-aprobado)
**Spec ID**: 2026-09-11-m2-2-categories
**Author**: Agente principal (Architect)
**Date**: 2026-09-11
**Issue GitHub**: #13 — [101M][F2] M2.2 — Árbol de categorías
**Branch base**: `f2/catalogo` @ a2f3996
**Depends on**: M2.0 (services/keys/UI), M2.1 (ProductCard, nav desde home). M2.3 vendrá después y EXTENDERÁ este mismo archivo.

---

## Contexto

`src/app/(tabs)/catalog.tsx` es un placeholder ("Próximamente — Fase 2"). El backend expone `GET /api/catalog/categories?segment=basicos` → `{ data: Category[] }` con raíces y `children` (1 nivel). El home (M2.1) ya navega a `/(tabs)/catalog?category=<slug>`.

## Decisión de arquitectura

**Una sola pantalla con modo interno** (sin rutas anidadas):

```
catalog.tsx
├── mode='tree'  → árbol de categorías (landing)
└── mode='list'  → productos filtrados por categoría/subcategoría
```

- Modo inicial derivado de `useLocalSearchParams`: si viene `category` (o `subcategory`) → `'list'`; si no → `'tree'`.
- M2.3 extenderá el modo `list` con FilterSheet + paginación (no cambia la arquitectura).

## Objetivo

1. Reescribir `(tabs)/catalog.tsx` con el modo árbol + modo lista básica.
2. `CategoryTree` component: raíces expandibles (chevron) + hijos; tap → seleccionar categoría.
3. `ProductGrid` component: grid 2 columnas de `ProductCard` (reuso de M2.1).
4. Modo lista básico: `getProducts({ category: [slug] })` o `{ subcategory: [slug] }`, primera página, header con botón "Categorías" (volver al árbol) y nombre de la categoría.
5. Estados loading/error/empty en ambos modos.
6. Navegación: producto → `/product/<slug>`.

## Fuera de alcance

- FilterSheet, sort, search, paginación/infinite scroll → **M2.3**.
- Selector de segmento (basicos/industrial/servicios) → futuro; hardcodear `basicos` con constante exportada.
- Breadcrumbs profundos.
- Pull-to-refresh (opcional, no requerido; se puede añadir si simple).

## Archivos

### Crear

- `src/components/catalog/CategoryTree.tsx`
- `src/components/catalog/ProductGrid.tsx`
- `src/components/catalog/__tests__/category-tree.spec.tsx` (≥4)
- `src/components/catalog/__tests__/product-grid.spec.tsx` (≥2)

### Reescribir

- `src/app/(tabs)/catalog.tsx` (placeholder → pantalla real)
- `src/app/(tabs)/__tests__/catalog.spec.tsx` (los 2 smoke tests de placeholder se reemplazan por ≥7 tests reales)

### NO tocar

- `(tabs)/_layout.tsx`, `(tabs)/index.tsx`, `(tabs)/cart.tsx`, `(tabs)/account.tsx`
- `src/app/_layout.tsx` (M2.4 ya agregó su Screen)
- Componentes de home/product (M2.1/M2.4)

## Contratos

### `CategoryTree.tsx`

```tsx
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from '@/components/ui/Image';
import type { Category } from '@/core/models/catalog.model';

export interface CategoryTreeProps {
  categories: Category[];
  onSelect: (selection: { slug: string; name: string; kind: 'category' | 'subcategory' }) => void;
  testID?: string;
}

export function CategoryTree({ categories, onSelect, testID }: CategoryTreeProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (slug: string) => setExpanded((cur) => (cur === slug ? null : slug));

  return (
    <View testID={testID ?? 'category-tree'}>
      {categories.map((cat) => {
        const hasChildren = (cat.children?.length ?? 0) > 0;
        const isExpanded = expanded === cat.slug;
        return (
          <View key={cat.slug}>
            <Pressable
              testID={`category-${cat.slug}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: hasChildren ? isExpanded : undefined }}
              onPress={() => (hasChildren ? toggle(cat.slug) : onSelect({ slug: cat.slug, name: cat.name, kind: 'category' }))}
              onLongPress={hasChildren ? () => onSelect({ slug: cat.slug, name: cat.name, kind: 'category' }) : undefined}
              className="flex-row items-center p-4 bg-white border-b border-brand-dark/10 active:opacity-80"
            >
              <Image source={cat.imageUrl} width={48} height={48} rounded contentFit="cover" />
              <View className="flex-1 ml-3">
                <Text className="font-brand-bold text-base text-brand-dark">{cat.name}</Text>
                <Text className="font-brand text-xs text-brand-dark/60">{cat.productsCount} productos</Text>
              </View>
              {hasChildren && (
                <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-forward'} size={20} color="#0a0a0a" />
              )}
            </Pressable>
            {hasChildren && isExpanded && (
              <View testID={`category-children-${cat.slug}`}>
                {cat.children!.map((child) => (
                  <Pressable
                    key={child.slug}
                    testID={`subcategory-${child.slug}`}
                    accessibilityRole="button"
                    onPress={() => onSelect({ slug: child.slug, name: child.name, kind: 'subcategory' })}
                    className="flex-row items-center pl-16 pr-4 py-3 bg-brand-medium active:opacity-80"
                  >
                    <Text className="font-brand text-sm text-brand-dark">{child.name}</Text>
                    <Text className="font-brand text-xs text-brand-dark/60 ml-2">({child.productsCount})</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
```

**UX**: tap en raíz CON hijos → expande/colapsa; tap en raíz SIN hijos → selecciona; long-press en raíz con hijos → selecciona la raíz (ver todos sus productos). Esto se documenta en la pantalla con un hint sutil si se desea (opcional).

### `ProductGrid.tsx`

```tsx
import { View } from 'react-native';
import { ProductCard } from './ProductCard';
import type { ProductSummary } from '@/core/models/catalog.model';

export interface ProductGridProps {
  products: ProductSummary[];
  onSelectProduct: (product: ProductSummary) => void;
  testID?: string;
}

export function ProductGrid({ products, onSelectProduct, testID }: ProductGridProps) {
  return (
    <View testID={testID ?? 'product-grid'} className="flex-row flex-wrap justify-between px-3">
      {products.map((p) => (
        <View key={p.slug} className="w-1/2 p-1">
          <ProductCard product={p} onPress={onSelectProduct} />
        </View>
      ))}
    </View>
  );
}
```

⚠️ `ProductCard` de M2.1 tiene `className="w-40 mr-3 ..."` fijo. Para el grid, M2.2 puede pasar un wrapper que ocupe el ancho (`w-1/2 p-1`) — la card mantendrá su ancho fijo `w-40` dentro. Si se ve mal, ajustar `ProductCard` para aceptar `className?: string` que reemplace `w-40 mr-3`… **Preferido**: añadir prop opcional `className` a `ProductCard` en esta spec (cambio mínimo a archivo de M2.1) y usar `className="w-full"` en el grid. Documentar el cambio. Tests de ProductCard existentes deben seguir verdes.

### `(tabs)/catalog.tsx`

```tsx
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';

export const DEFAULT_SEGMENT = 'basicos' as const;

type CatalogMode = 'tree' | 'list';
type Selection = { slug: string; name: string; kind: 'category' | 'subcategory' };

export default function CatalogTab() {
  const params = useLocalSearchParams<{ category?: string; subcategory?: string }>();
  const initialSelection: Selection | null = params.subcategory
    ? { slug: params.subcategory, name: params.subcategory, kind: 'subcategory' }
    : params.category
      ? { slug: params.category, name: params.category, kind: 'category' }
      : null;
  const [selection, setSelection] = useState<Selection | null>(initialSelection);

  const categoriesQuery = useQuery({
    queryKey: catalogKeys.categories(DEFAULT_SEGMENT),
    queryFn: () => catalogService.getCategories(DEFAULT_SEGMENT),
  });

  // modo: selection null → tree; selection != null → list
  // ... estados loading/error/empty para categoriesQuery (tree)
  // ... useQuery products when selection (list): catalogKeys.products(filters) con filters { category:[slug] } o { subcategory:[slug] }
}
```

- Header del modo lista: `<Pressable testID="catalog-back-to-tree" onPress={() => setSelection(null)}>` con Ionicons `arrow-back` + texto "Categorías"; y `<Text>` nombre de la selección (si la categoría está en `categoriesQuery.data`, usar su `name` real; si no, el slug).
- ScrollView para árbol; la lista usa `ProductGrid` dentro de ScrollView.
- Loading tree: skeleton con testID `catalog-tree-skeleton`.
- Error tree: `<ErrorState onRetry={() => categoriesQuery.refetch()} />`.
- Empty tree: `<EmptyState title="Sin categorías" />`.
- Loading list: skeleton `catalog-list-skeleton`.
- Error list: `<ErrorState onRetry={productsQuery.refetch} />`.
- Empty list: `<EmptyState title="Sin productos" subtitle="Esta categoría aún no tiene productos." />`.
- Tap producto: `router.push(\`/product/${product.slug}\`)`.

## Acceptance Criteria (BDD)

### AC1: Árbol renderiza raíces

```gherkin
Scenario: Categorías cargadas
  Given getCategories retorna 3 raíces (una con children)
  When render CatalogTab sin params
  Then aparecen las 3 raíces por nombre
  And la raíz con children muestra chevron-forward
```

### AC2: Expand/collapse

```gherkin
Scenario: Raíz con hijos
  Given raíz "ropa" con children [playeras, pantalones]
  When tap en "ropa"
  Then aparecen "playeras" y "pantalones"
  And el chevron cambió a chevron-down
  When tap de nuevo en "ropa"
  Then los children desaparecen
```

### AC3: Tap raíz sin hijos → lista

```gherkin
Scenario: Raíz sin hijos
  Given raíz "accesorios" sin children
  When tap en "accesorios"
  Then se dispara getProducts con category=["accesorios"]
  And se muestra el grid con los productos
```

### AC4: Tap subcategoría → lista con subcategory

```gherkin
Scenario: Subcategoría
  Given raíz "ropa" expandida con hija "playeras"
  When tap en "playeras"
  Then getProducts es llamado con subcategory=["playeras"]
```

### AC5: Param ?category=slug abre lista directo

```gherkin
Scenario: Deep link interno desde home
  Given useLocalSearchParams retorna { category: "ropa" }
  When render CatalogTab
  Then NO se muestra el árbol
  And getProducts fue llamado con category=["ropa"]
```

### AC6: Loading tree

```gherkin
Scenario: Categorías cargando
  Given categoriesQuery.isLoading=true
  Then aparece testID "catalog-tree-skeleton"
```

### AC7: Error tree con retry

```gherkin
Scenario: Error categorías
  Given categoriesQuery.isError=true
  Then aparece ErrorState
  When tap "Reintentar"
  Then categoriesQuery.refetch fue llamado
```

### AC8: Volver al árbol

```gherkin
Scenario: Desde lista
  Given modo lista activo
  When tap "Categorías"
  Then se muestra el árbol de nuevo
```

### AC9: Producto navega a detalle

```gherkin
Scenario: Tap producto en grid
  Given lista con producto slug "camisa-x"
  When tap en la card
  Then router.push llamado con "/product/camisa-x"
```

### AC10: Empty list

```gherkin
Scenario: Categoría sin productos
  Given getProducts retorna []
  Then aparece "Sin productos"
```

## Definition of Done

- [ ] `CategoryTree.tsx` + tests (≥4).
- [ ] `ProductGrid.tsx` + tests (≥2).
- [ ] `ProductCard` acepta `className?` opcional (cambio mínimo) y sus tests siguen verdes.
- [ ] `catalog.tsx` reescrito + tests (≥7).
- [ ] `catalog.spec.tsx` viejo (smoke placeholder) reemplazado.
- [ ] `pnpm typecheck` exit 0, `pnpm lint` exit 0.
- [ ] Regresión: `(tabs)/__tests__/index.spec.tsx` (home, usa nav a catalog), `_layout.spec.tsx`, `product-card.spec.tsx`.
- [ ] PR contra `f2/catalogo`, merge `--squash --delete-branch --admin`.

## Riesgos / caveats

1. **`ProductCard` className**: si se modifica, no romper `product-card.spec.tsx` ni el uso del home (FeaturedProductsRow usa la card con `mr-3` en un ScrollView horizontal). Hacer que `className` tenga default `"w-40 mr-3"` y en grid pasar `"w-full mr-0"`.
2. **Nombre de categoría desde slug**: en modo lista iniciado por param, resolver el nombre real desde `categoriesQuery.data` (buscar en raíces e hijas). Fallback: slug.
3. **`useLocalSearchParams` mock**: ya está mockeado en jest.setup.js; override local por test para simular params.
4. **Modo dual**: no romper cuando `selection` cambia; los queries usan `enabled: !!selection` para no disparar productos en modo árbol.
5. **Segment hardcodeado** `'basicos'` exportado como `DEFAULT_SEGMENT` para que M2.3 lo reuse.
