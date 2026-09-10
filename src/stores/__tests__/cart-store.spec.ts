import type { CartItem, CartResponse } from '@/core/models/cart.model';
import { cartService } from '@/core/services/cart-service';
import { selectTotalCount, selectTotalPrice, useCartStore } from '@/stores/cart-store';

jest.mock('@/core/services/cart-service', () => ({
  cartService: {
    getCart: jest.fn(),
    sync: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

const mockedCartService = cartService as jest.Mocked<typeof cartService>;

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
    stock: 10,
    quantity: 1,
    image: null,
    lineTotal: 80,
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('cart-store', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useCartStore.setState({ items: [], status: 'idle', error: null });
  });

  it('estado inicial: items vacío, status idle, error null', () => {
    const s = useCartStore.getState();
    expect(s.items).toEqual([]);
    expect(s.status).toBe('idle');
    expect(s.error).toBeNull();
  });

  it('AC1: fetchCart() llama getCart, guarda items y deja status idle', async () => {
    const items = [makeItem(), makeItem({ variantId: 6 })];
    mockedCartService.getCart.mockResolvedValueOnce({ items });

    await useCartStore.getState().fetchCart();

    expect(mockedCartService.getCart).toHaveBeenCalledTimes(1);
    const s = useCartStore.getState();
    expect(s.items).toEqual(items);
    expect(s.status).toBe('idle');
    expect(s.error).toBeNull();
  });

  it('fetchCart() expone status loading mientras está en vuelo', async () => {
    const d = deferred<CartResponse>();
    mockedCartService.getCart.mockReturnValueOnce(d.promise);

    const promise = useCartStore.getState().fetchCart();
    expect(useCartStore.getState().status).toBe('loading');

    d.resolve({ items: [makeItem()] });
    await promise;
    expect(useCartStore.getState().status).toBe('idle');
  });

  it('fetchCart() ante error deja status error y guarda el mensaje', async () => {
    mockedCartService.getCart.mockRejectedValueOnce(new Error('boom'));

    await useCartStore.getState().fetchCart();

    const s = useCartStore.getState();
    expect(s.status).toBe('error');
    expect(s.error).toBe('boom');
  });

  it('AC2: addItem(variante desconocida) usa POST /cart/sync y refleja la respuesta', async () => {
    const added = makeItem({ variantId: 5, quantity: 2, lineTotal: 160 });
    mockedCartService.sync.mockResolvedValueOnce({ items: [added] });

    await useCartStore.getState().addItem(5, 2);

    expect(mockedCartService.sync).toHaveBeenCalledWith([{ variant_id: 5, quantity: 2 }]);
    const s = useCartStore.getState();
    expect(s.items).toEqual([added]);
    expect(s.status).toBe('idle');
  });

  it('addItem(variante desconocida) default quantity = 1', async () => {
    mockedCartService.sync.mockResolvedValueOnce({ items: [makeItem({ quantity: 1 })] });

    await useCartStore.getState().addItem(5);

    expect(mockedCartService.sync).toHaveBeenCalledWith([{ variant_id: 5, quantity: 1 }]);
  });

  it('addItem(variante existente) incrementa optimista y luego persiste con updateItem', async () => {
    useCartStore.setState({ items: [makeItem({ quantity: 1, stock: 5, lineTotal: 80 })] });
    const d = deferred<CartResponse>();
    mockedCartService.updateItem.mockReturnValueOnce(d.promise);

    const promise = useCartStore.getState().addItem(5, 2);

    const optimistic = useCartStore.getState().items[0];
    expect(optimistic.quantity).toBe(3);
    expect(optimistic.lineTotal).toBe(240);

    d.resolve({ items: [makeItem({ quantity: 3, lineTotal: 240 })] });
    await promise;

    expect(mockedCartService.updateItem).toHaveBeenCalledWith(5, 3);
    expect(useCartStore.getState().items[0].quantity).toBe(3);
  });

  it('addItem(variante existente) recorta la cantidad optimista a stock', async () => {
    useCartStore.setState({ items: [makeItem({ quantity: 4, stock: 5, lineTotal: 320 })] });
    const d = deferred<CartResponse>();
    mockedCartService.updateItem.mockReturnValueOnce(d.promise);

    const promise = useCartStore.getState().addItem(5, 2);

    expect(useCartStore.getState().items[0].quantity).toBe(5);
    expect(mockedCartService.updateItem).toHaveBeenCalledWith(5, 5);

    d.resolve({ items: [makeItem({ quantity: 5, lineTotal: 400 })] });
    await promise;
  });

  it('addItem(variante existente) revierte ante error de la API', async () => {
    useCartStore.setState({ items: [makeItem({ quantity: 1, lineTotal: 80 })] });
    mockedCartService.updateItem.mockRejectedValueOnce(new Error('nope'));

    await useCartStore.getState().addItem(5, 2);

    const s = useCartStore.getState();
    expect(s.items[0].quantity).toBe(1);
    expect(s.items[0].lineTotal).toBe(80);
    expect(s.status).toBe('error');
    expect(s.error).toBe('nope');
  });

  it('addItem(variante desconocida) ante error deja status error', async () => {
    mockedCartService.sync.mockRejectedValueOnce(new Error('bad sync'));

    await useCartStore.getState().addItem(5, 2);

    const s = useCartStore.getState();
    expect(s.items).toEqual([]);
    expect(s.status).toBe('error');
    expect(s.error).toBe('bad sync');
  });

  it('AC3: updateItem llama al service y refleja la respuesta', async () => {
    const updated = makeItem({ quantity: 3, lineTotal: 240 });
    useCartStore.setState({ items: [makeItem({ quantity: 1 })] });
    mockedCartService.updateItem.mockResolvedValueOnce({ items: [updated] });

    await useCartStore.getState().updateItem(5, 3);

    expect(mockedCartService.updateItem).toHaveBeenCalledWith(5, 3);
    expect(useCartStore.getState().items).toEqual([updated]);
  });

  it('AC3: removeItem llama al service y refleja la respuesta', async () => {
    useCartStore.setState({ items: [makeItem()] });
    mockedCartService.removeItem.mockResolvedValueOnce({ items: [] });

    await useCartStore.getState().removeItem(5);

    expect(mockedCartService.removeItem).toHaveBeenCalledWith(5);
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('AC4: updateItem es optimista y revierte ante error dejando status error', async () => {
    useCartStore.setState({ items: [makeItem({ quantity: 1, lineTotal: 80 })] });
    const d = deferred<CartResponse>();
    mockedCartService.updateItem.mockReturnValueOnce(d.promise);

    const promise = useCartStore.getState().updateItem(5, 3);
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    d.reject(new Error('fail'));
    await promise;

    const s = useCartStore.getState();
    expect(s.items[0].quantity).toBe(1);
    expect(s.items[0].lineTotal).toBe(80);
    expect(s.status).toBe('error');
    expect(s.error).toBe('fail');
  });

  it('updateItem(5, 0) elimina de forma optimista y llama al service con 0', async () => {
    const other = makeItem({ variantId: 6 });
    useCartStore.setState({ items: [makeItem({ quantity: 2 }), other] });
    const d = deferred<CartResponse>();
    mockedCartService.updateItem.mockReturnValueOnce(d.promise);

    const promise = useCartStore.getState().updateItem(5, 0);
    expect(useCartStore.getState().items).toEqual([other]);

    d.resolve({ items: [other] });
    await promise;
    expect(mockedCartService.updateItem).toHaveBeenCalledWith(5, 0);
  });

  it('removeItem es optimista y revierte ante error', async () => {
    const item5 = makeItem({ variantId: 5 });
    const item6 = makeItem({ variantId: 6 });
    useCartStore.setState({ items: [item5, item6] });
    const d = deferred<CartResponse>();
    mockedCartService.removeItem.mockReturnValueOnce(d.promise);

    const promise = useCartStore.getState().removeItem(5);
    expect(useCartStore.getState().items).toEqual([item6]);

    d.reject(new Error('cannot remove'));
    await promise;

    const s = useCartStore.getState();
    expect(s.items).toEqual([item5, item6]);
    expect(s.status).toBe('error');
    expect(s.error).toBe('cannot remove');
  });

  it('AC5: selectTotalCount suma cantidades y selectTotalPrice suma lineTotal', () => {
    const items = [
      makeItem({ quantity: 2, price: 80, lineTotal: 160 }),
      makeItem({ variantId: 6, quantity: 1, price: 100, lineTotal: 100 }),
    ];

    expect(selectTotalCount({ items })).toBe(3);
    expect(selectTotalPrice({ items })).toBe(260);
  });

  it('reset() vacía el carrito y limpia status/error', () => {
    useCartStore.setState({ items: [makeItem()], status: 'error', error: 'x' });

    useCartStore.getState().reset();

    const s = useCartStore.getState();
    expect(s.items).toEqual([]);
    expect(s.status).toBe('idle');
    expect(s.error).toBeNull();
  });
});
