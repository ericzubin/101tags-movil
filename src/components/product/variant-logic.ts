import type { ProductVariantSummary } from '@/core/models/catalog.model';

export function availableColors(variants: ProductVariantSummary[], size?: string | null): string[] {
  const pool = variants.filter((v) => !size || v.size === size);
  return unique(
    pool
      .filter((v) => v.stock > 0)
      .map((v) => v.color)
      .filter((c): c is string => !!c),
  );
}

export function availableSizes(variants: ProductVariantSummary[], color?: string | null): string[] {
  const pool = variants.filter((v) => !color || v.color === color);
  return unique(
    pool
      .filter((v) => v.stock > 0)
      .map((v) => v.size)
      .filter((s): s is string => !!s),
  );
}

export function findVariant(
  variants: ProductVariantSummary[],
  size: string | null,
  color: string | null,
): ProductVariantSummary | null {
  return variants.find((v) => v.size === size && v.color === color) ?? null;
}

export function isSelectable(
  variants: ProductVariantSummary[],
  size: string | null,
  color: string | null,
): boolean {
  return findVariant(variants, size, color)?.stock ? true : false;
}

export function clampQuantity(qty: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(Math.max(1, Math.floor(qty)), max);
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
