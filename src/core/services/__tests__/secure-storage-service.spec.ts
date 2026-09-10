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

  it('does not write on unavailable storage (setItemSafe swallows unavailable)', async () => {
    (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    await secureStorageService.setItemSafe('101tags.auth.token', 'abc');
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('swallows SecureStore read errors', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('failed'));
    await expect(secureStorageService.getItem('101tags.auth.token')).resolves.toBeNull();
  });

  it('swallows SecureStore write errors (setItemSafe wraps the throwing variant)', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('failed'));
    await expect(secureStorageService.setItemSafe('101tags.auth.token', 'abc')).resolves.toBeUndefined();
  });

  describe('setItemSafe / removeItemSafe — compat wrappers (AC7)', () => {
    it('setItemSafe swallows SecureStore write errors and resolves', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('keystore locked'));
      await expect(
        secureStorageService.setItemSafe('101tags.auth.token', 'abc'),
      ).resolves.toBeUndefined();
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });

    it('setItemSafe warns in dev on failure (does not throw)', async () => {
      const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;
      (globalThis as { __DEV__?: boolean }).__DEV__ = true;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('keystore locked'));

      await secureStorageService.setItemSafe('101tags.auth.token', 'abc');

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
      (globalThis as { __DEV__?: boolean }).__DEV__ = originalDev;
    });

    it('removeItemSafe swallows SecureStore delete errors', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(new Error('keystore locked'));
      await expect(secureStorageService.removeItemSafe('101tags.auth.token')).resolves.toBeUndefined();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
    });

    it('clearSafe swallows errors from both removals', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(new Error('keystore locked'));
      await expect(secureStorageService.clearSafe()).resolves.toBeUndefined();
    });
  });

  describe('setItem / removeItem — propagating variants (AC6)', () => {
    it('setItem propagates SecureStore write errors (does not swallow)', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('keystore locked'));
      await expect(secureStorageService.setItem('101tags.auth.token', 'abc')).rejects.toThrow(
        'keystore locked',
      );
    });

    it('setItem does NOT call console.warn when SecureStore fails (AC6)', async () => {
      const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;
      (globalThis as { __DEV__?: boolean }).__DEV__ = true;
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('keystore locked'));

      await expect(secureStorageService.setItem('101tags.auth.token', 'abc')).rejects.toThrow();
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
      (globalThis as { __DEV__?: boolean }).__DEV__ = originalDev;
    });

    it('removeItem propagates SecureStore delete errors (does not swallow)', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(new Error('keystore locked'));
      await expect(secureStorageService.removeItem('101tags.auth.token')).rejects.toThrow(
        'keystore locked',
      );
    });

    it('setItem rejects on unavailable storage with descriptive error', async () => {
      (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(false);
      await expect(
        secureStorageService.setItem('101tags.auth.token', 'abc'),
      ).rejects.toThrow(/unavailable/);
      expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    });

    it('removeItem rejects on unavailable storage with descriptive error', async () => {
      (SecureStore.isAvailableAsync as jest.Mock).mockResolvedValue(false);
      await expect(secureStorageService.removeItem('101tags.auth.token')).rejects.toThrow(
        /unavailable/,
      );
      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    });
  });
});
