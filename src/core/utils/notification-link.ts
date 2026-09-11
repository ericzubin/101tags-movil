import type { Href } from 'expo-router';

/**
 * Maps the web-oriented `link` the backend stores on an in-app notification to
 * an app route. The API emits storefront URLs (`/cuenta?pedido=X`,
 * `/cuenta?pedido=X&chat=1`, `/cuenta/devoluciones`) that do not exist as
 * routes in Expo Router. Only customer-facing links are translated; supplier /
 * admin links (or anything unknown) resolve to `null` so the caller does not
 * navigate to a dead route.
 *
 * @see 101tags.com- app/Http/Controllers/Api/NotificationController.php
 */
export function resolveNotificationLink(link: string | null | undefined): Href | null {
  if (typeof link !== 'string') return null;
  const trimmed = link.trim();
  if (!trimmed) return null;

  const queryIndex = trimmed.indexOf('?');
  const rawPath = queryIndex >= 0 ? trimmed.slice(0, queryIndex) : trimmed;
  const rawQuery = queryIndex >= 0 ? trimmed.slice(queryIndex + 1) : '';

  // Collapse trailing slashes (`/cuenta/` === `/cuenta`) but keep root.
  const path = rawPath.replace(/\/+$/, '') || '/';

  if (path === '/cuenta/devoluciones') return '/returns';

  if (path === '/cuenta') {
    const params = new URLSearchParams(rawQuery);
    const orderNumber = params.get('pedido');
    if (!orderNumber) return '/account';

    const encoded = encodeURIComponent(orderNumber);
    return params.get('chat') === '1' ? `/chat/${encoded}` : `/orders/${encoded}`;
  }

  return null;
}
