import { AuthError } from '@/core/models/auth';
import { formatAuthError } from '@/core/i18n/errors';

describe('formatAuthError', () => {
  it('returns es-MX message for INVALID_CREDENTIALS', () => {
    const err = new AuthError('INVALID_CREDENTIALS', 'Internal server detail', 401);
    expect(formatAuthError(err)).toBe('Correo o contraseña incorrectos.');
  });

  it('returns es-MX message for VALIDATION_ERROR', () => {
    const err = new AuthError('VALIDATION_ERROR', 'Internal detail', 422, {
      email: ['required'],
    });
    expect(formatAuthError(err)).toBe('Revisa los campos marcados.');
  });

  it('returns es-MX message for RATE_LIMITED', () => {
    const err = new AuthError('RATE_LIMITED', 'Internal detail', 429);
    expect(formatAuthError(err)).toBe('Demasiados intentos. Intenta de nuevo en unos minutos.');
  });

  it('returns es-MX message for SERVER_ERROR', () => {
    const err = new AuthError('SERVER_ERROR', 'Internal detail', 500);
    expect(formatAuthError(err)).toBe('No pudimos contactar al servidor. Intenta más tarde.');
  });

  it('returns es-MX message for NETWORK_ERROR', () => {
    const err = new AuthError('NETWORK_ERROR', 'Internal detail', 0);
    expect(formatAuthError(err)).toBe('Sin conexión. Verifica tu internet.');
  });

  it('returns es-MX message for CANCELED (M1.6 AC9)', () => {
    const err = new AuthError('CANCELED', 'Internal detail', 0);
    expect(formatAuthError(err)).toBe('Operación cancelada.');
  });

  it('returns es-MX message for UNKNOWN', () => {
    const err = new AuthError('UNKNOWN', 'Internal detail', 0);
    expect(formatAuthError(err)).toBe('Algo salió mal. Intenta de nuevo.');
  });

  it('hides internal error.message and exposes only the user-facing UX string', () => {
    const err = new AuthError('INVALID_CREDENTIALS', 'SHOULD-NOT-LEAK', 401);
    const formatted = formatAuthError(err);
    expect(formatted).not.toContain('SHOULD-NOT-LEAK');
    expect(formatted).toBe('Correo o contraseña incorrectos.');
  });

  it('never bundles the bearer token or status code into the user-facing message', () => {
    const err = new AuthError('INVALID_CREDENTIALS', 'whatever', 401);
    const formatted = formatAuthError(err);
    expect(formatted).not.toMatch(/\b401\b/);
    expect(formatted).not.toMatch(/bearer/i);
  });
});
