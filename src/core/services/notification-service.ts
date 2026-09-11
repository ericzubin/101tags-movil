import { httpClient } from '@/core/api/client';

import type { NotificationsResponse } from '@/core/models/notification.model';

/** `PATCH /notifications/{id}` and `POST /notifications/read-all` → `{ message }`. */
export interface NotificationActionResponse {
  readonly message: string;
}

/**
 * Authenticated in-app notifications API. `httpClient` injects the Sanctum
 * bearer token and normalizes snake_case responses to camelCase. The backend
 * scopes every notification to the authenticated user and answers 403 for a
 * foreign id.
 *
 * @see .spec/2026-09-11-m5-3-notifications.md §Contratos
 */
export const notificationService = {
  /** `GET /notifications` → `{ data, unread_count }` (máx 30, con backfill). */
  async getNotifications(): Promise<NotificationsResponse> {
    return httpClient.request<NotificationsResponse>('/notifications', { method: 'GET' });
  },

  /** `PATCH /notifications/{id}` → `{ message }` (403 si no es del usuario). */
  async markRead(id: number): Promise<NotificationActionResponse> {
    return httpClient.request<NotificationActionResponse>(`/notifications/${id}`, {
      method: 'PATCH',
    });
  },

  /** `POST /notifications/read-all` → `{ message }`. */
  async markAllRead(): Promise<NotificationActionResponse> {
    return httpClient.request<NotificationActionResponse>('/notifications/read-all', {
      method: 'POST',
    });
  },
};
