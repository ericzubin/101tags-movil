import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { CategoryTree } from '@/components/catalog/CategoryTree';
import type { Category } from '@/core/models/catalog.model';

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

describe('CategoryTree (M2.2)', () => {
  it('renderiza las raíces con conteo de productos y chevron si tienen hijos', () => {
    render(<CategoryTree categories={[ROPA, ACCESORIOS]} onSelect={jest.fn()} />);

    expect(screen.getByText('Ropa')).toBeTruthy();
    expect(screen.getByText('Accesorios')).toBeTruthy();
    expect(screen.getByText('20 productos')).toBeTruthy();
    expect(screen.getByText('5 productos')).toBeTruthy();
    expect(screen.getByText('chevron-forward')).toBeTruthy();
  });

  it('expande y colapsa los hijos al tocar una raíz con hijos', () => {
    render(<CategoryTree categories={[ROPA]} onSelect={jest.fn()} />);

    expect(screen.queryByTestId('category-children-ropa')).toBeNull();

    fireEvent.press(screen.getByTestId('category-ropa'));

    expect(screen.getByTestId('category-children-ropa')).toBeTruthy();
    expect(screen.getByText('Playeras')).toBeTruthy();
    expect(screen.getByText('Pantalones')).toBeTruthy();
    expect(screen.getByText('chevron-down')).toBeTruthy();

    fireEvent.press(screen.getByTestId('category-ropa'));

    expect(screen.queryByTestId('category-children-ropa')).toBeNull();
    expect(screen.queryByText('Playeras')).toBeNull();
  });

  it('tap en raíz sin hijos selecciona con kind category', () => {
    const onSelect = jest.fn();

    render(<CategoryTree categories={[ACCESORIOS]} onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId('category-accesorios'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith({
      slug: 'accesorios',
      name: 'Accesorios',
      kind: 'category',
    });
  });

  it('tap en subcategoría selecciona con kind subcategory', () => {
    const onSelect = jest.fn();

    render(<CategoryTree categories={[ROPA]} onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId('category-ropa'));
    fireEvent.press(screen.getByTestId('subcategory-playeras'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith({
      slug: 'playeras',
      name: 'Playeras',
      kind: 'subcategory',
    });
  });

  it('long-press en raíz con hijos selecciona la raíz (ver todos)', () => {
    const onSelect = jest.fn();

    render(<CategoryTree categories={[ROPA]} onSelect={onSelect} />);
    fireEvent(screen.getByTestId('category-ropa'), 'longPress');

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith({ slug: 'ropa', name: 'Ropa', kind: 'category' });
  });
});
