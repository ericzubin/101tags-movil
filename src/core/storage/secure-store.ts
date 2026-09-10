import * as SecureStore from 'expo-secure-store';

import { isSecureStorageAvailable } from '@/core/services/is-secure-storage-available';

export const secureKeys = {
  authToken: '101tags.auth.token',
  authUser: '101tags.auth.user',
} as const;

export { isSecureStorageAvailable };

export async function secureSet(key: string, value: string): Promise<void> {
  if (!(await isSecureStorageAvailable())) {
    if (__DEV__) console.warn(`[secure-store] unavailable on this platform; skipping set(${key})`);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function secureGet(key: string): Promise<string | null> {
  if (!(await isSecureStorageAvailable())) return null;
  return SecureStore.getItemAsync(key);
}

export async function secureDelete(key: string): Promise<void> {
  if (!(await isSecureStorageAvailable())) return;
  await SecureStore.deleteItemAsync(key);
}

export async function secureClearAuth(): Promise<void> {
  await Promise.all([secureDelete(secureKeys.authToken), secureDelete(secureKeys.authUser)]);
}
