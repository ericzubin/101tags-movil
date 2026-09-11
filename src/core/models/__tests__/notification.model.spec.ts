import { toCamel } from '@/core/utils/snake-camel';

import type { AppNotification, NotificationsResponse } from '@/core/models/notification.model';

/**
 * Contract test for the notifications model. The model is a pure type surface:
 * `httpClient` applies `toCamel` to the controller's snake_case payload, so the
 * assertions here pin the camelCase field names consumed by service/store/UI.
 *
 * @see .spec/2026-09-11-m5-3-notifications.md §Contratos
 */
describe('notification.model', () => {
  it('NotificationsResponse expone las claves camelCase del contrato (snake → toCamel)', () => {
    const raw = {
      data: [
        {
          id: 1,
          type: 'order_confirmed',
          title: 'Pedido confirmado',
          body: 'Total: $10.00 MXN.',
          link: '/cuenta?pedido=ORD-0001',
          read: false,
          created_at: '2026-09-11T10:00:00Z',
        },
      ],
      unread_count: 1,
    };

    const response = toCamel<NotificationsResponse>(raw);

    expect(response.unreadCount).toBe(1);
    expect(response.data).toHaveLength(1);
    expect(response.data[0].id).toBe(1);
    expect(response.data[0].type).toBe('order_confirmed');
    expect(response.data[0].title).toBe('Pedido confirmado');
    expect(response.data[0].read).toBe(false);
    expect(response.data[0].createdAt).toBe('2026-09-11T10:00:00Z');
  });

  it('AppNotification admite body y link null', () => {
    const raw = {
      id: 2,
      type: 'system',
      title: 'Aviso',
      body: null,
      link: null,
      read: true,
      created_at: '2026-09-11T11:00:00Z',
    };

    const notification = toCamel<AppNotification>(raw);

    expect(notification.body).toBeNull();
    expect(notification.link).toBeNull();
    expect(notification.read).toBe(true);
  });
});
