/**
 * Secure storage wrapper around expo-secure-store.
 *
 * Expo SDK 57 expo-secure-store v15:
 * - iOS: Keychain (kSecClassGenericPassword)
 * - Android: AES-GCM via Android Keystore + SharedPreferences
 * - Web: isAvailableAsync() === false → returns null with warning
 *
 * NUNCA guardar el bearer token en AsyncStorage, localStorage, expo-file-system, ni
 * en texto plano. Sólo aquí. Ver AGENTS.md §Token Sanctum.
 *
 * @see https://docs.expo.dev/versions/latest/sdk/securestore/
 */

import * as SecureStore from 'expo-secure-store';

const KEYS = {
  authToken: '101tags.auth.token',
  authUser: '101tags.auth.user',
} as const;

export const secureKeys = KEYS;

export async function isSecureStorageAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function secureSet(key: string, value: string): Promise<void> {
  if (!(await isSecureStorageAvailable())) {
    if (__DEV__) {
      console.warn(`[secure-store] unavailable on this platform; skipping set(${key})`);
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function secureGet(key: string): Promise<string | null> {
  if (!(await isSecureStorageAvailable())) {
    return null;
  }
  return SecureStore.getItemAsync(key);
}

export async function secureDelete(key: string): Promise<void> {
  if (!(await isSecureStorageAvailable())) {
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function secureClearAuth(): Promise<void> {
  await Promise.all([secureDelete(KEYS.authToken), secureDelete(KEYS.authUser)]);
}
