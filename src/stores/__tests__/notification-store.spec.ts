import type { AppNotification, NotificationsResponse } from '@/core/models/notification.model';
import { notificationService } from '@/core/services/notification-service';
import { useNotificationStore } from '@/stores/notification-store';

jest.mock('@/core/services/notification-service', () => ({
  notificationService: {
    getNotifications: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
  },
}));

const mockedNotificationService = notificationService as jest.Mocked<typeof notificationService>;

function makeNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 1,
    type: 'order_confirmed',
    title: 'Pedido confirmado',
    body: 'Tu pedido ORD-0001 fue registrado.',
    link: '/cuenta?pedido=ORD-0001',
    read: false,
    createdAt: '2026-09-11T10:00:00Z',
    ...overrides,
  };
}

function resetStore() {
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    status: 'idle',
    error: null,
  });
}

describe('notification-store', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    resetStore();
  });

  it('estado inicial: lista vacía, unreadCount 0, status idle, error null', () => {
    const s = useNotificationStore.getState();
    expect(s.notifications).toEqual([]);
    expect(s.unreadCount).toBe(0);
    expect(s.status).toBe('idle');
    expect(s.error).toBeNull();
  });

  it('AC1: fetchNotifications() llama getNotifications y guarda data + unreadCount', async () => {
    const notifications = [makeNotification(), makeNotification({ id: 2, read: true })];
    mockedNotificationService.getNotifications.mockResolvedValueOnce({
      data: notifications,
      unreadCount: 1,
    });

    await useNotificationStore.getState().fetchNotifications();

    expect(mockedNotificationService.getNotifications).toHaveBeenCalledTimes(1);
    const s = useNotificationStore.getState();
    expect(s.notifications).toEqual(notifications);
    expect(s.unreadCount).toBe(1);
    expect(s.status).toBe('idle');
    expect(s.error).toBeNull();
  });

  it('fetchNotifications() expone status loading mientras está en vuelo', async () => {
    let resolve!: (value: NotificationsResponse) => void;
    mockedNotificationService.getNotifications.mockReturnValueOnce(
      new Promise<NotificationsResponse>((res) => {
        resolve = res;
      }),
    );

    const promise = useNotificationStore.getState().fetchNotifications();
    expect(useNotificationStore.getState().status).toBe('loading');

    resolve({ data: [makeNotification()], unreadCount: 1 });
    await promise;
    expect(useNotificationStore.getState().status).toBe('idle');
  });

  it('fetchNotifications() ante error deja status error y guarda el mensaje', async () => {
    mockedNotificationService.getNotifications.mockRejectedValueOnce(new Error('boom'));

    await useNotificationStore.getState().fetchNotifications();

    const s = useNotificationStore.getState();
    expect(s.status).toBe('error');
    expect(s.error).toBe('boom');
  });

  it('AC2: markRead(id) es optimista, llama PATCH y actualiza read + unreadCount', async () => {
    useNotificationStore.setState({
      notifications: [makeNotification({ id: 1 }), makeNotification({ id: 2 })],
      unreadCount: 2,
    });
    mockedNotificationService.markRead.mockResolvedValueOnce({ message: 'ok' });

    await useNotificationStore.getState().markRead(1);

    expect(mockedNotificationService.markRead).toHaveBeenCalledWith(1);
    const s = useNotificationStore.getState();
    expect(s.notifications.find((n) => n.id === 1)?.read).toBe(true);
    expect(s.notifications.find((n) => n.id === 2)?.read).toBe(false);
    expect(s.unreadCount).toBe(1);
    expect(s.status).toBe('idle');
  });

  it('markRead(id) marca read=true de forma optimista antes de que responda la API', async () => {
    useNotificationStore.setState({
      notifications: [makeNotification({ id: 1 })],
      unreadCount: 1,
    });
    let resolve!: (value: { message: string }) => void;
    mockedNotificationService.markRead.mockReturnValueOnce(
      new Promise<{ message: string }>((res) => {
        resolve = res;
      }),
    );

    const promise = useNotificationStore.getState().markRead(1);

    expect(useNotificationStore.getState().notifications[0].read).toBe(true);
    expect(useNotificationStore.getState().unreadCount).toBe(0);

    resolve({ message: 'ok' });
    await promise;
  });

  it('AC4: markRead(id) revierte read/unreadCount y deja status error si la API falla', async () => {
    useNotificationStore.setState({
      notifications: [makeNotification({ id: 1 })],
      unreadCount: 1,
    });
    mockedNotificationService.markRead.mockRejectedValueOnce(new Error('HTTP 403 Forbidden'));

    await useNotificationStore.getState().markRead(1);

    const s = useNotificationStore.getState();
    expect(s.notifications[0].read).toBe(false);
    expect(s.unreadCount).toBe(1);
    expect(s.status).toBe('error');
    expect(s.error).toBe('HTTP 403 Forbidden');
  });

  it('markRead(id) ya leída no llama a la API', async () => {
    useNotificationStore.setState({
      notifications: [makeNotification({ id: 1, read: true })],
      unreadCount: 0,
    });

    await useNotificationStore.getState().markRead(1);

    expect(mockedNotificationService.markRead).not.toHaveBeenCalled();
  });

  it('markRead(id) desconocida no llama a la API', async () => {
    useNotificationStore.setState({ notifications: [], unreadCount: 0 });

    await useNotificationStore.getState().markRead(99);

    expect(mockedNotificationService.markRead).not.toHaveBeenCalled();
  });

  it('AC3: markAllRead() es optimista, llama read-all y deja todas read + unreadCount 0', async () => {
    useNotificationStore.setState({
      notifications: [
        makeNotification({ id: 1 }),
        makeNotification({ id: 2, read: true }),
        makeNotification({ id: 3 }),
      ],
      unreadCount: 2,
    });
    mockedNotificationService.markAllRead.mockResolvedValueOnce({ message: 'ok' });

    await useNotificationStore.getState().markAllRead();

    expect(mockedNotificationService.markAllRead).toHaveBeenCalledTimes(1);
    const s = useNotificationStore.getState();
    expect(s.notifications.every((n) => n.read)).toBe(true);
    expect(s.unreadCount).toBe(0);
    expect(s.status).toBe('idle');
  });

  it('AC4: markAllRead() revierte todo y deja status error si la API falla', async () => {
    const items = [makeNotification({ id: 1 }), makeNotification({ id: 2 })];
    useNotificationStore.setState({ notifications: items, unreadCount: 2 });
    mockedNotificationService.markAllRead.mockRejectedValueOnce(new Error('fail'));

    await useNotificationStore.getState().markAllRead();

    const s = useNotificationStore.getState();
    expect(s.notifications).toEqual(items);
    expect(s.unreadCount).toBe(2);
    expect(s.status).toBe('error');
    expect(s.error).toBe('fail');
  });
});
