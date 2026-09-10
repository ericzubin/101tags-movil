import * as SecureStore from 'expo-secure-store';

import {
  isSecureStorageAvailable,
  secureClearAuth,
  secureDelete,
  secureGet,
  secureKeys,
  secureSet,
} from '@/core/storage/secure-store';

describe('secure-store wrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  it('exposes stable auth keys', () => {
    expect(secureKeys.authToken).toBe('101tags.auth.token');
    expect(secureKeys.authUser).toBe('101tags.auth.user');
  });

  it('set+get round-trips a value', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('hello');
    await secureSet('k', 'hello');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('k', 'hello');
    const v = await secureGet('k');
    expect(v).toBe('hello');
  });

  it('delete calls deleteItemAsync', async () => {
    await secureDelete('k');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('k');
  });

  it('clearAuth deletes token + user keys', async () => {
    await secureClearAuth();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(secureKeys.authToken);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(secureKeys.authUser);
  });

  it('isAvailableAsync reports platform availability', async () => {
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    expect(await isSecureStorageAvailable()).toBe(true);
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    expect(await isSecureStorageAvailable()).toBe(false);
  });

  it('set is a no-op when secure storage is unavailable', async () => {
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    await secureSet('k', 'v');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('get returns null when secure storage is unavailable', async () => {
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    expect(await secureGet('k')).toBeNull();
  });
});
