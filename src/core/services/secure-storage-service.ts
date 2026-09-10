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
      console.warn(`[SecureStorageService] getItem(${key}) failed`, err);
      return null;
    }
  }

  async setItem(key: SecureKey, value: string): Promise<void> {
    if (!(await isSecureStorageAvailable())) return this.warnAndReturnNull(key, undefined);
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn(`[SecureStorageService] setItem(${key}) failed`, err);
    }
  }

  async removeItem(key: SecureKey): Promise<void> {
    if (!(await isSecureStorageAvailable())) return this.warnAndReturnNull(key, undefined);
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn(`[SecureStorageService] removeItem(${key}) failed`, err);
    }
  }

  async clear(): Promise<void> {
    await Promise.all([this.removeItem(secureKeys.authToken), this.removeItem(secureKeys.authUser)]);
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
