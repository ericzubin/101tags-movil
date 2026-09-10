import { create } from 'zustand';

import { cartService } from '@/core/services/cart-service';

import type { CartItem } from '@/core/models/cart.model';

export type CartStatus = 'idle' | 'loading' | 'error';

export interface CartState {
  items: CartItem[];
  status: CartStatus;
  error: string | null;
  fetchCart: () => Promise<void>;
  addItem: (variantId: number, quantity?: number) => Promise<void>;
  updateItem: (variantId: number, quantity: number) => Promise<void>;
  removeItem: (variantId: number) => Promise<void>;
  reset: () => void;
}

/**
 * Cart store — single source of truth for the cart UI (tab screen + badge).
 *
 * The server is the authority on price/stock; every mutation reconciles with
 * the `{ items }` snapshot the API returns. Optimistic mutations (add of an
 * existing variant, update, remove) snapshot the previous items and roll back
 * on failure, surfacing `status: 'error'` + `error`.
 *
 * Adding an *unknown* variant has no local product data to render optimistically,
 * so it goes straight to `POST /cart/sync` and adopts the response.
 *
 * @see .spec/2026-09-11-m3-1-cart.md §Store — comportamiento
 */
function toErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'No pudimos actualizar el carrito.';
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function withQuantity(item: CartItem, quantity: number): CartItem {
  return { ...item, quantity, lineTotal: round(item.price * quantity) };
}

/**
 * Monotonic sequence for cart mutations/fetches. A response is only applied
 * when it still belongs to the latest operation, so a slow request cannot
 * clobber the state produced by a newer one (#18).
 */
let cartMutationSeq = 0;

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  status: 'idle',
  error: null,

  fetchCart: async () => {
    const seq = ++cartMutationSeq;
    set({ status: 'loading', error: null });
    try {
      const { items } = await cartService.getCart();
      if (seq !== cartMutationSeq) return;
      set({ items, status: 'idle', error: null });
    } catch (err) {
      if (seq !== cartMutationSeq) return;
      set({ status: 'error', error: toErrorMessage(err) });
    }
  },

  addItem: async (variantId, quantity = 1) => {
    const existing = get().items.find((item) => item.variantId === variantId);

    if (!existing) {
      set({ status: 'loading', error: null });
      try {
        const { items } = await cartService.sync([{ variant_id: variantId, quantity }]);
        set({ items, status: 'idle', error: null });
      } catch (err) {
        set({ status: 'error', error: toErrorMessage(err) });
      }
      return;
    }

    const seq = ++cartMutationSeq;
    const previous = get().items;
    const nextQuantity = Math.min(existing.quantity + quantity, existing.stock);
    set({
      items: previous.map((item) =>
        item.variantId === variantId ? withQuantity(item, nextQuantity) : item,
      ),
      error: null,
    });

    try {
      const { items } = await cartService.updateItem(variantId, nextQuantity);
      if (seq !== cartMutationSeq) return;
      set({ items, status: 'idle', error: null });
    } catch (err) {
      if (seq !== cartMutationSeq) return;
      set({ items: previous, status: 'error', error: toErrorMessage(err) });
    }
  },

  updateItem: async (variantId, quantity) => {
    const seq = ++cartMutationSeq;
    const previous = get().items;
    const optimistic =
      quantity <= 0
        ? previous.filter((item) => item.variantId !== variantId)
        : previous.map((item) =>
            item.variantId === variantId ? withQuantity(item, quantity) : item,
          );
    set({ items: optimistic, error: null });

    try {
      const { items } = await cartService.updateItem(variantId, quantity);
      if (seq !== cartMutationSeq) return;
      set({ items, status: 'idle', error: null });
    } catch (err) {
      if (seq !== cartMutationSeq) return;
      set({ items: previous, status: 'error', error: toErrorMessage(err) });
    }
  },

  removeItem: async (variantId) => {
    const previous = get().items;
    set({
      items: previous.filter((item) => item.variantId !== variantId),
      error: null,
    });

    try {
      const { items } = await cartService.removeItem(variantId);
      set({ items, status: 'idle', error: null });
    } catch (err) {
      set({ items: previous, status: 'error', error: toErrorMessage(err) });
    }
  },

  reset: () => set({ items: [], status: 'idle', error: null }),
}));

export function selectTotalCount(state: Pick<CartState, 'items'>): number {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function selectTotalPrice(state: Pick<CartState, 'items'>): number {
  return state.items.reduce((sum, item) => sum + item.lineTotal, 0);
}
