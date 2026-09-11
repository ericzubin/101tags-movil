import type { CartItem, CartResponse } from '@/core/models/cart.model';
import { toCamel } from '@/core/utils/snake-camel';

const rawBackendItem = {
  variant_id: 5,
  product_id: 1,
  supplier_id: 2,
  product_name: 'Playera Negra',
  product_slug: 'playera-negra',
  size: 'M',
  color: 'Negro',
  sku: 'P-M-N',
  price: 80,
  stock: 10,
  quantity: 2,
  image: '/storage/playera.jpg',
  line_total: 160,
};

describe('cart.model', () => {
  it('CartItem expone los campos camelCase del contrato del backend (snake → toCamel)', () => {
    const item = toCamel<CartItem>(rawBackendItem);

    expect(item.variantId).toBe(5);
    expect(item.productId).toBe(1);
    expect(item.supplierId).toBe(2);
    expect(item.productName).toBe('Playera Negra');
    expect(item.productSlug).toBe('playera-negra');
    expect(item.size).toBe('M');
    expect(item.color).toBe('Negro');
    expect(item.sku).toBe('P-M-N');
    expect(item.price).toBe(80);
    expect(item.stock).toBe(10);
    expect(item.quantity).toBe(2);
    expect(item.image).toBe('/storage/playera.jpg');
    expect(item.lineTotal).toBe(160);
  });

  it('CartItem acepta null en supplierId, size, color e image', () => {
    const item: CartItem = {
      variantId: 7,
      productId: 2,
      supplierId: null,
      productName: 'Producto único',
      productSlug: 'producto-unico',
      size: null,
      color: null,
      sku: 'U-1',
      price: 100,
      stock: 0,
      quantity: 1,
      image: null,
      lineTotal: 100,
    };

    expect(item.supplierId).toBeNull();
    expect(item.size).toBeNull();
    expect(item.color).toBeNull();
    expect(item.image).toBeNull();
  });

  it('CartResponse envuelve items en `{ items }`', () => {
    const response: CartResponse = {
      items: [toCamel<CartItem>(rawBackendItem)],
    };

    expect(response.items).toHaveLength(1);
    expect(response.items[0].variantId).toBe(5);
  });
});
