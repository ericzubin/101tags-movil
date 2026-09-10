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

/**
 * Recording double for FormData. The test runtime (undici) stringifies plain
 * objects, while React Native's runtime keeps the `{ uri, name, type }` object
 * intact — so we substitute a double that preserves the raw parts.
 */
class RecordingFormData {
  readonly parts: [string, unknown][] = [];
  append(name: string, value: unknown): void {
    this.parts.push([name, value]);
  }
  getAll(name: string): unknown[] {
    return this.parts.filter(([key]) => key === name).map(([, value]) => value);
  }
}

const realFormData = globalThis.FormData;

function formValues(form: FormData, name: string): unknown[] {
  return (form as unknown as RecordingFormData).getAll(name);
}

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

describe('chatService — adjuntos (M5.2)', () => {
  const asset = {
    uri: 'file:///tmp/comprobante.pdf',
    name: 'comprobante.pdf',
    type: 'application/pdf',
    size: 4096,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as unknown as { FormData: unknown }).FormData = RecordingFormData;
  });

  afterEach(() => {
    (globalThis as unknown as { FormData: unknown }).FormData = realFormData;
  });

  it('AC1: sendAttachment hace POST multipart con attachment + type + body', async () => {
    const response = {
      message: 'Archivo enviado',
      data: {
        id: 12,
        type: 'proof_of_payment',
        body: 'Comprobante de pago',
        attachment: {
          id: 5,
          originalName: 'comprobante.pdf',
          mimeType: 'application/pdf',
          size: 4096,
          downloadUrl: 'https://tags.test/private/5',
        },
        createdAt: '2026-09-11T10:05:00Z',
      },
    };
    mockedHttpClient.request.mockResolvedValueOnce(response);

    const result = await chatService.sendAttachment('ORD-0001', asset, {
      type: 'proof_of_payment',
      body: 'Comprobante de pago',
    });

    const [path, options] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/orders/ORD-0001/messages/attachments');
    expect(options?.method).toBe('POST');
    expect(options?.body).toBeInstanceOf(FormData);

    const form = options?.body as FormData;
    expect(formValues(form, 'attachment')[0]).toEqual({
      uri: asset.uri,
      name: asset.name,
      type: asset.type,
    });
    expect(formValues(form, 'type')[0]).toBe('proof_of_payment');
    expect(formValues(form, 'body')[0]).toBe('Comprobante de pago');
    // The runtime must set the multipart boundary: never a manual Content-Type.
    expect(options?.headers ?? {}).not.toHaveProperty('Content-Type');
    expect(result).toBe(response);
    expect(result.data.attachment?.downloadUrl).toBe('https://tags.test/private/5');
  });

  it('AC1: sin opciones solo envía attachment (ni type ni body)', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ message: 'ok', data: { id: 1 } });

    await chatService.sendAttachment('ORD-0001', asset);

    const [, options] = mockedHttpClient.request.mock.calls[0];
    const form = options?.body as FormData;
    expect(formValues(form, 'attachment')).toHaveLength(1);
    expect(formValues(form, 'type')).toHaveLength(0);
    expect(formValues(form, 'body')).toHaveLength(0);
  });

  it('AC1: usa application/octet-stream cuando el picker no da MIME', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ message: 'ok', data: { id: 1 } });

    await chatService.sendAttachment('ORD-0001', { ...asset, type: null });

    const [, options] = mockedHttpClient.request.mock.calls[0];
    const form = options?.body as FormData;
    expect(formValues(form, 'attachment')[0]).toMatchObject({
      type: 'application/octet-stream',
    });
  });

  it('AC1: sendAttachment encoda el orderNumber', async () => {
    mockedHttpClient.request.mockResolvedValueOnce({ message: 'ok', data: { id: 1 } });

    await chatService.sendAttachment('A/B', asset);

    const [path] = mockedHttpClient.request.mock.calls[0];
    expect(path).toBe('/orders/A%2FB/messages/attachments');
  });
});
