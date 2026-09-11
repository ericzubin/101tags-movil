import { create } from 'zustand';

import { HttpError } from '@/core/api/client';
import { queryClient } from '@/core/query/client';
import { chatKeys, orderKeys } from '@/core/query/keys';
import { orderService } from '@/core/services/order-service';
import { registerSessionReset } from '@/core/session/reset';
import { useAuthStore } from '@/stores/auth-store';

import type {
  OrderDetail,
  ReturnRequestInput,
  SupplierRatingInput,
  SupplierRatingResult,
} from '@/core/models/order.model';
import { isValidSupplierRating } from '@/core/models/order.model';

export type ReturnSubmissionStatus = 'idle' | 'submitting' | 'error' | 'success';

/** Supplier rating submission lifecycle (M4.3). */
export type SupplierRatingStatus = 'idle' | 'submitting' | 'error' | 'success';

const RATING_RANGE_ERROR = 'Selecciona una calificación de 1 a 5 estrellas.';
const RATING_FALLBACK_ERROR = 'No pudimos registrar tu calificación. Intenta de nuevo.';

/** Per-action submission state. `applied` is only meaningful for cancellations. */
export interface ReturnSubmission {
  status: ReturnSubmissionStatus;
  error: string | null;
  message: string | null;
  applied: boolean;
}

export interface OrderReturnsState {
  returnSubmission: ReturnSubmission;
  cancellationSubmission: ReturnSubmission;
  ratingStatus: SupplierRatingStatus;
  ratingError: string | null;
  ratingMessage: string | null;
  submitReturn: (orderNumber: string, input: ReturnRequestInput) => Promise<boolean>;
  submitCancellation: (orderNumber: string, input: ReturnRequestInput) => Promise<boolean>;
  submitRating: (orderNumber: string, input: SupplierRatingInput) => Promise<boolean>;
  resetReturnSubmission: () => void;
  resetCancellationSubmission: () => void;
  resetRatingSubmission: () => void;
}

export const IDLE_RETURN_SUBMISSION: ReturnSubmission = {
  status: 'idle',
  error: null,
  message: null,
  applied: false,
};

/**
 * Backend validation errors (`HttpError.body`) carry a human `message` we must
 * surface verbatim — never reinterpret a 403/409/422 as success (AC4).
 */
export function returnErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpError) {
    const body = err.body;
    if (
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof (body as { message?: unknown }).message === 'string' &&
      (body as { message: string }).message
    ) {
      return (body as { message: string }).message;
    }
    return fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function currentUserId(): string | number | null {
  return useAuthStore.getState().user?.id ?? null;
}

function invalidateAfterSubmit(orderNumber: string): void {
  const userId = currentUserId();
  void queryClient.invalidateQueries({ queryKey: orderKeys.returns(userId) });
  void queryClient.invalidateQueries({ queryKey: orderKeys.list(userId) });
  void queryClient.invalidateQueries({ queryKey: orderKeys.detail(userId, orderNumber) });
}

/**
 * Reflects a successful rating in the cached order detail so the screen shows
 * "ya calificado" without waiting for a refetch (AC6).
 */
function applyRatingToDetail(orderNumber: string, result: SupplierRatingResult): void {
  const userId = currentUserId();
  queryClient.setQueryData<OrderDetail | undefined>(orderKeys.detail(userId, orderNumber), (prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      supplierRating: {
        ...result.supplierRating,
        hasRated: true,
      },
    };
  });
  void queryClient.invalidateQueries({ queryKey: orderKeys.list(userId) });
  void queryClient.invalidateQueries({ queryKey: orderKeys.detail(userId, orderNumber) });
}

/**
 * Order returns/cancellations submission state. Each action owns an isolated
 * `idle|submitting|error|success` slot and refuses to re-enter while in flight
 * (anti-double-submit, AC6). Success/error messages come from the backend.
 *
 * @see .spec/2026-09-11-m4-2-returns.md §Arquitectura
 */
export const useOrderStore = create<OrderReturnsState>((set, get) => ({
  returnSubmission: { ...IDLE_RETURN_SUBMISSION },
  cancellationSubmission: { ...IDLE_RETURN_SUBMISSION },
  ratingStatus: 'idle',
  ratingError: null,
  ratingMessage: null,

  submitReturn: async (orderNumber, input) => {
    if (get().returnSubmission.status === 'submitting') return false;

    set({
      returnSubmission: { status: 'submitting', error: null, message: null, applied: false },
    });

    try {
      const result = await orderService.requestReturn(orderNumber, input);
      set({
        returnSubmission: {
          status: 'success',
          error: null,
          message: result.message,
          applied: false,
        },
      });
      invalidateAfterSubmit(orderNumber);
      return true;
    } catch (err) {
      set({
        returnSubmission: {
          status: 'error',
          error: returnErrorMessage(err, 'No pudimos registrar tu devolución. Intenta de nuevo.'),
          message: null,
          applied: false,
        },
      });
      return false;
    }
  },

  submitCancellation: async (orderNumber, input) => {
    if (get().cancellationSubmission.status === 'submitting') return false;

    set({
      cancellationSubmission: { status: 'submitting', error: null, message: null, applied: false },
    });

    try {
      const result = await orderService.requestCancellation(orderNumber, input);
      set({
        cancellationSubmission: {
          status: 'success',
          error: null,
          message: result.message,
          applied: result.applied,
        },
      });
      invalidateAfterSubmit(orderNumber);
      return true;
    } catch (err) {
      set({
        cancellationSubmission: {
          status: 'error',
          error: returnErrorMessage(err, 'No pudimos cancelar tu pedido. Intenta de nuevo.'),
          message: null,
          applied: false,
        },
      });
      return false;
    }
  },

  submitRating: async (orderNumber, input) => {
    if (get().ratingStatus === 'submitting') return false;

    if (!isValidSupplierRating(input.rating)) {
      set({ ratingStatus: 'error', ratingError: RATING_RANGE_ERROR, ratingMessage: null });
      return false;
    }

    set({ ratingStatus: 'submitting', ratingError: null, ratingMessage: null });

    try {
      const result = await orderService.submitRating(orderNumber, input);
      set({ ratingStatus: 'success', ratingError: null, ratingMessage: result.message });
      applyRatingToDetail(orderNumber, result);
      return true;
    } catch (err) {
      set({
        ratingStatus: 'error',
        ratingError: returnErrorMessage(err, RATING_FALLBACK_ERROR),
        ratingMessage: null,
      });
      return false;
    }
  },

  resetReturnSubmission: () => set({ returnSubmission: { ...IDLE_RETURN_SUBMISSION } }),
  resetCancellationSubmission: () =>
    set({ cancellationSubmission: { ...IDLE_RETURN_SUBMISSION } }),
  resetRatingSubmission: () =>
    set({ ratingStatus: 'idle', ratingError: null, ratingMessage: null }),
}));

/**
 * Wipe every session-scoped query cache on logout so user B never reads user A's
 * orders/returns/details (TanStack staleTime 30s/gcTime 5m would otherwise serve
 * them). Registered at import time; executed by `auth-store.clearSession`.
 */
registerSessionReset(() => {
  void queryClient.cancelQueries();
  queryClient.removeQueries({ queryKey: orderKeys.all });
  queryClient.removeQueries({ queryKey: chatKeys.all });
});
