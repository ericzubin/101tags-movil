import type { CatalogFilters } from '@/core/models/catalog.model';
import type { HomeContentPlacement } from '@/core/models/home-content.model';

export const homeKeys = {
  all: ['home'] as const,
  content: (placement?: HomeContentPlacement) =>
    placement
      ? (['home', 'content', placement] as const)
      : (['home', 'content'] as const),
  banners: () => ['home', 'banners'] as const,
};

export const catalogKeys = {
  all: ['catalog'] as const,
  categories: (segment: string) => ['catalog', 'categories', segment] as const,
  products: (filters: CatalogFilters) => ['catalog', 'products', filters] as const,
  product: (slug: string) => ['catalog', 'product', slug] as const,
  filters: (segment: string, category?: string) =>
    ['catalog', 'filters', segment, category ?? null] as const,
  sponsoredAds: () => ['catalog', 'sponsored-ads'] as const,
};

export const orderKeys = {
  all: ['orders'] as const,
  list: () => ['orders', 'list'] as const,
  detail: (orderNumber: string) => ['orders', 'detail', orderNumber] as const,
  returns: () => ['orders', 'returns'] as const,
};
