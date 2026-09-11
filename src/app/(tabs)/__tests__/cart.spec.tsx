import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import type { CartItem } from '@/core/models/cart.model';

import CartTab from '../cart';

const mockFetchCart = jest.fn().mockResolvedValue(undefined);
const mockUpdateItem = jest.fn().mockResolvedValue(undefined);
const mockRemoveItem = jest.fn().mockResolvedValue(undefined);
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  router: { push: mockPush, replace: jest.fn(), back: jest.fn() },
}));

let mockState: {
  items: CartItem[];
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  fetchCart: jest.Mock;
  updateItem: jest.Mock;
  removeItem: jest.Mock;
};

jest.mock('@/stores/cart-store', () => {
  const actual = jest.requireActual('@/stores/cart-store');
  return {
    ...actual,
    useCartStore: (selector: (s: typeof mockState) => unknown) => selector(mockState),
  };
});

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    variantId: 5,
    productId: 1,
    supplierId: null,
    productName: 'Playera Negra',
    productSlug: 'playera-negra',
    size: 'M',
    color: 'Negro',
    sku: 'P-M-N',
    price: 80,
    stock: 5,
    quantity: 2,
    image: null,
    lineTotal: 160,
    ...overrides,
  };
}

describe('CartTab — pantalla de carrito (M3.1 AC6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      items: [],
      status: 'idle',
      error: null,
      fetchCart: mockFetchCart,
      updateItem: mockUpdateItem,
      removeItem: mockRemoveItem,
    };
  });

  it('monta y dispara fetchCart() una vez', () => {
    render(<CartTab />);
    expect(mockFetchCart).toHaveBeenCalledTimes(1);
  });

  it('AC6: status loading muestra el skeleton del carrito', () => {
    mockState.status = 'loading';
    render(<CartTab />);
    expect(screen.getByTestId('cart-skeleton')).toBeTruthy();
  });

  it('AC6: status error muestra ErrorState y reintenta con fetchCart', () => {
    mockState.status = 'error';
    mockState.error = 'boom';
    render(<CartTab />);

    expect(screen.getByTestId('cart-error')).toBeTruthy();
    fireEvent.press(screen.getByTestId('cart-error-retry'));
    expect(mockFetchCart).toHaveBeenCalledTimes(2);
  });

  it('AC6: carrito vacío muestra EmptyState "Tu carrito está vacío"', () => {
    mockState.status = 'idle';
    render(<CartTab />);
    expect(screen.getByTestId('cart-empty')).toBeTruthy();
    expect(screen.getByText('Tu carrito está vacío')).toBeTruthy();
  });

  it('AC6: lista item con nombre, variante, cantidad, subtotal y total', () => {
    mockState.items = [makeItem()];
    render(<CartTab />);

    expect(screen.getByTestId('cart-item-5')).toBeTruthy();
    expect(screen.getByText('Playera Negra')).toBeTruthy();
    expect(screen.getByText('M · Negro')).toBeTruthy();
    expect(screen.getByTestId('qty-value').props.children).toBe(2);
    expect(screen.getByTestId('cart-line-total-5').props.children).toBe('$160.00');
    expect(screen.getByTestId('cart-total-value').props.children).toBe('$160.00');
    expect(screen.getByText('Total (2 artículos)')).toBeTruthy();
  });

  it('AC6: incrementar cantidad llama updateItem(variantId, qty+1)', () => {
    mockState.items = [makeItem()];
    render(<CartTab />);

    fireEvent.press(screen.getByTestId('qty-increment'));
    expect(mockUpdateItem).toHaveBeenCalledWith(5, 3);
  });

  it('AC6: decrementar cantidad llama updateItem(variantId, qty-1)', () => {
    mockState.items = [makeItem()];
    render(<CartTab />);

    fireEvent.press(screen.getByTestId('qty-decrement'));
    expect(mockUpdateItem).toHaveBeenCalledWith(5, 1);
  });

  it('AC6: quitar llama removeItem(variantId)', () => {
    mockState.items = [makeItem()];
    render(<CartTab />);

    fireEvent.press(screen.getByTestId('cart-remove-5'));
    expect(mockRemoveItem).toHaveBeenCalledWith(5);
  });

  it('AC6: con varios items renderiza una fila por item', () => {
    mockState.items = [makeItem(), makeItem({ variantId: 6, productName: 'Taza', lineTotal: 100, price: 100, quantity: 1 })];
    render(<CartTab />);

    expect(screen.getByTestId('cart-item-5')).toBeTruthy();
    expect(screen.getByTestId('cart-item-6')).toBeTruthy();
    expect(screen.getByTestId('cart-total-value').props.children).toBe('$260.00');
  });

  it('M3.2: "Continuar" navega a /checkout/address', () => {
    mockState.items = [makeItem()];
    render(<CartTab />);

    fireEvent.press(screen.getByTestId('cart-continue'));
    expect(mockPush).toHaveBeenCalledWith('/checkout/address');
  });
});
