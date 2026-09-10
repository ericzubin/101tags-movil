/**
 * In-app notifications contract — mirror of the authenticated Laravel endpoints:
 *   GET   /api/notifications          → { data, unread_count }
 *   PATCH /api/notifications/{id}     → { message }
 *   POST  /api/notifications/read-all → { message }
 *
 * `httpClient` applies `toCamel`, so the controller's snake_case keys
 * (`unread_count`, `created_at`) arrive here as camelCase. `read` is derived by
 * the backend from `read_at !== null`. The server scopes every notification to
 * the authenticated user and answers 403 for a foreign id.
 *
 * @see .spec/2026-09-11-m5-3-notifications.md §Contratos
 * @see 101tags.com- app/Http/Controllers/Api/NotificationController.php
 */
export interface AppNotification {
  readonly id: number;
  readonly type: string;
  readonly title: string;
  readonly body: string | null;
  readonly link: string | null;
  readonly read: boolean;
  readonly createdAt: string;
}

export interface NotificationsResponse {
  readonly data: AppNotification[];
  readonly unreadCount: number;
}
