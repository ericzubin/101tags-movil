import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { FeaturedProductsRow } from '@/components/home/FeaturedProductsRow';
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

describe('FeaturedProductsRow (M2.1 AC5)', () => {
  it('muestra el título "Destacados" y una card por producto', () => {
    render(
      <FeaturedProductsRow
        products={[
          makeProduct({ id: 1, name: 'Camisa X', slug: 'camisa-x' }),
          makeProduct({ id: 2, name: 'Pantalón Y', slug: 'pantalon-y' }),
        ]}
        onSelectProduct={jest.fn()}
      />,
    );

    expect(screen.getByText('Destacados')).toBeTruthy();
    expect(screen.getByTestId('product-card-camisa-x')).toBeTruthy();
    expect(screen.getByTestId('product-card-pantalon-y')).toBeTruthy();
    expect(screen.getByText('Camisa X')).toBeTruthy();
    expect(screen.getByText('Pantalón Y')).toBeTruthy();
  });

  it('sin productos muestra el mensaje de próximamente', () => {
    render(<FeaturedProductsRow products={[]} onSelectProduct={jest.fn()} />);

    expect(screen.getByText('Pronto habrá productos destacados')).toBeTruthy();
    expect(screen.queryByText('Destacados')).toBeTruthy();
  });

  it('AC5: al tocar una card llama onSelectProduct con el producto', () => {
    const onSelectProduct = jest.fn();
    const product = makeProduct({ id: 3, name: 'Camisa X', slug: 'camisa-x' });

    render(<FeaturedProductsRow products={[product]} onSelectProduct={onSelectProduct} />);
    fireEvent.press(screen.getByTestId('product-card-camisa-x'));

    expect(onSelectProduct).toHaveBeenCalledTimes(1);
    expect(onSelectProduct).toHaveBeenCalledWith(product);
  });
});
