import { environment, getApiBaseUrl, getApiTimeoutMs, PROD_API_BASE_URL } from '@/constants/env';
import { Platform } from 'react-native';

describe('environment', () => {
  it('declares MXN as currency', () => {
    expect(environment.currency).toBe('MXN');
  });

  it('declares es-MX as default locale', () => {
    expect(environment.defaultLocale).toBe('es-MX');
  });

  it('declares appName 101tags', () => {
    expect(environment.appName).toBe('101tags');
  });

  it('declares appVersion as a non-empty string', () => {
    expect(typeof environment.appVersion).toBe('string');
    expect(environment.appVersion.length).toBeGreaterThan(0);
  });

  it('declares apiTimeoutMs as a positive number', () => {
    expect(typeof environment.apiTimeoutMs).toBe('number');
    expect(environment.apiTimeoutMs).toBeGreaterThan(0);
  });

  it('declares apiBaseUrl ending with /api', () => {
    expect(environment.apiBaseUrl).toMatch(/\/api$/);
  });

  describe('getApiBaseUrl()', () => {
    const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;
    const originalBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    const originalEnv = process.env.EXPO_PUBLIC_ENV;

    afterEach(() => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = originalDev;
      if (originalBaseUrl === undefined) {
        delete process.env.EXPO_PUBLIC_API_BASE_URL;
      } else {
        process.env.EXPO_PUBLIC_API_BASE_URL = originalBaseUrl;
      }
      if (originalEnv === undefined) {
        delete process.env.EXPO_PUBLIC_ENV;
      } else {
        process.env.EXPO_PUBLIC_ENV = originalEnv;
      }
    });

    it('returns EXPO_PUBLIC_API_BASE_URL when set, regardless of __DEV__ (AC: env wins)', () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = false;
      process.env.EXPO_PUBLIC_API_BASE_URL = 'https://custom.example.com/api';
      expect(getApiBaseUrl()).toBe('https://custom.example.com/api');
    });

    it('returns native dev URL when __DEV__ is true on iOS (AC9)', () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = true;
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
      delete process.env.EXPO_PUBLIC_ENV;
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
      expect(getApiBaseUrl()).toBe('http://localhost:8000/api');
    });

    it('returns native dev URL when __DEV__ is true on android (AC10 — uses 10.0.2.2)', () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = true;
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
      delete process.env.EXPO_PUBLIC_ENV;
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
      expect(getApiBaseUrl()).toBe('http://10.0.2.2:8000/api');
    });

    it('returns web dev URL when __DEV__ is true on web', () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = true;
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
      delete process.env.EXPO_PUBLIC_ENV;
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
      expect(getApiBaseUrl()).toBe('http://localhost:8080/api');
    });

    it('throws in release build when EXPO_PUBLIC_API_BASE_URL is unset (AC8)', () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = false;
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
      delete process.env.EXPO_PUBLIC_ENV;
      expect(() => getApiBaseUrl()).toThrow(
        /EXPO_PUBLIC_API_BASE_URL es obligatorio en release/,
      );
    });

    it('returns prod URL when EXPO_PUBLIC_ENV is production and EXPO_PUBLIC_API_BASE_URL is set', () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = false;
      process.env.EXPO_PUBLIC_API_BASE_URL = PROD_API_BASE_URL;
      process.env.EXPO_PUBLIC_ENV = 'production';
      expect(getApiBaseUrl()).toBe(PROD_API_BASE_URL);
      expect(getApiBaseUrl()).toBe('https://api.101tags.com/api');
    });
  });

  describe('getApiTimeoutMs()', () => {
    const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;
    const originalTimeout = process.env.EXPO_PUBLIC_API_TIMEOUT_MS;

    afterEach(() => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = originalDev;
      if (originalTimeout === undefined) {
        delete process.env.EXPO_PUBLIC_API_TIMEOUT_MS;
      } else {
        process.env.EXPO_PUBLIC_API_TIMEOUT_MS = originalTimeout;
      }
    });

    it('returns 15000 in dev', () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = true;
      delete process.env.EXPO_PUBLIC_API_TIMEOUT_MS;
      expect(getApiTimeoutMs()).toBe(15_000);
    });

    it('returns 30000 in prod (default)', () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = false;
      delete process.env.EXPO_PUBLIC_API_TIMEOUT_MS;
      expect(getApiTimeoutMs()).toBe(30_000);
    });

    it('reads EXPO_PUBLIC_API_TIMEOUT_MS when set', () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = false;
      process.env.EXPO_PUBLIC_API_TIMEOUT_MS = '42000';
      expect(getApiTimeoutMs()).toBe(42_000);
    });
  });
});
