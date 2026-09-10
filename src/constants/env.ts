/**
 * Environment / runtime config.
 *
 * Per spec `00-rn-expo-scaffold.md` §Contratos:
 * - Dev: `http://localhost:8000/api` (native iOS/Android) o
 *        `http://localhost:8080/api` (web) según `Platform.OS`.
 * - Prod: `https://api.101tags.com/api` cuando `EXPO_PUBLIC_ENV === 'production'`.
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
 */

import { Platform } from 'react-native';

const NATIVE_DEV_API_BASE_URL = 'http://localhost:8000/api';
const WEB_DEV_API_BASE_URL = 'http://localhost:8080/api';

export const PROD_API_BASE_URL = 'https://api.101tags.com/api';

export const DEV_API_TIMEOUT_MS = 15_000;
export const PROD_API_TIMEOUT_MS = 20_000;

declare const __DEV__: boolean | undefined;

export function getApiBaseUrl(): string {
  if (__DEV__ === true) {
    return Platform.OS === 'web' ? WEB_DEV_API_BASE_URL : NATIVE_DEV_API_BASE_URL;
  }
  if (process.env.EXPO_PUBLIC_ENV === 'production') {
    return PROD_API_BASE_URL;
  }
  return NATIVE_DEV_API_BASE_URL;
}

export function getApiTimeoutMs(): number {
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