import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';

import { HeroCarousel } from '@/components/home/HeroCarousel';
import type { HomeContentItem } from '@/core/models/home-content.model';

function makeItem(overrides: Partial<HomeContentItem> = {}): HomeContentItem {
  return {
    id: 1,
    placement: 'hero',
    type: 'image',
    image: '/storage/home/hero-1.jpg',
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

describe('HeroCarousel (M2.1 AC3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AC3: renderiza un item por cada entrada con su título y subtítulo', () => {
    render(
      <HeroCarousel
        items={[
          makeItem({ id: 1, title: 'Verano', subtitle: 'Nueva colección' }),
          makeItem({ id: 2, title: 'Invierno' }),
        ]}
      />,
    );

    expect(screen.getAllByTestId(/^hero-item-/)).toHaveLength(2);
    expect(screen.getByText('Verano')).toBeTruthy();
    expect(screen.getByText('Nueva colección')).toBeTruthy();
    expect(screen.getByText('Invierno')).toBeTruthy();
  });

  it('sin items no renderiza nada', () => {
    render(<HeroCarousel items={[]} />);

    expect(screen.queryByTestId('hero-carousel')).toBeNull();
  });

  it('navega cuando el link es una ruta interna', () => {
    render(<HeroCarousel items={[makeItem({ id: 5, link: '/product/camisa-x' })]} />);

    fireEvent.press(screen.getByTestId('hero-item-5'));

    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/product/camisa-x');
  });

  it('no navega para links de /tienda ni links externos', () => {
    render(
      <HeroCarousel
        items={[
          makeItem({ id: 6, link: '/tienda/promociones' }),
          makeItem({ id: 7, link: 'https://example.com/promo' }),
        ]}
      />,
    );

    fireEvent.press(screen.getByTestId('hero-item-6'));
    fireEvent.press(screen.getByTestId('hero-item-7'));

    expect(router.push).not.toHaveBeenCalled();
  });
});
