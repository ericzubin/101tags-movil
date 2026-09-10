import { authGuard, guestGuard } from '@/core/navigation/guards';

describe('navigation guards', () => {
  describe('authGuard', () => {
    it('returns true while not yet hydrated (splash phase)', () => {
      expect(authGuard({ isAuthenticated: false, isHydrated: false })).toBe(true);
    });

    it('returns true while hydrating even if a stale token existed in memory', () => {
      expect(authGuard({ isAuthenticated: true, isHydrated: false })).toBe(true);
    });

    it('returns true when authenticated and hydrated', () => {
      expect(authGuard({ isAuthenticated: true, isHydrated: true })).toBe(true);
    });

    it('redirects to login when not authenticated and hydration finished', () => {
      expect(authGuard({ isAuthenticated: false, isHydrated: true })).toEqual({
        redirect: '/(auth)/login',
      });
    });
  });

  describe('guestGuard', () => {
    it('returns true while not yet hydrated (splash phase)', () => {
      expect(guestGuard({ isAuthenticated: false, isHydrated: false })).toBe(true);
    });

    it('returns true when not authenticated and hydrated', () => {
      expect(guestGuard({ isAuthenticated: false, isHydrated: true })).toBe(true);
    });

    it('redirects to tabs when authenticated and hydrated', () => {
      expect(guestGuard({ isAuthenticated: true, isHydrated: true })).toEqual({
        redirect: '/(tabs)',
      });
    });

    it('does NOT redirect an authenticated user away while still hydrating', () => {
      expect(guestGuard({ isAuthenticated: true, isHydrated: false })).toBe(true);
    });
  });

  describe('no redirect loops (AC10)', () => {
    it('authGuard redirect target is allowed by guestGuard when not authenticated', () => {
      const authDecision = authGuard({ isAuthenticated: false, isHydrated: true });
      expect(authDecision).not.toBe(true);
      if (authDecision !== true) {
        const guestDecision = guestGuard({ isAuthenticated: false, isHydrated: true });
        expect(guestDecision).toBe(true);
      }
    });

    it('guestGuard redirect target is allowed by authGuard when authenticated', () => {
      const guestDecision = guestGuard({ isAuthenticated: true, isHydrated: true });
      expect(guestDecision).not.toBe(true);
      if (guestDecision !== true) {
        const authDecision = authGuard({ isAuthenticated: true, isHydrated: true });
        expect(authDecision).toBe(true);
      }
    });
  });
});
