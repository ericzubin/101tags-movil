import { resolveNotificationLink } from '@/core/utils/notification-link';

describe('resolveNotificationLink', () => {
  it('devuelve null para links nulos, vacíos o sin info', () => {
    expect(resolveNotificationLink(null)).toBeNull();
    expect(resolveNotificationLink(undefined)).toBeNull();
    expect(resolveNotificationLink('')).toBeNull();
    expect(resolveNotificationLink('   ')).toBeNull();
  });

  it('mapea /cuenta?pedido=X&chat=1 al chat del pedido', () => {
    expect(resolveNotificationLink('/cuenta?pedido=ORD-0001&chat=1')).toBe('/chat/ORD-0001');
    expect(resolveNotificationLink('/cuenta?chat=1&pedido=ORD-0001')).toBe('/chat/ORD-0001');
    expect(resolveNotificationLink('/cuenta?pedido=ORD-0001&chat=0')).toBe('/orders/ORD-0001');
    expect(resolveNotificationLink('/cuenta?pedido=ORD-0001&chat=true')).toBe('/orders/ORD-0001');
  });

  it('mapea /cuenta?pedido=X al detalle del pedido', () => {
    expect(resolveNotificationLink('/cuenta?pedido=ORD-0001')).toBe('/orders/ORD-0001');
    expect(resolveNotificationLink('/cuenta?otro=1&pedido=ORD-0001')).toBe('/orders/ORD-0001');
  });

  it('mapea /cuenta/devoluciones al listado de devoluciones', () => {
    expect(resolveNotificationLink('/cuenta/devoluciones')).toBe('/returns');
  });

  it('mapea /cuenta (sin pedido) a la cuenta', () => {
    expect(resolveNotificationLink('/cuenta')).toBe('/account');
    expect(resolveNotificationLink('/cuenta/')).toBe('/account');
    expect(resolveNotificationLink('/cuenta?foo=bar')).toBe('/account');
  });

  it('devuelve null para links de proveedor, admin o desconocidos', () => {
    expect(resolveNotificationLink('/proveedores/pedidos')).toBeNull();
    expect(resolveNotificationLink('/proveedores/pedidos?estado=nuevo')).toBeNull();
    expect(resolveNotificationLink('/admin/notificaciones')).toBeNull();
    expect(resolveNotificationLink('/orders/ORD-0001')).toBeNull();
    expect(resolveNotificationLink('/desconocido')).toBeNull();
  });

  it('ignora espacios alrededor del link', () => {
    expect(resolveNotificationLink('  /cuenta?pedido=ORD-0001  ')).toBe('/orders/ORD-0001');
  });
});
