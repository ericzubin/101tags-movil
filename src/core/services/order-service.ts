import { httpClient } from '@/core/api/client';

import type {
  CancellationSubmissionResponse,
  OrderDetail,
  OrderListResponse,
  ReturnListResponse,
  ReturnRequestInput,
  ReturnSubmissionResponse,
} from '@/core/models/order.model';

function orderPath(orderNumber: string, suffix: string): string {
  return `/orders/${encodeURIComponent(orderNumber)}${suffix}`;
}

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
    return httpClient.request<OrderDetail>(orderPath(orderNumber, ''), {
      method: 'GET',
    });
  },

  /** `GET /return-requests` → flat Laravel paginator of `ReturnRequest`. */
  async getReturnRequests(page: number = 1): Promise<ReturnListResponse> {
    return httpClient.request<ReturnListResponse>('/return-requests', {
      method: 'GET',
      query: { page },
    });
  },

  /** `POST /orders/{orderNumber}/returns` → `201 { message, data }`. */
  async requestReturn(
    orderNumber: string,
    input: ReturnRequestInput,
  ): Promise<ReturnSubmissionResponse> {
    return httpClient.request<ReturnSubmissionResponse>(orderPath(orderNumber, '/returns'), {
      method: 'POST',
      body: input,
    });
  },

  /** `POST /orders/{orderNumber}/cancellations` → `201 { message, applied, data }`. */
  async requestCancellation(
    orderNumber: string,
    input: ReturnRequestInput,
  ): Promise<CancellationSubmissionResponse> {
    return httpClient.request<CancellationSubmissionResponse>(
      orderPath(orderNumber, '/cancellations'),
      {
        method: 'POST',
        body: input,
      },
    );
  },
};
