import { create } from 'zustand';

import { registerSessionReset } from '@/core/session/reset';
import { notificationService } from '@/core/services/notification-service';

import type { AppNotification } from '@/core/models/notification.model';

export type NotificationStatus = 'idle' | 'loading' | 'error';

export interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  status: NotificationStatus;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  reset: () => void;
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'No pudimos actualizar las notificaciones.';
}

/**
 * Monotonic sequence for optimistic mutations. A failing mutation rolls back
 * only when it is still the most recent one; a slower stale failure must not
 * undo a newer mutation that already succeeded.
 */
let notificationMutationSeq = 0;

/**
 * Notifications store — single source of truth for the in-app notification list
 * and the account badge. `fetchNotifications` adopts the server snapshot
 * (`data` + `unreadCount`). `markRead` / `markAllRead` mutate optimistically and
 * roll back on failure, surfacing `status: 'error'` + `error` (a 403 from the
 * backend must never be shown as success).
 *
 * @see .spec/2026-09-11-m5-3-notifications.md §Arquitectura
 */
export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  status: 'idle',
  error: null,

  fetchNotifications: async () => {
    set({ status: 'loading', error: null });
    try {
      const { data, unreadCount } = await notificationService.getNotifications();
      set({ notifications: data, unreadCount, status: 'idle', error: null });
    } catch (err) {
      set({ status: 'error', error: toErrorMessage(err) });
    }
  },

  markRead: async (id) => {
    const previous = get().notifications;
    const previousUnread = get().unreadCount;
    const target = previous.find((notification) => notification.id === id);
    if (!target || target.read) return;

    const seq = ++notificationMutationSeq;
    set({
      notifications: previous.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
      unreadCount: Math.max(0, previousUnread - 1),
      error: null,
    });

    try {
      await notificationService.markRead(id);
      set({ status: 'idle', error: null });
    } catch (err) {
      // A newer mutation already superseded this one: keep its optimistic state.
      if (seq !== notificationMutationSeq) return;
      set({
        notifications: previous,
        unreadCount: previousUnread,
        status: 'error',
        error: toErrorMessage(err),
      });
    }
  },

  markAllRead: async () => {
    const previous = get().notifications;
    const previousUnread = get().unreadCount;
    if (previousUnread === 0) return;

    const seq = ++notificationMutationSeq;
    set({
      notifications: previous.map((notification) => ({ ...notification, read: true })),
      unreadCount: 0,
      error: null,
    });

    try {
      await notificationService.markAllRead();
      set({ status: 'idle', error: null });
    } catch (err) {
      // A newer mutation already superseded this one: keep its optimistic state.
      if (seq !== notificationMutationSeq) return;
      set({
        notifications: previous,
        unreadCount: previousUnread,
        status: 'error',
        error: toErrorMessage(err),
      });
    }
  },

  reset: () => {
    notificationMutationSeq += 1;
    set({ notifications: [], unreadCount: 0, status: 'idle', error: null });
  },
}));

/**
 * Session-scoped state must not leak between accounts: signing out (or in as a
 * different user) wipes the notification list and badge.
 */
registerSessionReset(() => useNotificationStore.getState().reset());
