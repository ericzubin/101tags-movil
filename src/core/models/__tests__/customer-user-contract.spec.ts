import type { AuthSession, CustomerUser } from '@/core/models/auth';

describe('CustomerUser contract — backend alignment (AC1-AC3)', () => {
  it('CustomerUser has role (backend emits it; mobile reads it)', () => {
    const u: CustomerUser = {
      id: 1,
      name: 'Ana',
      email: 'a@x.com',
      phone: null,
      role: 'customer',
    };
    expect(u.role).toBe('customer');
  });

  it('CustomerUser accepts role "admin" for staff tokens (admin endpoints reuse shape)', () => {
    const u: CustomerUser = {
      id: 7,
      name: 'Mau',
      email: 'admin@x.com',
      phone: '+5255...',
      role: 'admin',
    };
    expect(u.role).toBe('admin');
  });

  it('CustomerUser omits legacy snake_case fields (email_verified_at/created_at/updated_at)', () => {
    const u = {} as CustomerUser;
    expect((u as unknown as Record<string, unknown>).email_verified_at).toBeUndefined();
    expect((u as unknown as Record<string, unknown>).created_at).toBeUndefined();
    expect((u as unknown as Record<string, unknown>).updated_at).toBeUndefined();
  });

  it('AuthSession uses accessToken (camelCase) — snake_case removed', () => {
    const session: AuthSession = {
      accessToken: 'tok-abc',
      user: { id: 1, name: 'Ana', email: 'a@x.com', phone: null, role: 'customer' },
      expires_at: '2026-12-31T00:00:00Z',
    };
    expect(session.accessToken).toBe('tok-abc');
    expect(
      (session as unknown as Record<string, unknown>).access_token,
    ).toBeUndefined();
  });
});
