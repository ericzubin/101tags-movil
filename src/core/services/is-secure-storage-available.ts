import * as SecureStore from 'expo-secure-store';

export async function isSecureStorageAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}
