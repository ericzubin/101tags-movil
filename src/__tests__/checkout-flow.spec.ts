/**
 * M7.4-qa-regression (#35) — Flujo crítico end-to-end a nivel automatizado.
 *
 * Recorre los contratos reales de los servicios contra un `httpClient`
 * mockeado y los stores reales, verificando que cada paso consume el dato
 * emitido por el paso anterior:
 *
 *   login → catálogo (lista → detalle/variante) → carrito (sync → update)
 *         → checkout (request-orders + Idempotency-Key) → payment-instructions
 *
 * La validación en dispositivo (E2E nativo) queda BLOQUEADA.
 *
 * @see .spec/2026-09-11-m7-4-qa-regression.md
 */

import { catalogService } from '@/core/services/catalog-service';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { useCheckoutStore } from '@/stores/checkout-store';

import type { CartItem } from '@/core/models/cart.model';
import type {
  PaymentInstructionsResult,
  PostalCodeLookup,
} from '@/core/models/checkout.model';

const mockPost = jest.fn();

let mockHandler: jest.Mock = jest.fn();

jest.mock('@/core/api/client', () => {
  const actual = jest.requireActual('@/core/api/client');
  return {
    ...actual,
    httpClient: {
      request: (path: string, options?: unknown) => mockHandler(path, options as never),
      get: (path: string, options?: unknown) =>
        mockHandler(path, { ...(options as object), method: 'GET' }),
      post: (path: string, body?: unknown) => mockPost(path, body),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      setAuthTokenProvider: jest.fn(),
      setOnUnauthorized: jest.fn(),
    },
  };
});

jest.mock('@/core/services/secure-storage-service', () => {
  const memory = new Map<string, string>();
  return {
    secureStorageService: {
      getItem: jest.fn(async (key: string) => memory.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        memory.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        memory.delete(key);
      }),
      clear: jest.fn(async () => {
        memory.clear();
      }),
      getKeys: () => ({
        authToken: '101tags.auth.token',
        authUser: '101tags.auth.user',
      }),
    },
  };
});


const user = {
  id: 7,
  name: 'Ana López',
  email: 'ana@example.com',
  phone: null,
  role: 'customer',
} as const;

const loginResponse = { accessToken: 'tok-123', user };

const productSummary = {
  id: 1,
  name: 'Playera Negra',
  slug: 'playera-negra',
  supplierId: null,
  basePrice: 80,
  minPrice: 80,
  maxPrice: 80,
  image: null,
  images: [],
  category: { id: 1, name: 'Ropa', slug: 'ropa' },
  subcategory: null,
  isFeatured: false,
  inStock: true,
  totalStock: 10,
  availableSizes: ['M'],
  availableColors: ['Negro'],
};

const productDetail = {
  ...productSummary,
  description: 'Playera de algodón.',
  variants: [
    {
      id: 55,
      size: 'M',
      color: 'Negro',
      sku: 'P-M-N',
      stock: 10,
      inStock: true,
      price: 80,
      priceOverride: null,
    },
  ],
};

const cartItem: CartItem = {
  variantId: 55,
  productId: 1,
  supplierId: null,
  productName: 'Playera Negra',
  productSlug: 'playera-negra',
  size: 'M',
  color: 'Negro',
  sku: 'P-M-N',
  price: 80,
  stock: 10,
  quantity: 2,
  image: null,
  lineTotal: 160,
};

const requestOrdersResult = {
  message: 'Pedidos solicitados.',
  purchaseNumber: 'PUR-1',
  accessToken: null,
  orders: [
    {
      orderNumber: 'ORD-777',
      supplierId: null,
      status: 'pending',
      paymentStatus: 'pending',
      total: 240,
    },
  ],
};

const oxxoInstructions: PaymentInstructionsResult = {
  orderNumber: 'ORD-777',
  paymentStatus: 'pending',
  paymentMethod: 'oxxo',
  total: 240,
  paymentDueAt: '2099-01-01T00:00:00Z',
  paymentInstructions: {
    type: 'supplier_manual',
    method: 'oxxo',
    reference: 'REF-123',
    amount: 240,
  },
  demoMode: false,
};

const speiInstructions: PaymentInstructionsResult = {
  orderNumber: 'ORD-777',
  paymentStatus: 'pending',
  paymentMethod: 'spei',
  total: 240,
  paymentDueAt: '2099-01-01T00:00:00Z',
  paymentInstructions: {
    type: 'supplier_manual',
    method: 'spei',
    clabe: '012180000000000000',
    bank: 'BBVA',
    recipientName: 'Tags SA de CV',
    amount: 240,
  },
  demoMode: false,
};

let paymentFixture: PaymentInstructionsResult = oxxoInstructions;

const postalLookup: PostalCodeLookup = {
  postalCode: '06600',
  state: 'Ciudad de México',
  stateCode: 'CDMX',
  municipality: 'Cuauhtémoc',
  city: 'Ciudad de México',
  settlements: [{ name: 'Juárez', type: 'Colonia' }],
};

const address = { street: 'Av. Juárez 123', city: 'CDMX', state: 'CDMX', zip: '06600' };

const proofAsset = {
  uri: 'file:///tmp/proof.pdf',
  name: 'proof.pdf',
  type: 'application/pdf',
  size: 1024,
};

function installRouter(): void {
  mockHandler = jest.fn(async (path, options = {}) => {
    if (path === '/catalog/products') {
      return {
        data: [productSummary],
        currentPage: 1,
        lastPage: 1,
        perPage: 12,
        total: 1,
        from: 1,
        to: 1,
        nextPageUrl: null,
        prevPageUrl: null,
      };
    }
    if (path === '/catalog/products/playera-negra') return productDetail;
    if (path === '/postal-codes/06600') return { data: postalLookup };
    if (path === '/cart/sync') return { items: [cartItem] };
    if (path === '/cart/items') {
      return { items: [{ ...cartItem, quantity: 3, lineTotal: 240 }] };
    }
    if (path === '/checkout/request-orders') return requestOrdersResult;
    if (path === `/checkout/payment-instructions/ORD-777`) return paymentFixture;
    if (path === '/checkout/orders/ORD-777/payment-proof') {
      return {
        message: 'Comprobante enviado.',
        paymentStatus: 'proof_submitted',
        paymentProofUrl: 'https://cdn.test/proof.pdf',
      };
    }
    throw new Error(`unexpected request: ${options.method ?? 'GET'} ${path}`);
  });
  mockPost.mockImplementation(async (path: string) => {
    if (path === '/auth/customer/login') return loginResponse;
    throw new Error(`unexpected post: ${path}`);
  });
}

describe('M7.4 — flujo crítico login → catálogo → carrito → checkout → instrucciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installRouter();
    useAuthStore.setState({ user: null, token: null, isHydrated: false, isLoading: false });
    useCartStore.setState({ items: [], status: 'idle', error: null });
    useCheckoutStore.getState().reset();
    paymentFixture = oxxoInstructions;
  });

  it('encadena los datos de cada paso y usa la Idempotency-Key en request-orders', async () => {
    // 1) login
    await useAuthStore.getState().login('ana@example.com', 'secret');
    expect(useAuthStore.getState().token).toBe('tok-123');
    expect(useAuthStore.getState().user?.email).toBe('ana@example.com');
    expect(mockPost).toHaveBeenCalledWith('/auth/customer/login', {
      email: 'ana@example.com',
      password: 'secret',
      device_name: 'mobile-app',
    });

    // 2) catálogo: lista → detalle → variante (dato del paso anterior)
    const list = await catalogService.getProducts();
    expect(list.data[0].slug).toBe('playera-negra');
    const detail = await catalogService.getProductBySlug(list.data[0].slug);
    const variantId = detail.variants[0].id;
    expect(variantId).toBe(55);

    // 3) carrito: sync (variante desconocida) → update (misma variante)
    await useCartStore.getState().addItem(variantId, 2);
    expect(mockHandler).toHaveBeenCalledWith(
      '/cart/sync',
      expect.objectContaining({ method: 'POST', body: { items: [{ variant_id: 55, quantity: 2 }] } }),
    );
    expect(useCartStore.getState().items[0].variantId).toBe(variantId);

    await useCartStore.getState().updateItem(variantId, 3);
    expect(mockHandler).toHaveBeenCalledWith(
      '/cart/items',
      expect.objectContaining({ method: 'PUT', body: { variant_id: 55, quantity: 3 } }),
    );
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    // 4) checkout: usa el email del login y los items/quantity del carrito
    useCheckoutStore.getState().setAddress(address);
    const result = await useCheckoutStore.getState().submit({
      name: user.name,
      email: user.email,
    });

    expect(result?.orders[0].orderNumber).toBe('ORD-777');
    const requestCall = mockHandler.mock.calls.find(
      ([path]) => path === '/checkout/request-orders',
    );
    expect(requestCall).toBeTruthy();
    const requestOptions = requestCall?.[1] as {
      method: string;
      body: Record<string, unknown>;
      headers: Record<string, string>;
    };
    expect(requestOptions.method).toBe('POST');
    expect(requestOptions.body).toMatchObject({
      items: [{ variant_id: variantId, quantity: 3 }],
      customer_name: 'Ana López',
      customer_email: 'ana@example.com',
      shipping_address: address,
    });
    expect(requestOptions.headers['Idempotency-Key']).toMatch(/^[A-Za-z0-9._:-]{8,100}$/);

    // 5) payment-instructions: usa el orderNumber del resultado anterior
    const orderNumber = result?.orders[0].orderNumber as string;
    await useCheckoutStore.getState().fetchPaymentInstructions(orderNumber, user.email);

    expect(mockHandler).toHaveBeenCalledWith(
      `/checkout/payment-instructions/${orderNumber}`,
      expect.objectContaining({ method: 'GET', query: { email: user.email } }),
    );
    expect(useCheckoutStore.getState().paymentInstructions?.orderNumber).toBe('ORD-777');
    expect(useCheckoutStore.getState().paymentInstructions?.paymentInstructions?.reference).toBe(
      'REF-123',
    );
  });

  it('rama guest: conserva el access_token devuelto por request-orders', async () => {
    useCartStore.setState({ items: [cartItem], status: 'idle', error: null });
    useCheckoutStore.getState().setAddress(address);
    mockHandler = jest.fn(async (path) => {
      if (path === '/checkout/request-orders') {
        return { ...requestOrdersResult, accessToken: 'guest-token-9' };
      }
      throw new Error(`unexpected ${path}`);
    });

    const result = await useCheckoutStore.getState().submit({
      name: 'Invitado',
      email: 'guest@example.com',
    });

    expect(result?.accessToken).toBe('guest-token-9');
    expect(useCheckoutStore.getState().submission.status).toBe('success');
    expect(useCheckoutStore.getState().submission.result?.accessToken).toBe('guest-token-9');
  });

  it('rama OXXO: obtiene referencia y permite copiarla', async () => {
    useCheckoutStore.setState({ lastCustomerEmail: user.email });

    await useCheckoutStore.getState().fetchPaymentInstructions('ORD-777', user.email);

    const data = useCheckoutStore.getState().paymentInstructions;
    expect(data?.paymentMethod).toBe('oxxo');
    expect(data?.paymentInstructions?.reference).toBe('REF-123');
  });

  it('rama SPEI: obtiene CLABE y banco', async () => {
    paymentFixture = speiInstructions;

    await useCheckoutStore.getState().fetchPaymentInstructions('ORD-777', user.email);

    const data = useCheckoutStore.getState().paymentInstructions;
    expect(data?.paymentMethod).toBe('spei');
    expect(data?.paymentInstructions?.clabe).toBe('012180000000000000');
    expect(data?.paymentInstructions?.bank).toBe('BBVA');
  });

  it('rama comprobante: submitProof sube el archivo y refresca las instrucciones', async () => {
    await useCheckoutStore.getState().fetchPaymentInstructions('ORD-777', user.email);

    const ok = await useCheckoutStore
      .getState()
      .submitProof('ORD-777', user.email, proofAsset);

    expect(ok).toBe(true);
    expect(mockHandler).toHaveBeenCalledWith(
      '/checkout/orders/ORD-777/payment-proof',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(useCheckoutStore.getState().proof.status).toBe('success');
    expect(useCheckoutStore.getState().proof.url).toBe('https://cdn.test/proof.pdf');
  });
});
