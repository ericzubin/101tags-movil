import { orderService } from '@/core/services/order-service';
import { httpClient } from '@/core/api/client';

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

describe('orderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AC1: getOrders() llama GET /orders y devuelve el paginator', async () => {
    const paginator = {
      data: [{ orderNumber: 'ORD-1' }],
      currentPage: 1,
      lastPage: 2,
      perPage: 10,
      total: 11,
      from: 1,
      to: 10,
      nextPageUrl: null,
      prevPageUrl: null,
    };
    mockedHttpClient.request.mockResolvedValueOnce(paginator);

    const result = await orderService.getOrders();

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/orders');
    expect(options?.method).toBe('GET');
    expect(result).toBe(paginator);
    expect(result.data).toHaveLength(1);
    expect(result.currentPage).toBe(1);
    expect(result.total).toBe(11);
  });

  it('getOrders(page) envía el número de página', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({
      data: [],
      currentPage: 3,
      lastPage: 3,
      perPage: 10,
      total: 21,
      from: null,
      to: null,
      nextPageUrl: null,
      prevPageUrl: null,
    });

    await orderService.getOrders(3);

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/orders');
    expect(options?.query).toEqual({ page: 3 });
  });

  it('getOrder(orderNumber) llama GET /orders/{orderNumber}', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ orderNumber: 'ORD-0001' });

    await orderService.getOrder('ORD-0001');

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/orders/ORD-0001');
    expect(options?.method).toBe('GET');
  });

  it('getOrder encoda caracteres especiales del orderNumber', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ orderNumber: 'A/B' });

    await orderService.getOrder('A/B');

    const [path] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/orders/A%2FB');
  });
});
