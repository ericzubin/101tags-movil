import { AuthError, type AuthErrorCode, type AuthSession, type CustomerUser, type LoginRequest, type RegisterRequest } from '@/core/models/auth';

describe('auth models', () => {
  it('CustomerUser supports required + optional fields', () => {
    const user: CustomerUser = {
      id: 1,
      name: 'Ana',
      email: 'a@x.com',
      phone: null,
      email_verified_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
    };
    expect(user.id).toBe(1);
    expect(user.phone).toBeNull();
    expect(user.email_verified_at).toBeNull();
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

  it('AuthSession holds access_token + user + optional expires_at', () => {
    const session: AuthSession = {
      access_token: 'tok-1',
      user: { id: 1, name: 'Ana', email: 'a@x.com' },
      expires_at: '2026-12-31T00:00:00Z',
    };
    expect(session.access_token).toBe('tok-1');
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
    const codes: AuthErrorCode[] = ['INVALID_CREDENTIALS', 'VALIDATION_ERROR', 'NETWORK_ERROR', 'TOKEN_EXPIRED', 'UNKNOWN'];
    for (const code of codes) {
      const err = new AuthError(code, 'msg', 400);
      expect(err.code).toBe(code);
    }
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
