import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import CatalogTab, { DEFAULT_SEGMENT } from '../catalog';
import type { Category, ProductSummary } from '@/core/models/catalog.model';
import { catalogKeys } from '@/core/query/keys';

const mockPush = jest.fn();
const mockUseQuery = jest.fn();
const mockGetCategories = jest.fn();
const mockGetProducts = jest.fn();
const mockCategoriesRefetch = jest.fn();
const mockProductsRefetch = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock('@/core/services/catalog-service', () => ({
  catalogService: {
    getCategories: (...args: unknown[]) => mockGetCategories(...args),
    getProducts: (...args: unknown[]) => mockGetProducts(...args),
  },
}));

interface QueryState {
  data?: unknown;
  isLoading?: boolean;
  isError?: boolean;
}

const QUERY_DEFAULTS: QueryState = { data: undefined, isLoading: false, isError: false };

function setupQueries(categories: QueryState = {}, products: QueryState = {}) {
  mockUseQuery.mockImplementation(
    (options: { queryKey: readonly unknown[]; queryFn?: () => unknown; enabled?: boolean }) => {
      const isCategories = options.queryKey[1] === 'categories';
      const state = isCategories
        ? { ...QUERY_DEFAULTS, ...categories }
        : { ...QUERY_DEFAULTS, ...products };
      if (options.enabled !== false && options.queryFn) {
        void options.queryFn();
      }
      return {
        ...state,
        refetch: isCategories ? mockCategoriesRefetch : mockProductsRefetch,
      };
    },
  );
}

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 1,
    name: 'Categoría',
    slug: 'categoria',
    segment: 'basicos',
    description: null,
    imageUrl: null,
    productsCount: 10,
    ...overrides,
  };
}

function makeProduct(overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id: 1,
    name: 'Producto base',
    slug: 'producto-base',
    supplierId: null,
    basePrice: 100,
    minPrice: 100,
    maxPrice: 100,
    image: '/storage/products/base.jpg',
    images: [],
    category: { id: 1, name: 'Ropa', slug: 'ropa' },
    subcategory: null,
    isFeatured: true,
    inStock: true,
    totalStock: 10,
    availableSizes: [],
    availableColors: [],
    ...overrides,
  };
}

const ROPA = makeCategory({
  id: 1,
  name: 'Ropa',
  slug: 'ropa',
  productsCount: 20,
  children: [
    { id: 11, name: 'Playeras', slug: 'playeras', productsCount: 8 },
    { id: 12, name: 'Pantalones', slug: 'pantalones', productsCount: 12 },
  ],
});

const ACCESORIOS = makeCategory({
  id: 2,
  name: 'Accesorios',
  slug: 'accesorios',
  productsCount: 5,
});

const CATEGORIES = [ROPA, ACCESORIOS];

describe('CatalogTab (M2.2 AC1-AC10)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReset();
    mockCategoriesRefetch.mockReset();
    mockProductsRefetch.mockReset();
    mockParams = {};
  });

  it('AC1: renderiza el árbol con las raíces y chevron en las que tienen hijos', () => {
    setupQueries({ data: { data: CATEGORIES } });

    render(<CatalogTab />);

    expect(screen.getByTestId('category-tree')).toBeTruthy();
    expect(screen.getByText('Ropa')).toBeTruthy();
    expect(screen.getByText('Accesorios')).toBeTruthy();
    expect(screen.getByText('chevron-forward')).toBeTruthy();
  });

  it('AC2: expande y colapsa los hijos de una raíz', () => {
    setupQueries({ data: { data: CATEGORIES } });

    render(<CatalogTab />);
    fireEvent.press(screen.getByTestId('category-ropa'));

    expect(screen.getByText('Playeras')).toBeTruthy();
    expect(screen.getByText('Pantalones')).toBeTruthy();
    expect(screen.getByText('chevron-down')).toBeTruthy();

    fireEvent.press(screen.getByTestId('category-ropa'));

    expect(screen.queryByText('Playeras')).toBeNull();
  });

  it('AC3: tap en raíz sin hijos dispara getProducts con category y muestra el grid', () => {
    setupQueries(
      { data: { data: CATEGORIES } },
      { data: { data: [makeProduct({ slug: 'gafas', name: 'Gafas' })] } },
    );

    render(<CatalogTab />);

    expect(mockGetProducts).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('category-accesorios'));

    expect(mockGetProducts).toHaveBeenCalledWith({ category: ['accesorios'] });
    expect(screen.getByTestId('product-grid')).toBeTruthy();
    expect(screen.getByText('Gafas')).toBeTruthy();
  });

  it('AC4: tap en subcategoría dispara getProducts con subcategory', () => {
    setupQueries({ data: { data: CATEGORIES } }, { data: { data: [] } });

    render(<CatalogTab />);
    fireEvent.press(screen.getByTestId('category-ropa'));
    fireEvent.press(screen.getByTestId('subcategory-playeras'));

    expect(mockGetProducts).toHaveBeenCalledWith({ subcategory: ['playeras'] });
  });

  it('AC5: param ?category= abre la lista directo sin árbol y con nombre resuelto', () => {
    mockParams = { category: 'ropa' };
    setupQueries(
      { data: { data: CATEGORIES } },
      { data: { data: [makeProduct({ slug: 'camisa-x', name: 'Camisa X' })] } },
    );

    render(<CatalogTab />);

    expect(screen.queryByTestId('category-tree')).toBeNull();
    expect(mockGetProducts).toHaveBeenCalledWith({ category: ['ropa'] });
    expect(screen.getByText('Camisa X')).toBeTruthy();
    expect(screen.getByText('Ropa')).toBeTruthy();
  });

  it('AC6: en loading de categorías muestra el skeleton del árbol', () => {
    setupQueries({ isLoading: true });

    render(<CatalogTab />);

    expect(screen.getByTestId('catalog-tree-skeleton')).toBeTruthy();
    expect(screen.queryByTestId('category-tree')).toBeNull();
  });

  it('AC7: error de categorías muestra ErrorState y el retry refetchea', () => {
    setupQueries({ isError: true });

    render(<CatalogTab />);

    expect(screen.getByText('Reintentar')).toBeTruthy();

    fireEvent.press(screen.getByTestId('catalog-tree-error-retry'));

    expect(mockCategoriesRefetch).toHaveBeenCalledTimes(1);
  });

  it('AC8: desde la lista, "Categorías" vuelve al árbol', () => {
    mockParams = { category: 'ropa' };
    setupQueries(
      { data: { data: CATEGORIES } },
      { data: { data: [makeProduct({ slug: 'camisa-x', name: 'Camisa X' })] } },
    );

    render(<CatalogTab />);

    expect(screen.queryByTestId('category-tree')).toBeNull();

    fireEvent.press(screen.getByTestId('catalog-back-to-tree'));

    expect(screen.getByTestId('category-tree')).toBeTruthy();
  });

  it('AC9: tap en producto navega a /product/<slug>', () => {
    mockParams = { category: 'ropa' };
    setupQueries(
      { data: { data: CATEGORIES } },
      { data: { data: [makeProduct({ slug: 'camisa-x', name: 'Camisa X' })] } },
    );

    render(<CatalogTab />);
    fireEvent.press(screen.getByTestId('product-card-camisa-x'));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/product/camisa-x');
  });

  it('AC10: lista vacía muestra "Sin productos"', () => {
    mockParams = { category: 'ropa' };
    setupQueries({ data: { data: CATEGORIES } }, { data: { data: [] } });

    render(<CatalogTab />);

    expect(screen.getByText('Sin productos')).toBeTruthy();
  });

  it('configura las queries con catalogKeys y no dispara productos en modo árbol', () => {
    mockParams = { subcategory: 'playeras' };
    setupQueries({ data: { data: CATEGORIES } }, { data: { data: [] } });

    render(<CatalogTab />);

    const keys = mockUseQuery.mock.calls.map(
      (call) => (call[0] as { queryKey: readonly unknown[] }).queryKey,
    );
    expect(keys).toEqual([
      catalogKeys.categories(DEFAULT_SEGMENT),
      catalogKeys.products({ subcategory: ['playeras'] }),
    ]);
  });
});
