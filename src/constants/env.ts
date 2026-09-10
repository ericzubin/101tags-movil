/**
 * Environment / runtime config.
 *
 * Per spec `00-rn-expo-scaffold.md` §Contratos (extended by M1.4-hardening):
 * - Dev nativo:
 *     - iOS sim: `http://localhost:8000/api`
 *     - Android emulator: `http://10.0.2.2:8000/api` (10.0.2.2 = host machine desde el emulador)
 *     - Web: `http://localhost:8080/api`
 * - Prod / Preview / EAS: `EXPO_PUBLIC_API_BASE_URL` obligatorio.
 *     Si falta en release build (`__DEV__ === false`) → throw explícito.
 *
 * Variables leídas vía `process.env.EXPO_PUBLIC_*`:
 * - `EXPO_PUBLIC_API_BASE_URL` — base URL del backend (incluyendo `/api`).
 * - `EXPO_PUBLIC_ENV` — `development` | `preview` | `production` (legacy compat).
 * - `EXPO_PUBLIC_API_TIMEOUT_MS` — timeout HTTP en ms.
 *
 * `getApiBaseUrl()` y `getApiTimeoutMs()` son los getters primarios. El
 * `Environment` interface conserva `apiBaseUrl` / `apiTimeoutMs` como
 * snapshot calculado al module-load para compatibilidad con código que
 * aún no usa los getters (legacy).
 *
 * NUNCA hardcodear URLs productivas reales, tokens, ni credenciales en este
 * archivo. Ver AGENTS.md §Seguridad.
 *
 * @see .spec/2026-09-09-m0-5-pivot-theme-nativewind-env.md §Contratos
 * @see .spec/2026-09-10-m1-4-hardening.md §Contratos
 */

import { Platform } from 'react-native';

const NATIVE_DEV_API_BASE_URL_IOS = 'http://localhost:8000/api';
const NATIVE_DEV_API_BASE_URL_ANDROID = 'http://10.0.2.2:8000/api';
const WEB_DEV_API_BASE_URL = 'http://localhost:8080/api';

export const PROD_API_BASE_URL = 'https://api.101tags.com/api';

export const DEV_API_TIMEOUT_MS = 15_000;
export const PROD_API_TIMEOUT_MS = 30_000;

declare const __DEV__: boolean | undefined;

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv;

  if (__DEV__ === true) {
    if (Platform.OS === 'web') return WEB_DEV_API_BASE_URL;
    if (Platform.OS === 'android') return NATIVE_DEV_API_BASE_URL_ANDROID;
    return NATIVE_DEV_API_BASE_URL_IOS;
  }

  throw new Error(
    '[env] EXPO_PUBLIC_API_BASE_URL es obligatorio en release builds (EAS production/preview). Configúralo en eas.json env block.',
  );
}

export function getApiTimeoutMs(): number {
  const fromEnv = process.env.EXPO_PUBLIC_API_TIMEOUT_MS;
  if (fromEnv && fromEnv.length > 0) {
    const parsed = Number.parseInt(fromEnv, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return __DEV__ === true ? DEV_API_TIMEOUT_MS : PROD_API_TIMEOUT_MS;
}

export interface Environment {
  readonly production: boolean;
  readonly apiBaseUrl: string;
  readonly apiTimeoutMs: number;
  readonly currency: 'MXN';
  readonly defaultLocale: 'es-MX';
  readonly appName: '101tags';
  readonly appVersion: string;
}

const isProduction = process.env.NODE_ENV === 'production' || process.env.EXPO_PUBLIC_ENV === 'production';

export const environment: Environment = {
  production: isProduction,
  apiBaseUrl: getApiBaseUrl(),
  apiTimeoutMs: getApiTimeoutMs(),
  currency: 'MXN',
  defaultLocale: 'es-MX',
  appName: '101tags',
  appVersion: '0.0.0',
};
