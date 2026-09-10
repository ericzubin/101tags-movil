import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { ProductGrid } from '@/components/catalog/ProductGrid';
import type { ProductSummary } from '@/core/models/catalog.model';

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

describe('ProductGrid (M2.2)', () => {
  it('renderiza una card por producto', () => {
    render(
      <ProductGrid
        products={[
          makeProduct({ id: 1, slug: 'camisa-x', name: 'Camisa X' }),
          makeProduct({ id: 2, slug: 'pantalon-y', name: 'Pantalón Y' }),
          makeProduct({ id: 3, slug: 'gorra-z', name: 'Gorra Z' }),
        ]}
        onSelectProduct={jest.fn()}
      />,
    );

    expect(screen.getByTestId('product-grid')).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByTestId('product-card-camisa-x')).toBeTruthy();
    expect(screen.getByTestId('product-card-pantalon-y')).toBeTruthy();
    expect(screen.getByTestId('product-card-gorra-z')).toBeTruthy();
  });

  it('tap en una card llama onSelectProduct con el producto', () => {
    const onSelectProduct = jest.fn();
    const product = makeProduct({ slug: 'camisa-x', name: 'Camisa X' });

    render(<ProductGrid products={[product]} onSelectProduct={onSelectProduct} />);
    fireEvent.press(screen.getByTestId('product-card-camisa-x'));

    expect(onSelectProduct).toHaveBeenCalledTimes(1);
    expect(onSelectProduct).toHaveBeenCalledWith(product);
  });
});
