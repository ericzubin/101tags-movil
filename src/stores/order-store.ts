import { create } from 'zustand';

import { HttpError } from '@/core/api/client';
import { queryClient } from '@/core/query/client';
import { orderKeys } from '@/core/query/keys';
import { orderService } from '@/core/services/order-service';

import type { ReturnRequestInput } from '@/core/models/order.model';

export type ReturnSubmissionStatus = 'idle' | 'submitting' | 'error' | 'success';

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
  submitReturn: (orderNumber: string, input: ReturnRequestInput) => Promise<boolean>;
  submitCancellation: (orderNumber: string, input: ReturnRequestInput) => Promise<boolean>;
  resetReturnSubmission: () => void;
  resetCancellationSubmission: () => void;
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

function invalidateAfterSubmit(orderNumber: string): void {
  void queryClient.invalidateQueries({ queryKey: orderKeys.returns() });
  void queryClient.invalidateQueries({ queryKey: orderKeys.list() });
  void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderNumber) });
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

  resetReturnSubmission: () => set({ returnSubmission: { ...IDLE_RETURN_SUBMISSION } }),
  resetCancellationSubmission: () =>
    set({ cancellationSubmission: { ...IDLE_RETURN_SUBMISSION } }),
}));
