import type { CustomerUser } from '@/core/models/auth';
import { isAuthenticated } from '@/stores/auth-store';

const baseUser: CustomerUser = {
  id: 1,
  name: 'Ana',
  email: 'a@x.com',
  phone: null,
  role: 'customer',
};

describe('isAuthenticated helper (AC9)', () => {
  it('returns false when token is set but user is null', () => {
    expect(isAuthenticated({ token: 't1', user: null })).toBe(false);
  });

  it('returns false when user is set but token is null', () => {
    expect(isAuthenticated({ token: null, user: baseUser })).toBe(false);
  });

  it('returns false when both token and user are null', () => {
    expect(isAuthenticated({ token: null, user: null })).toBe(false);
  });

  it('returns true when both token and user are present', () => {
    expect(isAuthenticated({ token: 't1', user: baseUser })).toBe(true);
  });

  it('treats empty string token as missing', () => {
    expect(isAuthenticated({ token: '', user: baseUser })).toBe(false);
  });
});
