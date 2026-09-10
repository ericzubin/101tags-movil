import { fireEvent, render, screen } from '@testing-library/react-native';

import { ProductGallery } from '@/components/product/ProductGallery';

const images = [
  { path: '/storage/p1.jpg', url: '/storage/p1.jpg' },
  { path: '/storage/p2.jpg', url: '/storage/p2.jpg' },
  { path: '/storage/p3.jpg', url: '/storage/p3.jpg' },
];

describe('ProductGallery', () => {
  it('renderiza N imágenes', () => {
    render(<ProductGallery images={images} width={300} />);
    expect(screen.getAllByTestId(/^gallery-image-/)).toHaveLength(3);
  });

  it('indicador inicial es "1/N"', () => {
    render(<ProductGallery images={images} width={300} />);
    expect(screen.getByTestId('gallery-indicator').props.children).toBe('1/3');
  });

  it('actualiza el indicador al terminar el scroll', () => {
    render(<ProductGallery images={images} width={300} />);
    fireEvent(screen.getByTestId('gallery-scroll'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 600 } },
    });
    expect(screen.getByTestId('gallery-indicator').props.children).toBe('3/3');
  });

  it('sin imágenes muestra placeholder y no indicador', () => {
    render(<ProductGallery images={[]} width={300} />);
    expect(screen.getByTestId('gallery-placeholder')).toBeTruthy();
    expect(screen.queryByTestId('gallery-indicator')).toBeNull();
  });

  it('usa la imagen principal como fallback si images viene vacío', () => {
    render(<ProductGallery images={[]} fallbackImage="/storage/main.jpg" width={300} />);
    expect(screen.getByTestId('gallery-image-0')).toBeTruthy();
    expect(screen.getByTestId('gallery-indicator').props.children).toBe('1/1');
  });
});
