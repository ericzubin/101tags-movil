import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { ProductCard } from '@/components/catalog/ProductCard';
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

describe('ProductCard (M2.1 AC5, AC7, AC8)', () => {
  it('renderiza nombre y precio formateado en MXN', () => {
    render(<ProductCard product={makeProduct({ name: 'Camisa X', minPrice: 499 })} />);

    expect(screen.getByText('Camisa X')).toBeTruthy();
    expect(screen.getByText('$499.00')).toBeTruthy();
  });

  it('AC7: formatea el precio con separador de miles y decimales', () => {
    render(<ProductCard product={makeProduct({ minPrice: 1234.5 })} />);

    expect(screen.getByText('$1,234.50')).toBeTruthy();
  });

  it('no muestra "Sin stock" cuando el producto está disponible', () => {
    render(<ProductCard product={makeProduct({ inStock: true })} />);

    expect(screen.queryByText('Sin stock')).toBeNull();
  });

  it('AC8: muestra el badge "Sin stock" cuando el producto está agotado', () => {
    render(<ProductCard product={makeProduct({ inStock: false })} />);

    expect(screen.getByText('Sin stock')).toBeTruthy();
  });

  it('AC5: onPress recibe el producto al tocar la card', () => {
    const onPress = jest.fn();
    const product = makeProduct({ slug: 'camisa-x', name: 'Camisa X' });

    render(<ProductCard product={product} onPress={onPress} />);
    fireEvent.press(screen.getByTestId('product-card-camisa-x'));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(product);
  });
});
