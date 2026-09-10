import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { HttpError } from '@/core/api/client';
import type { ProductDetail } from '@/core/models/catalog.model';

import ProductDetailScreen from '../[slug]';

const mockRefetch = jest.fn();
const mockReplace = jest.fn();

let mockQueryState: {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  data: ProductDetail | undefined;
};

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ ...mockQueryState, refetch: mockRefetch }),
}));

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLib = require('react');
  const MockStack = (props: { children?: unknown }) =>
    ReactLib.createElement(ReactLib.Fragment, null, props.children);
  MockStack.displayName = 'Stack';
  const MockStackScreen = () => null;
  MockStackScreen.displayName = 'StackScreen';
  (MockStack as unknown as Record<string, unknown>).Screen = MockStackScreen;
  return {
    Stack: MockStack,
    router: {
      replace: (...args: unknown[]) => mockReplace(...args),
      push: jest.fn(),
      back: jest.fn(),
    },
    useLocalSearchParams: () => ({ slug: 'playera' }),
    useRouter: () => ({ replace: (...args: unknown[]) => mockReplace(...args) }),
  };
});

jest.mock('@/core/services/catalog-service', () => ({
  catalogService: { getProductBySlug: jest.fn() },
}));

const baseProduct: ProductDetail = {
  id: 1,
  name: 'Playera Negra',
  slug: 'playera',
  supplierId: null,
  basePrice: 100,
  minPrice: 100,
  maxPrice: 150,
  image: '/storage/main.jpg',
  images: [
    { path: '/storage/p1.jpg', url: '/storage/p1.jpg' },
    { path: '/storage/p2.jpg', url: '/storage/p2.jpg' },
    { path: '/storage/p3.jpg', url: '/storage/p3.jpg' },
  ],
  category: { id: 1, name: 'Básicos', slug: 'basicos' },
  subcategory: null,
  isFeatured: false,
  inStock: true,
  totalStock: 8,
  availableSizes: ['S', 'M'],
  availableColors: ['Negro', 'Blanco'],
  description: 'Playera de algodón',
  variants: [
    {
      id: 1,
      size: 'S',
      color: 'Negro',
      sku: 'P-S-N',
      stock: 3,
      inStock: true,
      price: 100,
      priceOverride: null,
    },
    {
      id: 2,
      size: 'M',
      color: 'Blanco',
      sku: 'P-M-B',
      stock: 5,
      inStock: true,
      price: 100,
      priceOverride: 120,
    },
  ],
};

const singleOptionProduct: ProductDetail = {
  ...baseProduct,
  name: 'Producto Único',
  minPrice: 80,
  maxPrice: 80,
  availableSizes: ['Única'],
  availableColors: ['Rojo'],
  variants: [
    {
      id: 10,
      size: 'Única',
      color: 'Rojo',
      sku: 'U-R',
      stock: 3,
      inStock: true,
      price: 80,
      priceOverride: null,
    },
  ],
};

describe('ProductDetailScreen — estados (M2.4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryState = { isLoading: false, isError: false, error: null, data: undefined };
  });

  it('AC1: loading muestra el skeleton del detalle', () => {
    mockQueryState = { isLoading: true, isError: false, error: null, data: undefined };
    render(<ProductDetailScreen />);
    expect(screen.getByTestId('detail-skeleton')).toBeTruthy();
  });

  it('AC2: error genérico muestra ErrorState y reintenta', () => {
    mockQueryState = { isLoading: false, isError: true, error: new Error('boom'), data: undefined };
    render(<ProductDetailScreen />);
    expect(screen.getByTestId('error-state')).toBeTruthy();
    fireEvent.press(screen.getByTestId('error-state-retry'));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('AC3: HttpError 404 muestra "Producto no encontrado" y vuelve al catálogo', () => {
    mockQueryState = {
      isLoading: false,
      isError: true,
      error: new HttpError(404, 'Not Found', null, 'HTTP 404 Not Found'),
      data: undefined,
    };
    render(<ProductDetailScreen />);
    expect(screen.getByText('Producto no encontrado')).toBeTruthy();
    fireEvent.press(screen.getByTestId('product-not-found-button'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/catalog');
  });

  it('AC4 + AC6: preselecciona talla/color únicos, habilita AddToCart y muestra hint de stock', async () => {
    mockQueryState = { isLoading: false, isError: false, error: null, data: singleOptionProduct };
    render(<ProductDetailScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('variant-size-Única').props.accessibilityState).toMatchObject({
        selected: true,
      });
    });
    expect(screen.getByTestId('variant-color-Rojo').props.accessibilityState).toMatchObject({
      selected: true,
    });
    await waitFor(() => {
      expect(screen.getByTestId('add-to-cart').props.accessibilityState).toMatchObject({
        disabled: false,
      });
    });
    expect(screen.getByText('Quedan 3')).toBeTruthy();
    expect(screen.getByTestId('gallery-indicator').props.children).toBe('1/3');
  });

  it('AC8: sin variante seleccionada AddToCart queda deshabilitado', () => {
    mockQueryState = { isLoading: false, isError: false, error: null, data: baseProduct };
    render(<ProductDetailScreen />);
    expect(screen.getByTestId('add-to-cart').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('AC9: con variante válida el tap muestra el placeholder de F3', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockQueryState = { isLoading: false, isError: false, error: null, data: singleOptionProduct };
    render(<ProductDetailScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('add-to-cart').props.accessibilityState).toMatchObject({
        disabled: false,
      });
    });
    fireEvent.press(screen.getByTestId('add-to-cart'));
    expect(alertSpy).toHaveBeenCalledWith('Carrito', 'El carrito llega en la Fase 3.');
    alertSpy.mockRestore();
  });

  it('AC11: variante con stock bajo muestra "Quedan N" y precio de la variante', async () => {
    mockQueryState = { isLoading: false, isError: false, error: null, data: singleOptionProduct };
    render(<ProductDetailScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('stock-hint')).toBeTruthy();
    });
    expect(screen.getByTestId('product-price').props.children).toBe('$80.00');
  });
});
