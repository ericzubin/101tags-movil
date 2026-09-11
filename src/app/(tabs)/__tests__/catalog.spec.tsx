import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { FlatList } from 'react-native';

import CatalogTab, { DEFAULT_SEGMENT } from '../catalog';
import type { Category, ProductSummary } from '@/core/models/catalog.model';
import type { Paginated } from '@/core/models/common.model';
import { catalogKeys } from '@/core/query/keys';

const mockPush = jest.fn();
const mockUseQuery = jest.fn();
const mockUseInfiniteQuery = jest.fn();
const mockGetCategories = jest.fn();
const mockGetProducts = jest.fn();
const mockGetFilters = jest.fn();
const mockCategoriesRefetch = jest.fn();
const mockFiltersRefetch = jest.fn();
const mockProductsRefetch = jest.fn();
const mockFetchNextPage = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useInfiniteQuery: (...args: unknown[]) => mockUseInfiniteQuery(...args),
}));

jest.mock('@/core/services/catalog-service', () => ({
  catalogService: {
    getCategories: (...args: unknown[]) => mockGetCategories(...args),
    getProducts: (...args: unknown[]) => mockGetProducts(...args),
    getFilters: (...args: unknown[]) => mockGetFilters(...args),
  },
}));

interface QueryState {
  data?: unknown;
  isLoading?: boolean;
  isError?: boolean;
}

interface InfiniteState {
  data?: { pages: Paginated<ProductSummary>[] };
  isLoading?: boolean;
  isError?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

const QUERY_DEFAULTS: QueryState = { data: undefined, isLoading: false, isError: false };
const INFINITE_DEFAULTS: InfiniteState = {
  data: undefined,
  isLoading: false,
  isError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
};

function setupQueries(
  categories: QueryState = {},
  infinite: InfiniteState = {},
  filters: QueryState = {},
) {
  mockUseQuery.mockImplementation(
    (options: { queryKey: readonly unknown[]; queryFn?: () => unknown; enabled?: boolean }) => {
      const isCategories = options.queryKey[1] === 'categories';
      const isFilters = options.queryKey[1] === 'filters';
      const state = isCategories
        ? { ...QUERY_DEFAULTS, ...categories }
        : isFilters
          ? { ...QUERY_DEFAULTS, ...filters }
          : { ...QUERY_DEFAULTS };
      if (options.enabled !== false && options.queryFn) {
        void options.queryFn();
      }
      return {
        ...state,
        isFetching: false,
        refetch: isCategories
          ? mockCategoriesRefetch
          : isFilters
            ? mockFiltersRefetch
            : jest.fn(),
      };
    },
  );

  mockUseInfiniteQuery.mockImplementation(
    (options: {
      queryKey: readonly unknown[];
      queryFn?: (ctx: { pageParam: unknown; signal?: AbortSignal }) => unknown;
      initialPageParam?: unknown;
      enabled?: boolean;
    }) => {
      const state = { ...INFINITE_DEFAULTS, ...infinite };
      if (options.enabled !== false && options.queryFn) {
        void options.queryFn({ pageParam: options.initialPageParam, signal: undefined });
      }
      return {
        ...state,
        fetchNextPage: mockFetchNextPage,
        refetch: mockProductsRefetch,
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

function makePage(
  products: ProductSummary[],
  currentPage: number,
  lastPage: number,
): Paginated<ProductSummary> {
  return {
    data: products,
    currentPage,
    lastPage,
    perPage: 12,
    total: products.length,
    from: products.length > 0 ? 1 : null,
    to: products.length > 0 ? products.length : null,
    nextPageUrl: null,
    prevPageUrl: null,
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

const FILTER_OPTIONS = {
  sizes: ['S', 'M', 'L'],
  colors: ['Rojo', 'Azul'],
  priceMin: 100,
  priceMax: 300,
  categories: [],
  subcategories: [],
};

function listTrigger() {
  return screen.UNSAFE_getByType(FlatList).props.onEndReached;
}

describe('CatalogTab (M2.2 regresión árbol + M2.3 lista)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReset();
    mockUseInfiniteQuery.mockReset();
    mockCategoriesRefetch.mockReset();
    mockFiltersRefetch.mockReset();
    mockProductsRefetch.mockReset();
    mockFetchNextPage.mockReset();
    mockParams = {};
  });

  describe('M2.2 — modo árbol (regresión)', () => {
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

      fireEvent.press(screen.getByTestId('category-ropa'));

      expect(screen.queryByText('Playeras')).toBeNull();
    });

    it('AC3: tap en raíz sin hijos abre la lista con category', () => {
      setupQueries(
        { data: { data: CATEGORIES } },
        { data: { pages: [makePage([makeProduct({ slug: 'gafas', name: 'Gafas' })], 1, 1)] } },
      );

      render(<CatalogTab />);

      expect(mockGetProducts).not.toHaveBeenCalled();

      fireEvent.press(screen.getByTestId('category-accesorios'));

      expect(mockGetProducts).toHaveBeenCalledWith(
        expect.objectContaining({ category: ['accesorios'], page: 1 }),
        expect.anything(),
      );
      expect(screen.getByText('Gafas')).toBeTruthy();
    });

    it('AC4: tap en subcategoría abre la lista con subcategory', () => {
      setupQueries(
        { data: { data: CATEGORIES } },
        { data: { pages: [makePage([], 1, 1)] } },
      );

      render(<CatalogTab />);
      fireEvent.press(screen.getByTestId('category-ropa'));
      fireEvent.press(screen.getByTestId('subcategory-playeras'));

      expect(mockGetProducts).toHaveBeenCalledWith(
        expect.objectContaining({ subcategory: ['playeras'] }),
        expect.anything(),
      );
    });

    it('AC5: param ?category= abre la lista directo sin árbol y con nombre resuelto', () => {
      mockParams = { category: 'ropa' };
      setupQueries(
        { data: { data: CATEGORIES } },
        { data: { pages: [makePage([makeProduct({ slug: 'camisa-x', name: 'Camisa X' })], 1, 1)] } },
      );

      render(<CatalogTab />);

      expect(screen.queryByTestId('category-tree')).toBeNull();
      expect(mockGetProducts).toHaveBeenCalledWith(
        expect.objectContaining({ category: ['ropa'], page: 1 }),
        expect.anything(),
      );
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
      fireEvent.press(screen.getByTestId('catalog-tree-error-retry'));

      expect(mockCategoriesRefetch).toHaveBeenCalledTimes(1);
    });

    it('AC13: sin params muestra el árbol y NO llama getProducts', () => {
      setupQueries({ data: { data: CATEGORIES } });

      render(<CatalogTab />);

      expect(screen.getByTestId('category-tree')).toBeTruthy();
      expect(mockGetProducts).not.toHaveBeenCalled();
    });

    it('AC8: desde la lista, "Categorías" vuelve al árbol', () => {
      mockParams = { category: 'ropa' };
      setupQueries(
        { data: { data: CATEGORIES } },
        { data: { pages: [makePage([makeProduct({ slug: 'camisa-x', name: 'Camisa X' })], 1, 1)] } },
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
        { data: { pages: [makePage([makeProduct({ slug: 'camisa-x', name: 'Camisa X' })], 1, 1)] } },
      );

      render(<CatalogTab />);
      fireEvent.press(screen.getByTestId('product-card-camisa-x'));

      expect(mockPush).toHaveBeenCalledWith('/product/camisa-x');
    });

    it('AC10: lista vacía muestra "Sin productos"', () => {
      mockParams = { category: 'ropa' };
      setupQueries(
        { data: { data: CATEGORIES } },
        { data: { pages: [makePage([], 1, 1)] } },
      );

      render(<CatalogTab />);

      expect(screen.getByText('Sin productos')).toBeTruthy();
    });
  });

  describe('M2.3 — lista infinita, búsqueda, sort y filtros', () => {
    it('AC1: primera página llama getProducts con category/sort/page y muestra las cards', () => {
      mockParams = { category: 'ropa' };
      const products = Array.from({ length: 12 }, (_, i) =>
        makeProduct({ id: i + 1, slug: `producto-${i + 1}`, name: `Producto ${i + 1}` }),
      );
      setupQueries(
        { data: { data: CATEGORIES } },
        { data: { pages: [makePage(products, 1, 3)] }, hasNextPage: true },
      );

      render(<CatalogTab />);

      expect(mockGetProducts).toHaveBeenCalledWith(
        { category: ['ropa'], sort: 'newest', page: 1 },
        expect.anything(),
      );
      expect(screen.getByTestId('catalog-product-list')).toBeTruthy();
      expect(screen.getAllByTestId(/^catalog-list-item-/)).toHaveLength(12);
    });

    it('AC2: onEndReached llama fetchNextPage cuando hay página siguiente', () => {
      mockParams = { category: 'ropa' };
      setupQueries(
        { data: { data: CATEGORIES } },
        {
          data: { pages: [makePage([makeProduct({ slug: 'p-1' })], 1, 3)] },
          hasNextPage: true,
        },
      );

      render(<CatalogTab />);
      listTrigger()();

      expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
    });

    it('AC2b: no llama fetchNextPage si no hay página siguiente', () => {
      mockParams = { category: 'ropa' };
      setupQueries(
        { data: { data: CATEGORIES } },
        {
          data: { pages: [makePage([makeProduct({ slug: 'p-1' })], 3, 3)] },
          hasNextPage: false,
        },
      );

      render(<CatalogTab />);
      listTrigger()();

      expect(mockFetchNextPage).not.toHaveBeenCalled();
    });

    it('AC3: dedupe por slug entre páginas deja una sola card', () => {
      mockParams = { category: 'ropa' };
      setupQueries(
        { data: { data: CATEGORIES } },
        {
          data: {
            pages: [
              makePage(
                [
                  makeProduct({ id: 1, slug: 'camisa-x', name: 'Camisa X' }),
                  makeProduct({ id: 2, slug: 'pantalon-y', name: 'Pantalón Y' }),
                ],
                1,
                2,
              ),
              makePage(
                [
                  makeProduct({ id: 3, slug: 'camisa-x', name: 'Camisa X repetida' }),
                  makeProduct({ id: 4, slug: 'gorra-z', name: 'Gorra Z' }),
                ],
                2,
                2,
              ),
            ],
          },
        },
      );

      render(<CatalogTab />);

      expect(screen.getAllByTestId('catalog-list-item-camisa-x')).toHaveLength(1);
      expect(screen.getByTestId('catalog-list-item-gorra-z')).toBeTruthy();
    });

    it('AC4: sort chips cambian el sort de la query', () => {
      mockParams = { category: 'ropa' };
      setupQueries(
        { data: { data: CATEGORIES } },
        { data: { pages: [makePage([makeProduct({ slug: 'camisa-x' })], 1, 1)] } },
      );

      render(<CatalogTab />);
      fireEvent.press(screen.getByTestId('sort-price_asc'));

      expect(mockGetProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort: 'price_asc', page: 1 }),
        expect.anything(),
      );
      expect(screen.getByTestId('sort-price_asc').props.accessibilityState.selected).toBe(true);
    });

    it('AC5: búsqueda se debounce 350ms antes de llamar con q', () => {
      jest.useFakeTimers();
      try {
        mockParams = { category: 'ropa' };
        setupQueries(
          { data: { data: CATEGORIES } },
          { data: { pages: [makePage([makeProduct({ slug: 'camisa-x' })], 1, 1)] } },
        );

        render(<CatalogTab />);

        fireEvent.changeText(screen.getByTestId('catalog-search-input'), 'camisa');

        const before = mockGetProducts.mock.calls.map((call) => call[0] as { q?: string });
        expect(before.some((f) => f.q === 'camisa')).toBe(false);

        act(() => {
          jest.advanceTimersByTime(350);
        });

        expect(mockGetProducts).toHaveBeenLastCalledWith(
          expect.objectContaining({ q: 'camisa', page: 1 }),
          expect.anything(),
        );
      } finally {
        jest.useRealTimers();
      }
    });

    it('AC6: abrir el sheet carga las opciones con getFilters', () => {
      mockParams = { category: 'ropa' };
      setupQueries(
        { data: { data: CATEGORIES } },
        { data: { pages: [makePage([makeProduct({ slug: 'camisa-x' })], 1, 1)] } },
        { data: FILTER_OPTIONS },
      );

      render(<CatalogTab />);
      expect(mockGetFilters).not.toHaveBeenCalled();

      fireEvent.press(screen.getByTestId('catalog-open-filters'));

      expect(mockGetFilters).toHaveBeenCalledWith(DEFAULT_SEGMENT, 'ropa');
      expect(screen.getByTestId('filters-sheet-apply')).toBeTruthy();
    });

    it('AC7: aplicar filtros cierra el sheet y actualiza la query', () => {
      mockParams = { category: 'ropa' };
      setupQueries(
        { data: { data: CATEGORIES } },
        { data: { pages: [makePage([makeProduct({ slug: 'camisa-x' })], 1, 1)] } },
        { data: FILTER_OPTIONS },
      );

      render(<CatalogTab />);
      fireEvent.press(screen.getByTestId('catalog-open-filters'));
      fireEvent.press(screen.getByTestId('filter-size-M'));
      fireEvent.press(screen.getByTestId('filter-color-Rojo'));
      fireEvent(screen.getByTestId('filter-in-stock'), 'valueChange', true);
      fireEvent.press(screen.getByTestId('filters-sheet-apply'));

      expect(mockGetProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ sizes: ['M'], colors: ['Rojo'], inStock: true, page: 1 }),
        expect.anything(),
      );
      expect(screen.queryByTestId('filters-sheet-apply')).toBeNull();
    });

    it('AC8: Limpiar quita filtros pero conserva category', () => {
      mockParams = { category: 'ropa' };
      setupQueries(
        { data: { data: CATEGORIES } },
        { data: { pages: [makePage([makeProduct({ slug: 'camisa-x' })], 1, 1)] } },
        { data: FILTER_OPTIONS },
      );

      render(<CatalogTab />);
      fireEvent.press(screen.getByTestId('catalog-open-filters'));
      fireEvent.press(screen.getByTestId('filter-size-M'));
      fireEvent.press(screen.getByTestId('filters-sheet-apply'));
      fireEvent.press(screen.getByTestId('catalog-open-filters'));
      fireEvent.press(screen.getByTestId('filters-sheet-clear'));

      const last = mockGetProducts.mock.calls.at(-1)?.[0] as Record<string, unknown>;
      expect(last.category).toEqual(['ropa']);
      expect(last.sizes).toBeUndefined();
      expect(last.colors).toBeUndefined();
      expect(last.priceMin).toBeUndefined();
      expect(last.priceMax).toBeUndefined();
      expect(last.inStock).toBeUndefined();
      expect(last.onSale).toBeUndefined();
    });

    it('AC9: cerrar el sheet sin aplicar conserva los filtros previos', () => {
      mockParams = { category: 'ropa' };
      setupQueries(
        { data: { data: CATEGORIES } },
        { data: { pages: [makePage([makeProduct({ slug: 'camisa-x' })], 1, 1)] } },
        { data: FILTER_OPTIONS },
      );

      render(<CatalogTab />);
      fireEvent.press(screen.getByTestId('catalog-open-filters'));
      fireEvent.press(screen.getByTestId('filter-size-M'));
      fireEvent.press(screen.getByTestId('filters-sheet-apply'));
      fireEvent.press(screen.getByTestId('catalog-open-filters'));
      fireEvent.press(screen.getByTestId('filter-size-L'));
      fireEvent.press(screen.getByTestId('filters-sheet-close'));

      const last = mockGetProducts.mock.calls.at(-1)?.[0] as { sizes?: string[] };
      expect(last.sizes).toEqual(['M']);
      expect(screen.queryByTestId('filters-sheet-apply')).toBeNull();
    });

    it('AC11: error de primera página muestra ErrorState y retry refetchea', () => {
      mockParams = { category: 'ropa' };
      setupQueries(
        { data: { data: CATEGORIES } },
        { isError: true },
      );

      render(<CatalogTab />);

      expect(screen.getByTestId('catalog-list-error')).toBeTruthy();

      fireEvent.press(screen.getByTestId('catalog-list-error-retry'));

      expect(mockProductsRefetch).toHaveBeenCalledTimes(1);
    });

    it('AC12: combinaciones de sort usan queryKeys distintas', () => {
      mockParams = { category: 'ropa' };
      setupQueries(
        { data: { data: CATEGORIES } },
        { data: { pages: [makePage([makeProduct({ slug: 'camisa-x' })], 1, 1)] } },
      );

      render(<CatalogTab />);

      const keys = mockUseInfiniteQuery.mock.calls.map(
        (call) => (call[0] as { queryKey: readonly unknown[] }).queryKey,
      );

      expect(keys).toContainEqual(catalogKeys.products({ category: ['ropa'], sort: 'newest' }));

      fireEvent.press(screen.getByTestId('sort-price_asc'));
      const afterAsc = mockUseInfiniteQuery.mock.calls.at(-1)?.[0].queryKey;
      expect(afterAsc).toEqual(catalogKeys.products({ category: ['ropa'], sort: 'price_asc' }));
      expect(afterAsc).not.toEqual(keys[0]);

      fireEvent.press(screen.getByTestId('sort-price_desc'));

      const lastKey = mockUseInfiniteQuery.mock.calls.at(-1)?.[0].queryKey;
      expect(lastKey).toEqual(catalogKeys.products({ category: ['ropa'], sort: 'price_desc' }));
    });

    it('primer loading de la lista muestra el skeleton', () => {
      mockParams = { category: 'ropa' };
      setupQueries({ data: { data: CATEGORIES } }, { isLoading: true });

      render(<CatalogTab />);

      expect(screen.getByTestId('catalog-list-skeleton')).toBeTruthy();
    });

    it('isFetchingNextPage muestra el spinner de footer', () => {
      mockParams = { category: 'ropa' };
      setupQueries(
        { data: { data: CATEGORIES } },
        {
          data: { pages: [makePage([makeProduct({ slug: 'p-1' })], 1, 3)] },
          hasNextPage: true,
          isFetchingNextPage: true,
        },
      );

      render(<CatalogTab />);

      expect(screen.getByTestId('catalog-list-loading-more')).toBeTruthy();
    });
  });
});
