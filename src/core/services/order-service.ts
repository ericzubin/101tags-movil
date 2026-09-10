import { httpClient } from '@/core/api/client';

import type { OrderDetail, OrderListResponse } from '@/core/models/order.model';

/**
 * Authenticated customer order API. `httpClient` injects the Sanctum bearer
 * token and normalizes the controller's snake_case response to camelCase.
 * The backend scopes every order to the authenticated user and returns 404
 * for foreign/inexistent order numbers.
 *
 * @see .spec/2026-09-11-m4-1-orders.md §Contratos
 */
export const orderService = {
  async getOrders(page: number = 1): Promise<OrderListResponse> {
    return httpClient.request<OrderListResponse>('/orders', {
      method: 'GET',
      query: { page },
    });
  },

  async getOrder(orderNumber: string): Promise<OrderDetail> {
    return httpClient.request<OrderDetail>(`/orders/${encodeURIComponent(orderNumber)}`, {
      method: 'GET',
    });
  },
};
