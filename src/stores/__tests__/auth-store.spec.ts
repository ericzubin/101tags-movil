import { AuthError, type AuthSession } from '@/core/models/auth';
import { authService } from '@/core/services/auth-service';
import { useAuthStore } from '@/stores/auth-store';

jest.mock('@/core/services/auth-service', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    persistSession: jest.fn(),
    clearPersistedSession: jest.fn(),
    getStoredToken: jest.fn(),
    getStoredUser: jest.fn(),
    handleUnauthorized: jest.fn(),
    setUnauthorizedHandler: jest.fn(),
  },
}));

const mockedAuthService = authService as jest.Mocked<typeof authService>;

const baseUser = { id: 1, name: 'Ana', email: 'a@x.com', phone: null };
const baseSession: AuthSession = { access_token: 'tok-abc', user: baseUser };

describe('auth-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, token: null, isHydrated: false, isLoading: false });
  });

  it('starts with null user/token and not hydrated', () => {
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.token).toBeNull();
    expect(s.isHydrated).toBe(false);
    expect(s.isLoading).toBe(false);
  });

  it('setSession delegates to authService.persistSession and updates memory', async () => {
    await useAuthStore.getState().setSession(baseSession);

    expect(mockedAuthService.persistSession).toHaveBeenCalledWith(baseSession);
    const s = useAuthStore.getState();
    expect(s.token).toBe('tok-abc');
    expect(s.user).toEqual(baseUser);
    expect(s.isHydrated).toBe(true);
  });

  it('clearSession delegates to authService.clearPersistedSession and clears memory', async () => {
    useAuthStore.setState({ user: baseUser, token: 'tok-abc', isHydrated: true });
    await useAuthStore.getState().clearSession();

    expect(mockedAuthService.clearPersistedSession).toHaveBeenCalledTimes(1);
    const s = useAuthStore.getState();
    expect(s.token).toBeNull();
    expect(s.user).toBeNull();
  });

  it('hydrate reads token + user in parallel and toggles isLoading', async () => {
    mockedAuthService.getStoredToken.mockResolvedValueOnce('restored-tok');
    mockedAuthService.getStoredUser.mockResolvedValueOnce(baseUser);

    const promise = useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().isLoading).toBe(true);

    await promise;
    const s = useAuthStore.getState();
    expect(s.token).toBe('restored-tok');
    expect(s.user).toEqual(baseUser);
    expect(s.isHydrated).toBe(true);
    expect(s.isLoading).toBe(false);
    expect(mockedAuthService.getStoredToken).toHaveBeenCalledTimes(1);
    expect(mockedAuthService.getStoredUser).toHaveBeenCalledTimes(1);
  });

  it('hydrate handles no stored credentials', async () => {
    mockedAuthService.getStoredToken.mockResolvedValueOnce(null);
    mockedAuthService.getStoredUser.mockResolvedValueOnce(null);

    await useAuthStore.getState().hydrate();

    const s = useAuthStore.getState();
    expect(s.token).toBeNull();
    expect(s.user).toBeNull();
    expect(s.isHydrated).toBe(true);
  });

  it('login delegates to authService.login and updates memory on success', async () => {
    mockedAuthService.login.mockResolvedValueOnce(baseSession);

    await useAuthStore.getState().login('a@x.com', 'pwd');

    expect(mockedAuthService.login).toHaveBeenCalledWith('a@x.com', 'pwd');
    const s = useAuthStore.getState();
    expect(s.user).toEqual(baseUser);
    expect(s.token).toBe('tok-abc');
    expect(s.isLoading).toBe(false);
  });

  it('login re-throws AuthError and clears isLoading on failure', async () => {
    const err = new AuthError('INVALID_CREDENTIALS', 'Invalid', 401);
    mockedAuthService.login.mockRejectedValueOnce(err);

    await expect(useAuthStore.getState().login('a@x.com', 'wrong')).rejects.toBe(err);
    const s = useAuthStore.getState();
    expect(s.isLoading).toBe(false);
    expect(s.token).toBeNull();
  });

  it('register delegates to authService.register and updates memory', async () => {
    mockedAuthService.register.mockResolvedValueOnce(baseSession);

    await useAuthStore
      .getState()
      .register({ name: 'Ana', email: 'a@x.com', password: 'p', password_confirmation: 'p' });

    expect(mockedAuthService.register).toHaveBeenCalledWith({
      name: 'Ana',
      email: 'a@x.com',
      password: 'p',
      password_confirmation: 'p',
    });
    const s = useAuthStore.getState();
    expect(s.user).toEqual(baseUser);
    expect(s.token).toBe('tok-abc');
  });

  it('logout delegates to authService.logout and clears memory', async () => {
    useAuthStore.setState({ user: baseUser, token: 'tok-abc', isHydrated: true });
    mockedAuthService.logout.mockResolvedValueOnce(undefined);

    await useAuthStore.getState().logout();

    expect(mockedAuthService.logout).toHaveBeenCalledTimes(1);
    const s = useAuthStore.getState();
    expect(s.token).toBeNull();
    expect(s.user).toBeNull();
    expect(s.isHydrated).toBe(true);
  });
});
