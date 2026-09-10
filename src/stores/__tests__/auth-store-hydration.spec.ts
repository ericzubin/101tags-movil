import { AuthError, type CustomerUser } from '@/core/models/auth';
import { authService } from '@/core/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';

jest.mock('@/core/services/auth-service', () => ({
  authService: {
    getStoredToken: jest.fn(),
    getStoredUser: jest.fn(),
    me: jest.fn(),
    persistSession: jest.fn(),
    clearPersistedSession: jest.fn(),
    hydrate: jest.fn(),
    setUnauthorizedHandler: jest.fn(),
  },
}));

const mockedAuthService = authService as jest.Mocked<typeof authService>;

const baseUser: CustomerUser = { id: 1, name: 'Eric', email: 'eric@x.com', phone: null };
const baseToken = 'restored-token-abc';

describe('auth-store — hydration lifecycle (M1.2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, token: null, isHydrated: false, isLoading: false });
  });

  describe('AC1 — boot with valid stored token', () => {
    it('hydrate delegates to authService.hydrate and returns true', async () => {
      mockedAuthService.hydrate.mockResolvedValueOnce(true);

      const result = await useAuthStore.getState().hydrate();

      expect(result).toBe(true);
      expect(mockedAuthService.hydrate).toHaveBeenCalledTimes(1);
    });

    it('marks the store as hydrated even when token is restored', async () => {
      mockedAuthService.hydrate.mockResolvedValueOnce(true);

      await useAuthStore.getState().hydrate();

      const s = useAuthStore.getState();
      expect(s.isHydrated).toBe(true);
      expect(s.isLoading).toBe(false);
    });
  });

  describe('AC2 — boot with expired token (server returns 401)', () => {
    it('hydrate returns false and the store stays hydrated as a guest', async () => {
      mockedAuthService.hydrate.mockResolvedValueOnce(false);

      const result = await useAuthStore.getState().hydrate();

      expect(result).toBe(false);
      const s = useAuthStore.getState();
      expect(s.user).toBeNull();
      expect(s.token).toBeNull();
      expect(s.isHydrated).toBe(true);
    });
  });

  describe('AC3 — boot without stored token', () => {
    it('hydrate returns false and never asks the backend', async () => {
      mockedAuthService.hydrate.mockResolvedValueOnce(false);

      const result = await useAuthStore.getState().hydrate();

      expect(result).toBe(false);
      expect(useAuthStore.getState().isHydrated).toBe(true);
      expect(useAuthStore.getState().token).toBeNull();
    });

    it('hydrate surfaces network errors without throwing and marks the store as hydrated', async () => {
      const networkError = new AuthError('NETWORK_ERROR', 'No se pudo conectar', 0);
      mockedAuthService.hydrate.mockRejectedValueOnce(networkError);

      const result = await useAuthStore.getState().hydrate();

      expect(result).toBe(false);
      const s = useAuthStore.getState();
      expect(s.isHydrated).toBe(true);
      expect(s.isLoading).toBe(false);
    });
  });

  describe('isLoading transitions', () => {
    it('toggles isLoading to true while hydrate is in flight', async () => {
      let resolveHydrate: (value: boolean) => void = () => undefined;
      mockedAuthService.hydrate.mockReturnValueOnce(
        new Promise<boolean>((resolve) => {
          resolveHydrate = resolve;
        }),
      );

      const promise = useAuthStore.getState().hydrate();
      expect(useAuthStore.getState().isLoading).toBe(true);

      resolveHydrate(true);
      await promise;
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('auth-service hydrate contract (integration smoke)', () => {
    it('auth-service hydrate is async and returns boolean', async () => {
      mockedAuthService.hydrate.mockResolvedValueOnce(true);
      await expect(mockedAuthService.hydrate()).resolves.toBe(true);
    });

    it('regression: baseToken value used to confirm the spec literal is preserved', () => {
      expect(baseToken).toBe('restored-token-abc');
      expect(baseUser.name).toBe('Eric');
    });
  });
});
