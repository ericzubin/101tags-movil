import type { AuthError, AuthErrorCode } from '@/core/models/auth';

/**
 * UX-facing translations for `AuthError` codes.
 *
 * Source of truth: `.spec/2026-09-09-m1-3-login-register-ux.md §AuthError UX mapping`.
 * Language: Spanish (Mexico) — `es-MX`. Translation is hardcoded for the MVP;
 * future i18n will replace this map with a real i18n runtime.
 *
 * Never expose `error.message` / `status` / anything from the wire to the user.
 * This map is the only surface that translates server errors into user-facing copy.
 */
const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  VALIDATION_ERROR: 'Revisa los campos marcados.',
  RATE_LIMITED: 'Demasiados intentos. Intenta de nuevo en unos minutos.',
  SERVER_ERROR: 'No pudimos contactar al servidor. Intenta más tarde.',
  NETWORK_ERROR: 'Sin conexión. Verifica tu internet.',
  TOKEN_EXPIRED: 'Tu sesión expiró. Inicia sesión de nuevo.',
  CANCELED: 'Operación cancelada.',
  UNKNOWN: 'Algo salió mal. Intenta de nuevo.',
};

export function formatAuthError(error: AuthError): string {
  return AUTH_ERROR_MESSAGES[error.code] ?? AUTH_ERROR_MESSAGES.UNKNOWN;
}

export const __test__ = { AUTH_ERROR_MESSAGES };
