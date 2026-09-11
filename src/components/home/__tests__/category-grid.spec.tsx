import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Dimensions } from 'react-native';

import { CategoryGrid } from '@/components/home/CategoryGrid';
import type { HomeContentItem } from '@/core/models/home-content.model';

function makeItem(overrides: Partial<HomeContentItem> = {}): HomeContentItem {
  return {
    id: 1,
    placement: 'featured_category',
    type: 'image',
    image: '/storage/home/category-1.jpg',
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

describe('CategoryGrid (M2.1 AC4)', () => {
  it('renderiza un tile por categoría con el título', () => {
    render(
      <CategoryGrid
        items={[
          makeItem({
            id: 11,
            title: 'Ropa',
            category: { id: 3, slug: 'ropa', name: 'Ropa' },
          }),
          makeItem({
            id: 12,
            category: { id: 4, slug: 'calzado', name: 'Calzado' },
          }),
        ]}
        onSelect={jest.fn()}
      />,
    );

    expect(screen.getAllByTestId(/^category-tile-/)).toHaveLength(2);
    expect(screen.getByText('Ropa')).toBeTruthy();
    expect(screen.getByText('Calzado')).toBeTruthy();
  });

  it('AC4: al tocar un tile llama onSelect con el slug de la categoría', () => {
    const onSelect = jest.fn();
    render(
      <CategoryGrid
        items={[
          makeItem({
            id: 21,
            title: 'Ropa',
            category: { id: 3, slug: 'ropa', name: 'Ropa' },
          }),
        ]}
        onSelect={onSelect}
      />,
    );

    fireEvent.press(screen.getByTestId('category-tile-ropa'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('ropa');
  });

  it('sin items no renderiza nada', () => {
    render(<CategoryGrid items={[]} onSelect={jest.fn()} />);

    expect(screen.queryByTestId('category-grid')).toBeNull();
  });

  it('AC5: reacciona a cambios de ancho de ventana (useWindowDimensions)', () => {
    const original = Dimensions.get('window');
    render(
      <CategoryGrid
        items={[
          makeItem({
            id: 31,
            title: 'Ropa',
            category: { id: 3, slug: 'ropa', name: 'Ropa' },
          }),
        ]}
        onSelect={jest.fn()}
      />,
    );

    expect(screen.getByTestId('category-tile-ropa')).toBeTruthy();
    expect(screen.getByTestId('expo-image').props.style.width).toBe(
      Math.floor(original.width / 2) - 16,
    );

    act(() => {
      Dimensions.set({
        window: { width: 400, height: 800, scale: 1, fontScale: 1 },
        screen: { width: 400, height: 800, scale: 1, fontScale: 1 },
      });
    });

    expect(screen.getByTestId('expo-image').props.style.width).toBe(184);

    act(() => {
      Dimensions.set({ window: original, screen: original });
    });
  });
});
