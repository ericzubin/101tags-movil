import * as SecureStore from 'expo-secure-store';

import { secureStorageService } from '@/core/services/secure-storage-service';

describe('SecureStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
  });

  it('exposes stable auth keys', () => {
    expect(secureStorageService.getKeys()).toEqual({ authToken: '101tags.auth.token', authUser: '101tags.auth.user' });
  });

  it('gets an item from SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('abc');
    await expect(secureStorageService.getItem('101tags.auth.token')).resolves.toBe('abc');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('101tags.auth.token');
  });

  it('sets an item in SecureStore', async () => {
    await secureStorageService.setItem('101tags.auth.token', 'abc');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('101tags.auth.token', 'abc');
  });

  it('removes an item from SecureStore', async () => {
    await secureStorageService.removeItem('101tags.auth.token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.token');
  });

  it('clears token and user', async () => {
    await secureStorageService.clear();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('101tags.auth.user');
  });

  it('returns null and does not read on unavailable storage', async () => {
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    await expect(secureStorageService.getItem('101tags.auth.token')).resolves.toBeNull();
    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
  });

  it('does not write on unavailable storage', async () => {
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    await secureStorageService.setItem('101tags.auth.token', 'abc');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('swallows SecureStore read errors', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('failed'));
    await expect(secureStorageService.getItem('101tags.auth.token')).resolves.toBeNull();
  });

  it('swallows SecureStore write errors', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('failed'));
    await expect(secureStorageService.setItem('101tags.auth.token', 'abc')).resolves.toBeUndefined();
  });
});
