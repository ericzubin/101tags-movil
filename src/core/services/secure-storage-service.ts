import * as SecureStore from 'expo-secure-store';

import { isSecureStorageAvailable } from './is-secure-storage-available';

const secureKeys = {
  authToken: '101tags.auth.token',
  authUser: '101tags.auth.user',
} as const;

type SecureKey = (typeof secureKeys)[keyof typeof secureKeys];

class SecureStorageService {
  private warnedUnavailable = false;

  async getItem(key: SecureKey): Promise<string | null> {
    if (!(await isSecureStorageAvailable())) return this.warnAndReturnNull(key, null);
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      if (__DEV__) console.warn(`[SecureStorageService] getItem(${key}) failed`, err);
      return null;
    }
  }

  async setItem(key: SecureKey, value: string): Promise<void> {
    if (!(await isSecureStorageAvailable())) {
      throw new Error(
        `[SecureStorageService] unavailable on this platform; cannot set(${key})`,
      );
    }
    await SecureStore.setItemAsync(key, value);
  }

  async removeItem(key: SecureKey): Promise<void> {
    if (!(await isSecureStorageAvailable())) {
      throw new Error(
        `[SecureStorageService] unavailable on this platform; cannot remove(${key})`,
      );
    }
    await SecureStore.deleteItemAsync(key);
  }

  async clear(): Promise<void> {
    await Promise.all([this.removeItem(secureKeys.authToken), this.removeItem(secureKeys.authUser)]);
  }

  async setItemSafe(key: SecureKey, value: string): Promise<void> {
    try {
      await this.setItem(key, value);
    } catch (err) {
      if (__DEV__) console.warn(`[SecureStorageService] setItemSafe(${key}) failed`, err);
    }
  }

  async removeItemSafe(key: SecureKey): Promise<void> {
    try {
      await this.removeItem(key);
    } catch (err) {
      if (__DEV__) console.warn(`[SecureStorageService] removeItemSafe(${key}) failed`, err);
    }
  }

  async clearSafe(): Promise<void> {
    try {
      await this.clear();
    } catch (err) {
      if (__DEV__) console.warn(`[SecureStorageService] clearSafe failed`, err);
    }
  }

  getKeys(): typeof secureKeys {
    return secureKeys;
  }

  private warnAndReturnNull<T>(key: SecureKey, fallback: T): T {
    if (__DEV__ && !this.warnedUnavailable) {
      console.warn(
        `[SecureStorageService] expo-secure-store no disponible en este entorno (web/jsdom). Las claves (${key}) NO se persisten.`,
      );
      this.warnedUnavailable = true;
    }
    return fallback;
  }
}

export const secureStorageService = new SecureStorageService();
