import { httpClient } from '@/core/api/client';
import { cartService } from '@/core/services/cart-service';

import type { CartResponse } from '@/core/models/cart.model';

jest.mock('@/core/api/client', () => {
  const actual = jest.requireActual('@/core/api/client');
  return {
    ...actual,
    httpClient: {
      request: jest.fn(),
    },
  };
});

const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

const emptyCart: CartResponse = { items: [] };

describe('cartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AC1: getCart() llama GET /cart', async () => {
    mockedHttpClient.request.mockResolvedValueOnce(emptyCart);

    const result = await cartService.getCart();

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/cart');
    expect(options?.method).toBe('GET');
    expect(result).toEqual(emptyCart);
  });

  it('AC2: sync([{variant_id:5,quantity:2}]) llama POST /cart/sync con body `{ items }`', async () => {
    mockedHttpClient.request.mockResolvedValueOnce(emptyCart);

    const result = await cartService.sync([{ variant_id: 5, quantity: 2 }]);

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/cart/sync');
    expect(options?.method).toBe('POST');
    expect(options?.body).toEqual({ items: [{ variant_id: 5, quantity: 2 }] });
    expect(result).toEqual(emptyCart);
  });

  it('AC3a: updateItem(5,3) llama PUT /cart/items con body `{ variant_id, quantity }`', async () => {
    mockedHttpClient.request.mockResolvedValueOnce(emptyCart);

    const result = await cartService.updateItem(5, 3);

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/cart/items');
    expect(options?.method).toBe('PUT');
    expect(options?.body).toEqual({ variant_id: 5, quantity: 3 });
    expect(result).toEqual(emptyCart);
  });

  it('AC3b: updateItem(5,0) envía quantity 0 (elimina en backend)', async () => {
    mockedHttpClient.request.mockResolvedValueOnce(emptyCart);

    await cartService.updateItem(5, 0);

    const [, options] = mockedHttpClient.request.mock.calls[0];
    expect(options?.body).toEqual({ variant_id: 5, quantity: 0 });
  });

  it('AC3c: removeItem(5) llama DELETE /cart/items/5', async () => {
    mockedHttpClient.request.mockResolvedValueOnce(emptyCart);

    const result = await cartService.removeItem(5);

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/cart/items/5');
    expect(options?.method).toBe('DELETE');
    expect(result).toEqual(emptyCart);
  });
});
