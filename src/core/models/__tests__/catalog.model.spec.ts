import type {
  CatalogFilters,
  Category,
  FilterOptions,
  ProductDetail,
  ProductSummary,
  ProductVariantSummary,
  SponsoredAdItem,
} from '@/core/models/catalog.model';

describe('catalog.model', () => {
  it('AC3: ProductVariantSummary tiene priceOverride + inStock + price', () => {
    const variant: ProductVariantSummary = {
      id: 1,
      size: 'M',
      color: 'Rojo',
      sku: 'SKU-1',
      stock: 5,
      inStock: true,
      price: 199.99,
      priceOverride: 149.99,
    };
    expect(variant.priceOverride).toBe(149.99);
    expect(variant.inStock).toBe(true);
    expect(variant.price).toBe(199.99);
  });

  it('ProductSummary supports nested category + subcategory + camelCase price fields', () => {
    const product: ProductSummary = {
      id: 1,
      name: 'Camisa',
      slug: 'camisa-azul',
      supplierId: 7,
      basePrice: 199.5,
      minPrice: 149.5,
      maxPrice: 249.5,
      image: '/storage/camisa.jpg',
      images: [{ path: 'camisa-1.jpg', url: 'https://cdn/camisa-1.jpg' }],
      category: { id: 1, name: 'Ropa', slug: 'ropa' },
      subcategory: { slug: 'camisas', name: 'Camisas' },
      isFeatured: true,
      inStock: true,
      totalStock: 12,
      availableSizes: ['S', 'M', 'L'],
      availableColors: ['Rojo', 'Azul'],
    };
    expect(product.basePrice).toBe(199.5);
    expect(product.isFeatured).toBe(true);
    expect(product.availableSizes).toEqual(['S', 'M', 'L']);
    expect(product.category.slug).toBe('ropa');
  });

  it('ProductDetail extends ProductSummary con description + variants', () => {
    const detail: ProductDetail = {
      id: 1,
      name: 'Camisa',
      slug: 'camisa',
      supplierId: null,
      basePrice: 100,
      minPrice: 100,
      maxPrice: 100,
      image: null,
      images: [],
      category: { id: 1, name: 'Ropa', slug: 'ropa' },
      subcategory: null,
      isFeatured: false,
      inStock: true,
      totalStock: 0,
      availableSizes: [],
      availableColors: [],
      description: 'Camisa de prueba',
      variants: [],
    };
    expect(detail.description).toBe('Camisa de prueba');
    expect(detail.variants).toEqual([]);
  });

  it('AC4: FilterOptions tiene sizes, colors, priceMin, priceMax, categories, subcategories', () => {
    const options: FilterOptions = {
      sizes: ['S', 'M'],
      colors: ['Rojo'],
      priceMin: 50,
      priceMax: 500,
      categories: [{ slug: 'ropa', name: 'Ropa', count: 25 }],
      subcategories: [{ slug: 'camisas', name: 'Camisas', count: 10, categorySlug: 'ropa' }],
    };
    expect(options.sizes).toEqual(['S', 'M']);
    expect(options.priceMin).toBe(50);
    expect(options.priceMax).toBe(500);
    expect(options.categories[0].slug).toBe('ropa');
    expect(options.subcategories[0].categorySlug).toBe('ropa');
  });

  it('Category supports optional children, imageUrl null, segment union type', () => {
    const cat: Category = {
      id: 1,
      name: 'Ropa',
      slug: 'ropa',
      segment: 'basicos',
      description: null,
      imageUrl: null,
      productsCount: 0,
      children: [{ id: 2, name: 'Camisas', slug: 'camisas', productsCount: 5 }],
    };
    expect(cat.segment).toBe('basicos');
    expect(cat.children?.[0].slug).toBe('camisas');
  });

  it('CatalogFilters accepts each documented field with correct type', () => {
    const filters: CatalogFilters = {
      q: 'camisa',
      category: ['ropa'],
      sizes: ['M'],
      priceMin: 100,
      featured: true,
      inStock: true,
      sort: 'price_asc',
      page: 1,
    };
    expect(filters.q).toBe('camisa');
    expect(filters.sort).toBe('price_asc');
  });

  it('SponsoredAdItem wraps ProductSummary with adId, title, placement', () => {
    const ad: SponsoredAdItem = {
      adId: 1,
      title: 'Sponsored',
      placement: 'home',
      product: {
        id: 1,
        name: 'X',
        slug: 'x',
        supplierId: null,
        basePrice: 10,
        minPrice: 10,
        maxPrice: 10,
        image: null,
        images: [],
        category: { id: 1, name: 'A', slug: 'a' },
        subcategory: null,
        isFeatured: false,
        inStock: true,
        totalStock: 0,
        availableSizes: [],
        availableColors: [],
      },
    };
    expect(ad.placement).toBe('home');
    expect(ad.product.slug).toBe('x');
  });
});
