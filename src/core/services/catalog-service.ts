import { httpClient } from '@/core/api/client';
import type {
  CatalogFilters,
  CatalogProductListResponse,
  CategoriesResponse,
  FilterOptions,
  ProductDetail,
  SponsoredAdsResponse,
} from '@/core/models/catalog.model';

export const catalogService = {
  async getCategories(segment: string = 'basicos'): Promise<CategoriesResponse> {
    return httpClient.request<CategoriesResponse>('/catalog/categories', {
      method: 'GET',
      query: { segment },
    });
  },

  async getProducts(filters: CatalogFilters = {}): Promise<CatalogProductListResponse> {
    return httpClient.request<CatalogProductListResponse>('/catalog/products', {
      method: 'GET',
      query: serializeFilters(filters),
    });
  },

  async getProductBySlug(slug: string): Promise<ProductDetail> {
    return httpClient.request<ProductDetail>(
      `/catalog/products/${encodeURIComponent(slug)}`,
      { method: 'GET' },
    );
  },

  async getFilters(segment: string = 'basicos', category?: string): Promise<FilterOptions> {
    return httpClient.request<FilterOptions>('/catalog/filters', {
      method: 'GET',
      query: { segment, category },
    });
  },

  async getSponsoredAds(): Promise<SponsoredAdsResponse> {
    return httpClient.request<SponsoredAdsResponse>('/catalog/sponsored-ads', {
      method: 'GET',
      query: { record_impressions: '0' },
    });
  },
};

function serializeFilters(
  filters: CatalogFilters,
): Record<string, string | number | undefined> {
  const out: Record<string, string | number | undefined> = {};
  if (filters.q) out.q = filters.q;
  if (filters.category?.length) out.category = filters.category.join(',');
  if (filters.subcategory?.length) out.subcategory = filters.subcategory.join(',');
  if (filters.sizes?.length) out.sizes = filters.sizes.join(',');
  if (filters.colors?.length) out.colors = filters.colors.join(',');
  if (filters.priceMin !== undefined) out.price_min = filters.priceMin;
  if (filters.priceMax !== undefined) out.price_max = filters.priceMax;
  if (filters.segment) out.segment = filters.segment;
  if (filters.supplierId !== undefined) out.supplier_id = filters.supplierId;
  if (filters.featured !== undefined) out.featured = filters.featured ? '1' : '0';
  if (filters.inStock !== undefined) out.in_stock = filters.inStock ? '1' : '0';
  if (filters.onSale !== undefined) out.on_sale = filters.onSale ? '1' : '0';
  if (filters.sort) out.sort = filters.sort;
  if (filters.page !== undefined) out.page = filters.page;
  if (filters.perPage !== undefined) out.per_page = filters.perPage;
  return out;
}
