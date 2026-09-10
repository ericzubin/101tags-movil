import {
  availableColors,
  availableSizes,
  clampQuantity,
  findVariant,
  isSelectable,
} from '@/components/product/variant-logic';
import type { ProductVariantSummary } from '@/core/models/catalog.model';

function variant(overrides: Partial<ProductVariantSummary>): ProductVariantSummary {
  return {
    id: 1,
    size: 'M',
    color: 'Negro',
    sku: 'SKU-1',
    stock: 5,
    inStock: true,
    price: 100,
    priceOverride: null,
    ...overrides,
  };
}

const variants: ProductVariantSummary[] = [
  variant({ id: 1, size: 'S', color: 'Negro', stock: 3 }),
  variant({ id: 2, size: 'M', color: 'Negro', stock: 0, inStock: false }),
  variant({ id: 3, size: 'M', color: 'Blanco', stock: 5 }),
  variant({ id: 4, size: 'Única', color: null, stock: 2 }),
];

describe('variant-logic — disponibilidad', () => {
  it('availableColors: solo colores únicos con stock', () => {
    expect(availableColors(variants)).toEqual(['Negro', 'Blanco']);
  });

  it('availableColors: filtra por talla y excluye stock 0', () => {
    expect(availableColors(variants, 'M')).toEqual(['Blanco']);
  });

  it('availableSizes: tallas únicas con stock (ignora agotadas)', () => {
    expect(availableSizes(variants)).toEqual(['S', 'M', 'Única']);
  });

  it('availableSizes: filtra por color', () => {
    expect(availableSizes(variants, 'Negro')).toEqual(['S']);
  });

  it('availableColors/Sizes: variantes sin talla o color no aportan valores', () => {
    const sinColor = variants.filter((v) => v.size === 'Única');
    expect(availableColors(sinColor)).toEqual([]);
    const sinTalla = variants.filter((v) => v.color === 'Negro');
    expect(availableColors(sinTalla, 'M')).toEqual([]);
  });

  it('availableColors/Sizes: producto sin variantes retorna []', () => {
    expect(availableColors([])).toEqual([]);
    expect(availableSizes([])).toEqual([]);
  });
});

describe('variant-logic — resolución de variante', () => {
  it('findVariant: encuentra la combinación exacta', () => {
    expect(findVariant(variants, 'M', 'Blanco')?.id).toBe(3);
  });

  it('findVariant: retorna la variante aunque tenga stock 0', () => {
    expect(findVariant(variants, 'M', 'Negro')?.id).toBe(2);
  });

  it('findVariant: combinación inexistente retorna null', () => {
    expect(findVariant(variants, 'XL', 'Negro')).toBeNull();
  });

  it('isSelectable: true solo con stock > 0', () => {
    expect(isSelectable(variants, 'M', 'Blanco')).toBe(true);
    expect(isSelectable(variants, 'M', 'Negro')).toBe(false);
    expect(isSelectable(variants, 'S', 'Blanco')).toBe(false);
    expect(isSelectable([], 'M', 'Negro')).toBe(false);
  });
});

describe('variant-logic — clampQuantity', () => {
  it('nunca baja de 1', () => {
    expect(clampQuantity(0, 5)).toBe(1);
    expect(clampQuantity(-3, 5)).toBe(1);
  });

  it('nunca sube del máximo', () => {
    expect(clampQuantity(10, 3)).toBe(3);
    expect(clampQuantity(3, 3)).toBe(3);
  });

  it('trunca decimales', () => {
    expect(clampQuantity(2.9, 5)).toBe(2);
  });

  it('stock 0 (o negativo) retorna 0', () => {
    expect(clampQuantity(4, 0)).toBe(0);
    expect(clampQuantity(4, -1)).toBe(0);
  });
});
