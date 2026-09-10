import { httpClient } from '@/core/api/client';
import { couponService } from '@/core/services/coupon-service';

import type { CouponDefinition } from '@/core/models/coupon.model';

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

const coupon = {
  id: 'api-1',
  code: 'TAGS50',
  issuer: 'platform',
  title: '50 pesos de regalo',
  description: 'Descuento de bienvenida',
  discountType: 'fixed',
  value: 50,
  minSubtotal: null,
  segment: null,
  storeSlug: null,
  storeName: null,
  assignedEmails: [],
  expiresAt: null,
  oneTime: false,
  keywords: [],
} as unknown as CouponDefinition;

describe('couponService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AC1: getCoupons({ email }) llama GET /coupons con ?email= y desenvuelve `{ data }`', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ data: [coupon] });

    const result = await couponService.getCoupons({ email: 'ada@example.com' });

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/coupons');
    expect(options?.method).toBe('GET');
    expect(options?.query).toEqual({ email: 'ada@example.com' });
    expect(result).toEqual([coupon]);
  });

  it('AC3: getCoupons({ email, q }) envía la búsqueda q', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ data: [] });

    await couponService.getCoupons({ email: 'ada@example.com', q: 'playera' });

    const [, options] = mockedHttpClient.request.mock.calls[0];
    expect(options?.query).toEqual({ email: 'ada@example.com', q: 'playera' });
  });

  it('getCoupons() sin parámetros no agrega claves de query', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ data: [] });

    await couponService.getCoupons();

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/coupons');
    expect(options?.query).toEqual({});
  });

  it('getCoupons() tolera una respuesta sin data y devuelve []', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({});

    await expect(couponService.getCoupons()).resolves.toEqual([]);
  });

  it('propaga el error del httpClient (la UI decide el mensaje)', async () => {
    mockedHttpClient.request.mockRejectedValueOnce(new Error('network down'));

    await expect(couponService.getCoupons({ email: 'a@b.com' })).rejects.toThrow('network down');
  });
});
