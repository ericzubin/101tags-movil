import { queryClient } from '@/core/query/client';
import { chatKeys, orderKeys } from '@/core/query/keys';
import { runSessionResets } from '@/core/session/reset';
import { useCouponStore } from '@/stores/coupon-store';
import { useNotificationStore } from '@/stores/notification-store';

// Importing these modules runs their top-level `registerSessionReset` calls,
// which is the integration side effect under test.
import '@/stores/order-store';

import type { CouponDefinition } from '@/core/models/coupon.model';
import type { AppNotification } from '@/core/models/notification.model';

const notification: AppNotification = {
  id: 1,
  type: 'order_confirmed',
  title: 'Pedido confirmado',
  body: 'Tu pedido ORD-0001 fue registrado.',
  link: '/cuenta?pedido=ORD-0001',
  read: false,
  createdAt: '2026-09-11T10:00:00Z',
};

const coupon: CouponDefinition = {
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
};

describe('session reset — limpieza integral A → logout → B (T5)', () => {
  it('runSessionResets limpia queries de pedidos/chat, notificaciones y cupones', async () => {
    queryClient.setQueryData(orderKeys.list(1), [{ orderNumber: 'ORD-1' }]);
    queryClient.setQueryData(chatKeys.conversations(), [{ folio: 'ORD-1' }]);
    useNotificationStore.setState({
      notifications: [notification],
      unreadCount: 1,
      status: 'idle',
      error: null,
    });
    useCouponStore.setState({ coupons: [coupon], query: '', status: 'ready', error: null });

    expect(queryClient.getQueryData(orderKeys.list(1))).toBeDefined();
    expect(queryClient.getQueryData(chatKeys.conversations())).toBeDefined();
    expect(useNotificationStore.getState().notifications).toHaveLength(1);
    expect(useCouponStore.getState().coupons).toHaveLength(1);

    await runSessionResets();

    expect(queryClient.getQueryData(orderKeys.list(1))).toBeUndefined();
    expect(queryClient.getQueryData(chatKeys.conversations())).toBeUndefined();
    expect(useNotificationStore.getState().notifications).toEqual([]);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(useCouponStore.getState().coupons).toEqual([]);
  });
});
