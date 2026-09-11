import { runSessionResets } from '@/core/session/reset';
import { couponService } from '@/core/services/coupon-service';
import { filterCoupons, useCouponStore } from '@/stores/coupon-store';

import type { CouponDefinition } from '@/core/models/coupon.model';

jest.mock('@/core/services/coupon-service', () => ({
  couponService: {
    getCoupons: jest.fn(),
  },
}));

const mockedCouponService = couponService as jest.Mocked<typeof couponService>;

function makeCoupon(overrides: Partial<CouponDefinition> = {}): CouponDefinition {
  return {
    id: 'api-1',
    code: 'TAGS50',
    issuer: 'platform',
    title: '50 pesos',
    description: 'Bienvenida',
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
    ...overrides,
  };
}

const fifty = makeCoupon({ id: 'api-1', code: 'TAGS50', title: '50 pesos', keywords: ['playera'] });
const shipping = makeCoupon({
  id: 'api-2',
  code: 'ENVIO',
  title: 'Envío gratis',
  description: 'Sin costo de envío',
  discountType: 'shipping',
  keywords: ['envio'],
});

describe('coupon-store', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useCouponStore.getState().reset();
  });

  it('estado inicial: sin cupones, sin query, idle y sin error', () => {
    const s = useCouponStore.getState();
    expect(s.coupons).toEqual([]);
    expect(s.query).toBe('');
    expect(s.status).toBe('idle');
    expect(s.error).toBeNull();
  });

  it('AC1: fetchCoupons(email) llama getCoupons con email y guarda los cupones', async () => {
    mockedCouponService.getCoupons.mockResolvedValueOnce([fifty, shipping]);

    await useCouponStore.getState().fetchCoupons('ada@example.com');

    expect(mockedCouponService.getCoupons).toHaveBeenCalledWith({ email: 'ada@example.com' });
    const s = useCouponStore.getState();
    expect(s.coupons).toEqual([fifty, shipping]);
    expect(s.status).toBe('ready');
    expect(s.error).toBeNull();
  });

  it('AC1: fetchCoupons() sin email no envía email', async () => {
    mockedCouponService.getCoupons.mockResolvedValueOnce([]);

    await useCouponStore.getState().fetchCoupons();

    expect(mockedCouponService.getCoupons).toHaveBeenCalledWith({});
  });

  it('AC6: error de red deja status error con el mensaje', async () => {
    mockedCouponService.getCoupons.mockRejectedValueOnce(new Error('network down'));

    await useCouponStore.getState().fetchCoupons('ada@example.com');

    const s = useCouponStore.getState();
    expect(s.status).toBe('error');
    expect(s.error).toBe('network down');
    expect(s.coupons).toEqual([]);
  });

  it('AC3: setQuery actualiza el término de búsqueda', () => {
    useCouponStore.getState().setQuery('playera');

    expect(useCouponStore.getState().query).toBe('playera');
  });

  it('reset() vuelve al estado inicial', () => {
    useCouponStore.setState({ coupons: [fifty], query: 'x', status: 'error', error: 'boom' });

    useCouponStore.getState().reset();

    const s = useCouponStore.getState();
    expect(s.coupons).toEqual([]);
    expect(s.query).toBe('');
    expect(s.status).toBe('idle');
    expect(s.error).toBeNull();
  });

  it('T1: una respuesta vieja que resuelve después de reset no repuebla la cuponera', async () => {
    let resolveFetch: (value: CouponDefinition[]) => void = () => {};
    mockedCouponService.getCoupons.mockImplementationOnce(
      () =>
        new Promise<CouponDefinition[]>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const pending = useCouponStore.getState().fetchCoupons('ada@example.com');
    useCouponStore.getState().reset();
    resolveFetch([fifty, shipping]);
    await pending;

    const s = useCouponStore.getState();
    expect(s.coupons).toEqual([]);
    expect(s.status).toBe('idle');
  });

  it('T1: runSessionResets() deja la cuponera vacía', async () => {
    useCouponStore.setState({ coupons: [fifty], query: 'x', status: 'ready', error: null });

    await runSessionResets();

    expect(useCouponStore.getState().coupons).toEqual([]);
  });

  describe('AC3: filterCoupons', () => {
    const list = [fifty, shipping];

    it('query vacío o solo espacios devuelve la lista completa', () => {
      expect(filterCoupons(list, '')).toEqual(list);
      expect(filterCoupons(list, '   ')).toEqual(list);
    });

    it('filtra por code/title/description/keywords sin distinguir mayúsculas', () => {
      expect(filterCoupons(list, 'tags50')).toEqual([fifty]);
      expect(filterCoupons(list, 'ENVÍO')).toEqual([shipping]);
      expect(filterCoupons(list, 'sin costo')).toEqual([shipping]);
      expect(filterCoupons(list, 'playera')).toEqual([fifty]);
    });

    it('sin coincidencias devuelve []', () => {
      expect(filterCoupons(list, 'zzz')).toEqual([]);
    });
  });
});
