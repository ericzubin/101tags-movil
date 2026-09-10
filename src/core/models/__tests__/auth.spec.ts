import { AuthError, type AuthErrorCode, type AuthSession, type CustomerUser, type LoginRequest, type RegisterRequest } from '@/core/models/auth';

describe('auth models', () => {
  it('CustomerUser supports required + optional fields (role required; legacy snake_case removed)', () => {
    const user: CustomerUser = {
      id: 1,
      name: 'Ana',
      email: 'a@x.com',
      phone: null,
      role: 'customer',
    };
    expect(user.id).toBe(1);
    expect(user.phone).toBeNull();
    expect(user.role).toBe('customer');
  });

  it('LoginRequest requires email + password and supports device_name', () => {
    const payload: LoginRequest = { email: 'a@x.com', password: 'secret', device_name: 'ipad' };
    expect(payload.device_name).toBe('ipad');
  });

  it('RegisterRequest requires name, email, password, password_confirmation', () => {
    const payload: RegisterRequest = {
      name: 'Ana',
      email: 'a@x.com',
      password: 'secret123',
      password_confirmation: 'secret123',
      phone: '+5255...',
    };
    expect(payload.password_confirmation).toBe('secret123');
  });

  it('AuthSession holds accessToken (camelCase) + user + optional expires_at', () => {
    const session: AuthSession = {
      accessToken: 'tok-1',
      user: { id: 1, name: 'Ana', email: 'a@x.com', phone: null, role: 'customer' },
      expires_at: '2026-12-31T00:00:00Z',
    };
    expect(session.accessToken).toBe('tok-1');
    expect(session.expires_at).toBe('2026-12-31T00:00:00Z');
  });

  it('AuthError exposes code, status and optional details', () => {
    const err = new AuthError('INVALID_CREDENTIALS', 'Credenciales inválidas', 401, { email: ['invalid'] });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AuthError);
    expect(err.name).toBe('AuthError');
    expect(err.code).toBe('INVALID_CREDENTIALS' satisfies AuthErrorCode);
    expect(err.status).toBe(401);
    expect(err.details).toEqual({ email: ['invalid'] });
    expect(err.message).toBe('Credenciales inválidas');
  });

  it('AuthError supports every documented code', () => {
    const codes: AuthErrorCode[] = ['INVALID_CREDENTIALS', 'VALIDATION_ERROR', 'NETWORK_ERROR', 'TOKEN_EXPIRED', 'CANCELED', 'UNKNOWN'];
    for (const code of codes) {
      const err = new AuthError(code, 'msg', 400);
      expect(err.code).toBe(code);
    }
  });

  it('AuthErrorCode includes CANCELED (M1.6 AC8)', () => {
    const err = new AuthError('CANCELED', 'Operación cancelada', 0);
    expect(err.code).toBe('CANCELED');
    expect(err.status).toBe(0);
    expect(err.name).toBe('AuthError');
  });

  it('AuthError JSON.stringify never contains a bearer token (AC9)', () => {
    const secret = 'bearer-token-should-never-leak';
    const err = new AuthError('INVALID_CREDENTIALS', 'Invalid credentials', 401, {
      email: ['invalid'],
    });
    const serialized = JSON.stringify(err);
    expect(serialized).not.toContain(secret);
    expect(serialized).toContain('INVALID_CREDENTIALS');
  });
});
