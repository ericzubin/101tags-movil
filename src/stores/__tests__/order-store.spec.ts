import { HttpError } from '@/core/api/client';

import { useOrderStore } from '../order-store';

const mockRequestReturn = jest.fn();
const mockRequestCancellation = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock('@/core/services/order-service', () => ({
  orderService: {
    requestReturn: (...args: unknown[]) => mockRequestReturn(...args),
    requestCancellation: (...args: unknown[]) => mockRequestCancellation(...args),
  },
}));

jest.mock('@/core/query/client', () => ({
  queryClient: {
    invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args),
  },
}));

function resetStore() {
  useOrderStore.setState({
    returnSubmission: { status: 'idle', error: null, message: null, applied: false },
    cancellationSubmission: { status: 'idle', error: null, message: null, applied: false },
  });
}

describe('order-store — devoluciones/cancelaciones (M4.2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  it('AC1: submitCancellation exitoso guarda applied/message, invalida y devuelve true', async () => {
    mockRequestCancellation.mockResolvedValueOnce({
      message: 'Pedido cancelado',
      applied: true,
      data: { id: 9 },
    });

    const ok = await useOrderStore
      .getState()
      .submitCancellation('ORD-0001', { reason: 'Ya no lo quiero' });

    expect(ok).toBe(true);
    expect(mockRequestCancellation).toHaveBeenCalledWith('ORD-0001', { reason: 'Ya no lo quiero' });

    const state = useOrderStore.getState().cancellationSubmission;
    expect(state.status).toBe('success');
    expect(state.applied).toBe(true);
    expect(state.message).toBe('Pedido cancelado');
    expect(state.error).toBeNull();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['orders', 'returns'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['orders', 'detail', 'ORD-0001'],
    });
  });

  it('AC1: submitReturn exitoso guarda el message del backend', async () => {
    mockRequestReturn.mockResolvedValueOnce({
      message: 'Solicitud de devolución registrada',
      data: { id: 7 },
    });

    const ok = await useOrderStore
      .getState()
      .submitReturn('ORD-0002', { reason: 'Producto dañado', description: 'Llegó roto' });

    expect(ok).toBe(true);
    expect(mockRequestReturn).toHaveBeenCalledWith('ORD-0002', {
      reason: 'Producto dañado',
      description: 'Llegó roto',
    });

    const state = useOrderStore.getState().returnSubmission;
    expect(state.status).toBe('success');
    expect(state.message).toBe('Solicitud de devolución registrada');
  });

  it('AC4: 422/409/403 se guarda como error con el mensaje del backend (nunca success)', async () => {
    mockRequestReturn.mockRejectedValueOnce(
      new HttpError(422, 'Unprocessable Entity', {
        message: 'Este pedido no admite devolución en su estado actual.',
      }, 'HTTP 422'),
    );

    const ok = await useOrderStore.getState().submitReturn('ORD-0003', { reason: 'x' });

    expect(ok).toBe(false);
    const state = useOrderStore.getState().returnSubmission;
    expect(state.status).toBe('error');
    expect(state.error).toBe('Este pedido no admite devolución en su estado actual.');
    expect(state.message).toBeNull();
  });

  it('AC4: 403 sin body usa el mensaje fallback y no marca éxito', async () => {
    mockRequestCancellation.mockRejectedValueOnce(new HttpError(403, 'Forbidden', null, 'HTTP 403'));

    const ok = await useOrderStore
      .getState()
      .submitCancellation('ORD-0004', { reason: 'x' });

    expect(ok).toBe(false);
    const state = useOrderStore.getState().cancellationSubmission;
    expect(state.status).toBe('error');
    expect(state.error).toBeTruthy();
    expect(state.status).not.toBe('success');
  });

  it('AC6: anti-doble-submit — un submit en curso no dispara una segunda llamada', async () => {
    let resolveFirst: (value: { message: string; applied: boolean; data: unknown }) => void = () => {};
    mockRequestCancellation.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    );

    const first = useOrderStore.getState().submitCancellation('ORD-0005', { reason: 'x' });
    expect(useOrderStore.getState().cancellationSubmission.status).toBe('submitting');

    const second = await useOrderStore.getState().submitCancellation('ORD-0005', { reason: 'x' });
    expect(second).toBe(false);
    expect(mockRequestCancellation).toHaveBeenCalledTimes(1);

    resolveFirst({ message: 'Pedido cancelado', applied: true, data: {} });
    await expect(first).resolves.toBe(true);
  });

  it('resetReturnSubmission vuelve a idle y limpia error/message', () => {
    useOrderStore.setState({
      returnSubmission: { status: 'error', error: 'boom', message: null, applied: false },
    });

    useOrderStore.getState().resetReturnSubmission();

    expect(useOrderStore.getState().returnSubmission).toEqual({
      status: 'idle',
      error: null,
      message: null,
      applied: false,
    });
  });
});
