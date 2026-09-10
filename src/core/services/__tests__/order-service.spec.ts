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

  it('M4.2: getReturnRequests() llama GET /return-requests y devuelve el paginator', async () => {
    const paginator = {
      data: [{ folio: 'RET-1', type: 'return', status: 'requested' }],
      currentPage: 1,
      lastPage: 1,
      perPage: 20,
      total: 1,
      from: 1,
      to: 1,
      nextPageUrl: null,
      prevPageUrl: null,
    };
    mockedHttpClient.request.mockResolvedValueOnce(paginator);

    const result = await orderService.getReturnRequests();

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/return-requests');
    expect(options?.method).toBe('GET');
    expect(options?.query).toEqual({ page: 1 });
    expect(result).toBe(paginator);
    expect(result.data[0].folio).toBe('RET-1');
  });

  it('M4.2: getReturnRequests(page) envía el número de página', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ data: [] });

    await orderService.getReturnRequests(2);

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/return-requests');
    expect(options?.query).toEqual({ page: 2 });
  });

  it('M4.2: requestReturn() llama POST /orders/{n}/returns con el body', async () => {
    const response = { message: 'Solicitud de devolución registrada', data: { id: 7 } };
    mockedHttpClient.request.mockResolvedValueOnce(response);

    const result = await orderService.requestReturn('ORD-0001', {
      reason: 'Producto dañado',
      description: 'Llegó roto',
    });

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/orders/ORD-0001/returns');
    expect(options?.method).toBe('POST');
    expect(options?.body).toEqual({ reason: 'Producto dañado', description: 'Llegó roto' });
    expect(result).toBe(response);
    expect(result.message).toBe('Solicitud de devolución registrada');
  });

  it('M4.2: requestReturn() encoda el orderNumber y omite description opcional', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ message: 'ok', data: {} });

    await orderService.requestReturn('A/B', { reason: 'Motivo' });

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/orders/A%2FB/returns');
    expect(options?.body).toEqual({ reason: 'Motivo' });
  });

  it('M4.2: requestCancellation() llama POST /orders/{n}/cancellations y devuelve applied', async () => {
    const response = { message: 'Pedido cancelado', applied: true, data: { id: 9 } };
    mockedHttpClient.request.mockResolvedValueOnce(response);

    const result = await orderService.requestCancellation('ORD-0002', {
      reason: 'Ya no lo quiero',
    });

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/orders/ORD-0002/cancellations');
    expect(options?.method).toBe('POST');
    expect(options?.body).toEqual({ reason: 'Ya no lo quiero' });
    expect(result.applied).toBe(true);
    expect(result.message).toBe('Pedido cancelado');
  });
});
