import { queryClient } from '@/core/query/client';
import { chatKeys, orderKeys } from '@/core/query/keys';
import { runSessionResets } from '@/core/session/reset';

// Importing the module registers its session reset (side effect under test).
import '@/stores/order-store';

describe('order-store — limpieza de queries al cerrar sesión (T1)', () => {
  it('runSessionResets elimina las queries de pedidos y de chat', async () => {
    queryClient.setQueryData(orderKeys.list(1), { page: 1 });
    queryClient.setQueryData(chatKeys.conversations(), [{ folio: 'ORD-1' }]);

    expect(queryClient.getQueryData(orderKeys.list(1))).toBeDefined();
    expect(queryClient.getQueryData(chatKeys.conversations())).toBeDefined();

    await runSessionResets();

    expect(queryClient.getQueryData(orderKeys.list(1))).toBeUndefined();
    expect(queryClient.getQueryData(chatKeys.conversations())).toBeUndefined();
  });
});
