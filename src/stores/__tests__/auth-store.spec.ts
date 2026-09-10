import * as SecureStore from 'expo-secure-store';

import { useAuthStore } from '@/stores/auth-store';

describe('auth-store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    useAuthStore.setState({ user: null, token: null, isHydrated: false, isLoading: false });
  });

  it('starts with null user/token and not hydrated', () => {
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.token).toBeNull();
    expect(s.isHydrated).toBe(false);
  });

  it('setSession persists token + user via secure-store', async () => {
    const user = { id: 1, name: 'Ana', email: 'a@x.com', phone: null, role: 'customer' as const };
    await useAuthStore.getState().setSession('tok-abc', user);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('101tags.auth.token', 'tok-abc');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      '101tags.auth.user',
      JSON.stringify(user),
    );
    const s = useAuthStore.getState();
    expect(s.token).toBe('tok-abc');
    expect(s.user).toEqual(user);
    expect(s.isHydrated).toBe(true);
  });

  it('clearSession wipes memory + secure-store', async () => {
    useAuthStore.setState({ user: { id: 1, name: 'X', email: 'x@x.com', phone: null, role: 'customer' }, token: 't' });
    await useAuthStore.getState().clearSession();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.user');
    const s = useAuthStore.getState();
    expect(s.token).toBeNull();
    expect(s.user).toBeNull();
  });

  it('hydrate restores session from secure-store', async () => {
    const user = { id: 7, name: 'Beto', email: 'b@x.com', phone: '+5255...', role: 'customer' as const };
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
      if (key === '101tags.auth.token') return 'restored-tok';
      if (key === '101tags.auth.user') return JSON.stringify(user);
      return null;
    });

    await useAuthStore.getState().hydrate();
    const s = useAuthStore.getState();
    expect(s.token).toBe('restored-tok');
    expect(s.user).toEqual(user);
    expect(s.isHydrated).toBe(true);
  });

  it('hydrate handles no stored credentials', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    await useAuthStore.getState().hydrate();
    const s = useAuthStore.getState();
    expect(s.token).toBeNull();
    expect(s.user).toBeNull();
    expect(s.isHydrated).toBe(true);
  });
});
