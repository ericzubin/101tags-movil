import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import HomeTab from '../index';
import type { ProductSummary } from '@/core/models/catalog.model';
import type {
  HomeContentByPlacement,
  HomeContentItem,
} from '@/core/models/home-content.model';
import { catalogKeys, homeKeys } from '@/core/query/keys';

const mockPush = jest.fn();
const mockUseQuery = jest.fn();
const mockHomeRefetch = jest.fn();
const mockFeaturedRefetch = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useRouter: () => ({ push: (...args: unknown[]) => mockPush(...args) }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

interface QueryState {
  data?: unknown;
  isLoading?: boolean;
  isError?: boolean;
}

const QUERY_DEFAULTS: QueryState = { data: undefined, isLoading: false, isError: false };

function setupQueries(home: QueryState = {}, featured: QueryState = {}) {
  mockUseQuery.mockImplementation((options: { queryKey: readonly unknown[] }) => {
    const isHome = options.queryKey[0] === 'home';
    const state = isHome ? { ...QUERY_DEFAULTS, ...home } : { ...QUERY_DEFAULTS, ...featured };
    return {
      ...state,
      refetch: isHome ? mockHomeRefetch : mockFeaturedRefetch,
    };
  });
}

function makeHomeItem(overrides: Partial<HomeContentItem> = {}): HomeContentItem {
  return {
    id: 1,
    placement: 'hero',
    type: 'image',
    image: '/storage/home/item-1.jpg',
    video: null,
    poster: null,
    alt: null,
    link: null,
    size: null,
    category: null,
    title: null,
    subtitle: null,
    sortOrder: 0,
    startsAt: null,
    endsAt: null,
    ...overrides,
  };
}

function makeHomeData(
  overrides: Partial<HomeContentByPlacement> = {},
): HomeContentByPlacement {
  return {
    hero: [],
    featuredCategory: [],
    featuredMedia: [],
    ribbon: [],
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

describe('HomeTab (M2.1 AC1-AC6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReset();
    mockHomeRefetch.mockReset();
    mockFeaturedRefetch.mockReset();
  });

  it('AC1: en loading muestra el skeleton y no "Destacados"', () => {
    setupQueries({ isLoading: true }, { isLoading: true });

    render(<HomeTab />);

    expect(screen.getByTestId('home-skeleton')).toBeTruthy();
    expect(screen.queryByText('Destacados')).toBeNull();
  });

  it('AC2: si ambas queries fallan muestra ErrorState y el retry refetchea las dos', () => {
    setupQueries({ isError: true }, { isError: true });

    render(<HomeTab />);

    expect(screen.getByTestId('home-error')).toBeTruthy();
    expect(screen.getByText('Reintentar')).toBeTruthy();

    fireEvent.press(screen.getByTestId('home-error-retry'));

    expect(mockHomeRefetch).toHaveBeenCalledTimes(1);
    expect(mockFeaturedRefetch).toHaveBeenCalledTimes(1);
  });

  it('AC3: renderiza un hero item por entrada de home-content.hero', () => {
    setupQueries({
      data: {
        data: makeHomeData({
          hero: [
            makeHomeItem({ id: 101, title: 'Verano' }),
            makeHomeItem({ id: 102, title: 'Invierno' }),
          ],
        }),
      },
    });

    render(<HomeTab />);

    expect(screen.getAllByTestId(/^hero-item-/)).toHaveLength(2);
    expect(screen.getByText('Verano')).toBeTruthy();
  });

  it('AC4: tap en categoría navega a /(tabs)/catalog con query param', () => {
    setupQueries({
      data: {
        data: makeHomeData({
          featuredCategory: [
            makeHomeItem({
              id: 201,
              placement: 'featured_category',
              title: 'Ropa',
              category: { id: 3, slug: 'ropa', name: 'Ropa' },
            }),
          ],
        }),
      },
    });

    render(<HomeTab />);
    fireEvent.press(screen.getByTestId('category-tile-ropa'));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/catalog?category=ropa');
  });

  it('AC5: destacados renderizan nombre/precio y navegan a /product/<slug>', () => {
    setupQueries(
      { data: { data: makeHomeData() } },
      { data: { data: [makeProduct({ id: 301, slug: 'camisa-x', name: 'Camisa X', minPrice: 499 })] } },
    );

    render(<HomeTab />);

    expect(screen.getByText('Destacados')).toBeTruthy();
    expect(screen.getByText('Camisa X')).toBeTruthy();
    expect(screen.getByText('$499.00')).toBeTruthy();

    fireEvent.press(screen.getByTestId('product-card-camisa-x'));

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/product/camisa-x');
  });

  it('AC6: home y destacados vacíos no rompen y muestran fallback de bienvenida', () => {
    setupQueries({ data: { data: makeHomeData() } }, { data: { data: [] } });

    render(<HomeTab />);

    expect(screen.queryByTestId('home-error')).toBeNull();
    expect(screen.getByText(/101tags/)).toBeTruthy();
  });

  it('home-content como array sin placement se ignora defensivamente (no rompe)', () => {
    setupQueries(
      { data: { data: [makeHomeItem({ title: 'Sin placement' })] } },
      { data: { data: [] } },
    );

    render(<HomeTab />);

    expect(screen.queryByTestId('home-error')).toBeNull();
    expect(screen.getByText(/101tags/)).toBeTruthy();
    expect(screen.queryByText('Sin placement')).toBeNull();
  });

  it('si solo falla una query no muestra ErrorState', () => {
    setupQueries(
      { isError: true },
      { data: { data: [makeProduct({ slug: 'ok', name: 'Bien' })] } },
    );

    render(<HomeTab />);

    expect(screen.queryByTestId('home-error')).toBeNull();
    expect(screen.getByText('Bien')).toBeTruthy();
  });

  it('configura las queries con homeKeys.content y catalogKeys.products', () => {
    setupQueries();

    render(<HomeTab />);

    const keys = mockUseQuery.mock.calls.map(
      (call) => (call[0] as { queryKey: readonly unknown[] }).queryKey,
    );
    expect(keys).toEqual([
      homeKeys.content(),
      catalogKeys.products({ featured: true, perPage: 8 }),
    ]);
  });
});
