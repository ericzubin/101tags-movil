import { httpClient } from '@/core/api/client';
import { notificationService } from '@/core/services/notification-service';

jest.mock('@/core/api/client', () => {
  const actual = jest.requireActual('@/core/api/client');
  return {
    ...actual,
    httpClient: {
      request: jest.fn(),
    },
  };
});

const mockedHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AC1: getNotifications() llama GET /notifications y devuelve data + unreadCount', async () => {
    const response = {
      data: [{ id: 1, type: 'order_confirmed', title: 'Pedido confirmado', read: false }],
      unreadCount: 1,
    };
    mockedHttpClient.request.mockResolvedValueOnce(response);

    const result = await notificationService.getNotifications();

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/notifications');
    expect(options?.method).toBe('GET');
    expect(result).toBe(response);
    expect(result.data).toHaveLength(1);
    expect(result.unreadCount).toBe(1);
  });

  it('AC2: markRead(id) llama PATCH /notifications/{id}', async () => {
    const response = { message: 'Marcada como leída' };
    mockedHttpClient.request.mockResolvedValueOnce(response);

    const result = await notificationService.markRead(7);

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/notifications/7');
    expect(options?.method).toBe('PATCH');
    expect(result).toBe(response);
    expect(result.message).toBe('Marcada como leída');
  });

  it('AC3: markAllRead() llama POST /notifications/read-all', async () => {
    const response = { message: 'Todas marcadas como leídas' };
    mockedHttpClient.request.mockResolvedValueOnce(response);

    const result = await notificationService.markAllRead();

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/notifications/read-all');
    expect(options?.method).toBe('POST');
    expect(result.message).toBe('Todas marcadas como leídas');
  });
});
