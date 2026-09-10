/**
 * Environment / runtime config.
 * Per spec 00-rn-expo-scaffold.md §Contratos:
 * - Dev: relative or LAN IP (Expo Go en dispositivo físico necesita LAN IP, no localhost)
 * - Prod: placeholder sustituido por CI en build (EAS Build secret)
 *
 * NUNCA hardcodear URLs productivas reales, tokens, ni credenciales en este archivo.
 * Ver AGENTS.md §Seguridad.
 */

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
  apiBaseUrl: isProduction
    ? 'PROD_API_BASE_URL_PLACEHOLDER'
    : 'http://localhost:8000/api',
  apiTimeoutMs: isProduction ? 20_000 : 15_000,
  currency: 'MXN',
  defaultLocale: 'es-MX',
  appName: '101tags',
  appVersion: '0.0.0',
};
