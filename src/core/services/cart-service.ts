import { httpClient } from '@/core/api/client';

import type { CartResponse } from '@/core/models/cart.model';

/** Request item for `POST /cart/sync` — backend expects snake_case. */
export interface CartSyncItem {
  variant_id: number;
  quantity: number;
}

/**
 * Authenticated cart API. `httpClient` injects the Sanctum bearer token
 * and normalizes snake_case responses to camelCase.
 *
 * @see .spec/2026-09-11-m3-1-cart.md §Contratos
 */
export const cartService = {
  async getCart(): Promise<CartResponse> {
    return httpClient.request<CartResponse>('/cart', { method: 'GET' });
  },

  async sync(items: CartSyncItem[]): Promise<CartResponse> {
    return httpClient.request<CartResponse>('/cart/sync', {
      method: 'POST',
      body: { items },
    });
  },

  async updateItem(variantId: number, quantity: number): Promise<CartResponse> {
    return httpClient.request<CartResponse>('/cart/items', {
      method: 'PUT',
      body: { variant_id: variantId, quantity },
    });
  },

  async removeItem(variantId: number): Promise<CartResponse> {
    return httpClient.request<CartResponse>(`/cart/items/${variantId}`, {
      method: 'DELETE',
    });
  },
};
