import { catalogService } from '@/core/services/catalog-service';
import { httpClient } from '@/core/api/client';

jest.mock('@/core/api/client', () => {
  const actual = jest.requireActual('@/core/api/client');
  return {
    ...actual,
    httpClient: {
      request: jest.fn(),
    },
  };
});

const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('catalogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AC15: getCategories(segment) llama GET /catalog/categories?segment=industrial', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ data: [] });

    await catalogService.getCategories('industrial');

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/catalog/categories');
    expect(options?.method).toBe('GET');
    expect(options?.query).toEqual({ segment: 'industrial' });
  });

  it('getCategories() default segment = basicos', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ data: [] });

    await catalogService.getCategories();

    const [, options] = mockedHttpClient.request.mock.calls[0];
    expect(options?.query).toEqual({ segment: 'basicos' });
  });

  it('AC16: getProducts({q,sort}) llama GET /catalog/products?q=...&sort=price_asc (sort snake_case)', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({
      data: [],
      meta: {
        current_page: 1,
        from: null,
        last_page: 1,
        per_page: 20,
        to: null,
        total: 0,
      },
      links: {
        first_page_url: '',
        last_page_url: '',
        next_page_url: null,
        prev_page_url: null,
        path: '',
        links: [],
      },
    });

    await catalogService.getProducts({ q: 'camisa', sort: 'price_asc' });

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/catalog/products');
    expect(options?.query).toEqual({ q: 'camisa', sort: 'price_asc' });
  });

  it('AC17: getProducts({category: ["ropa","calzado"]}) serializa CSV en single key', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({
      data: [],
      meta: {
        current_page: 1,
        from: null,
        last_page: 1,
        per_page: 20,
        to: null,
        total: 0,
      },
      links: {
        first_page_url: '',
        last_page_url: '',
        next_page_url: null,
        prev_page_url: null,
        path: '',
        links: [],
      },
    });

    await catalogService.getProducts({ category: ['ropa', 'calzado'] });

    const [, options] = mockedHttpClient.request.mock.calls[0];
    expect(options?.query).toEqual({ category: 'ropa,calzado' });
  });

  it('AC18: getProductBySlug("camisa-x") llama a /catalog/products/camisa-x (URL-encoded si necesario)', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({
      id: 1,
      name: 'X',
      slug: 'camisa-x',
      supplierId: null,
      basePrice: 1,
      minPrice: 1,
      maxPrice: 1,
      image: null,
      images: [],
      category: { id: 1, name: 'A', slug: 'a' },
      subcategory: null,
      isFeatured: false,
      inStock: true,
      totalStock: 0,
      availableSizes: [],
      availableColors: [],
      description: null,
      variants: [],
    });

    await catalogService.getProductBySlug('camisa-x');

    const [path] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/catalog/products/camisa-x');
  });

  it('getProductBySlug encoda caracteres especiales', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({
      id: 1,
      name: 'X',
      slug: 'camisa azul',
      supplierId: null,
      basePrice: 1,
      minPrice: 1,
      maxPrice: 1,
      image: null,
      images: [],
      category: { id: 1, name: 'A', slug: 'a' },
      subcategory: null,
      isFeatured: false,
      inStock: true,
      totalStock: 0,
      availableSizes: [],
      availableColors: [],
      description: null,
      variants: [],
    });

    await catalogService.getProductBySlug('camisa azul');

    const [path] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/catalog/products/camisa%20azul');
  });

  it('AC19: getSponsoredAds() llama GET /catalog/sponsored-ads con query snake_case record_impressions', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ data: [] });

    await catalogService.getSponsoredAds();

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/catalog/sponsored-ads');
    expect(options?.query).toEqual({ record_impressions: '0' });
    expect((options?.query as Record<string, string>).record_impressions).toBe('0');
  });

  it('getFilters(segment, category) llama GET /catalog/filters?segment=...&category=...', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({
      sizes: [],
      colors: [],
      priceMin: 0,
      priceMax: 0,
      categories: [],
      subcategories: [],
    });

    await catalogService.getFilters('industrial', 'ropa');

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/catalog/filters');
    expect(options?.query).toEqual({ segment: 'industrial', category: 'ropa' });
  });

  it('serializeFilters convierte booleanos a 1/0 y snake_case campos snake', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({
      data: [],
      meta: {
        current_page: 1,
        from: null,
        last_page: 1,
        per_page: 20,
        to: null,
        total: 0,
      },
      links: {
        first_page_url: '',
        last_page_url: '',
        next_page_url: null,
        prev_page_url: null,
        path: '',
        links: [],
      },
    });

    await catalogService.getProducts({
      supplierId: 5,
      featured: true,
      inStock: false,
      onSale: true,
      priceMin: 10,
      priceMax: 100,
      perPage: 20,
      page: 2,
    });

    const [, options] = mockedHttpClient.request.mock.calls[0];
    expect(options?.query).toEqual({
      supplier_id: 5,
      featured: '1',
      in_stock: '0',
      on_sale: '1',
      price_min: 10,
      price_max: 100,
      per_page: 20,
      page: 2,
    });
  });
});
