import type { Paginated } from './common.model';

export interface CategoryChild {
  id: number;
  name: string;
  slug: string;
  productsCount: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  segment: 'basicos' | 'industrial' | 'servicios';
  description: string | null;
  imageUrl: string | null;
  productsCount: number;
  children?: CategoryChild[];
}

export interface CategoriesResponse {
  data: Category[];
}

export interface ProductVariantSummary {
  id: number;
  size: string | null;
  color: string | null;
  sku: string;
  stock: number;
  inStock: boolean;
  price: number;
  priceOverride: number | null;
}

export interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  supplierId: number | null;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  image: string | null;
  images: { path: string; url: string }[];
  category: { id: number; name: string; slug: string };
  subcategory: { slug: string; name: string } | null;
  isFeatured: boolean;
  inStock: boolean;
  totalStock: number;
  availableSizes: string[];
  availableColors: string[];
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  variants: ProductVariantSummary[];
}

export interface FilterOptionCount {
  slug: string;
  name: string;
  count: number;
}

export interface FilterOptionCategory extends FilterOptionCount {
  categorySlug?: string;
}

export interface FilterOptions {
  sizes: string[];
  colors: string[];
  priceMin: number;
  priceMax: number;
  categories: FilterOptionCount[];
  subcategories: FilterOptionCategory[];
}

export interface CatalogFilters {
  q?: string;
  category?: string[];
  subcategory?: string[];
  sizes?: string[];
  colors?: string[];
  priceMin?: number;
  priceMax?: number;
  segment?: 'basicos' | 'industrial' | 'servicios';
  supplierId?: number;
  featured?: boolean;
  inStock?: boolean;
  onSale?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  perPage?: number;
}

export interface SponsoredAdItem {
  adId: number;
  title: string;
  placement: 'home' | 'store';
  product: ProductSummary;
}

export interface SponsoredAdsResponse {
  data: SponsoredAdItem[];
}

export type CatalogProductListResponse = Paginated<ProductSummary>;
