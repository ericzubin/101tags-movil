import { chatService } from '@/core/services/chat-service';
import { httpClient } from '@/core/api/client';

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

describe('chatService (M5.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AC1: getConversations() llama GET /conversations y devuelve la lista', async () => {
    const response = {
      data: [
        {
          orderNumber: 'ORD-0001',
          orderStatus: 'shipped',
          orderTotal: 1250.5,
          orderCreatedAt: '2026-09-10T18:00:00Z',
          lastMessage: {
            body: '¿Cuándo llega?',
            senderRole: 'customer',
            createdAt: '2026-09-11T10:00:00Z',
            isMine: true,
          },
        },
      ],
    };
    mockedHttpClient.request.mockResolvedValueOnce(response);

    const result = await chatService.getConversations();

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/conversations');
    expect(options?.method).toBe('GET');
    expect(result).toBe(response);
    expect(result.data[0].orderNumber).toBe('ORD-0001');
    expect(result.data[0].lastMessage?.body).toBe('¿Cuándo llega?');
  });

  it('AC2: getConversation(orderNumber) llama GET /orders/{n}/messages', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ orderNumber: 'ORD-0001', messages: [] });

    await chatService.getConversation('ORD-0001');

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/orders/ORD-0001/messages');
    expect(options?.method).toBe('GET');
  });

  it('AC2: getConversation encoda caracteres especiales del orderNumber', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({});

    await chatService.getConversation('A/B');

    const [path] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/orders/A%2FB/messages');
  });

  it('AC4: sendMessage() llama POST /orders/{n}/messages con { body }', async () => {
    const response = {
      message: 'Mensaje enviado',
      data: {
        id: 9,
        body: 'Hola',
        senderRole: 'customer',
        type: 'text',
        metadata: null,
        createdAt: '2026-09-11T10:05:00Z',
      },
    };
    mockedHttpClient.request.mockResolvedValueOnce(response);

    const result = await chatService.sendMessage('ORD-0001', 'Hola');

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/orders/ORD-0001/messages');
    expect(options?.method).toBe('POST');
    expect(options?.body).toEqual({ body: 'Hola' });
    expect(result).toBe(response);
    expect(result.data.id).toBe(9);
  });

  it('AC4: sendMessage encoda el orderNumber', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ message: 'ok', data: {} });

    await chatService.sendMessage('A/B', 'Hola');

    const [path] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/orders/A%2FB/messages');
  });
});
