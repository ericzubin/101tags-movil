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

  it('uses a placeholder URL in production (no hardcoded secret)', () => {
    if (environment.production) {
      expect(environment.apiBaseUrl).toBe('PROD_API_BASE_URL_PLACEHOLDER');
    }
  });

  describe('getApiBaseUrl()', () => {
    const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;
    const originalEnv = process.env.EXPO_PUBLIC_ENV;

    afterEach(() => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = originalDev;
      if (originalEnv === undefined) {
        delete process.env.EXPO_PUBLIC_ENV;
      } else {
        process.env.EXPO_PUBLIC_ENV = originalEnv;
      }
    });

    it('returns native dev URL when __DEV__ is true on iOS', () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = true;
      delete process.env.EXPO_PUBLIC_ENV;
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
      expect(getApiBaseUrl()).toBe('http://localhost:8000/api');
    });

    it('returns web dev URL when __DEV__ is true on web', () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = true;
      delete process.env.EXPO_PUBLIC_ENV;
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
      expect(getApiBaseUrl()).toBe('http://localhost:8080/api');
    });

    it('returns prod URL when EXPO_PUBLIC_ENV is production', () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = false;
      process.env.EXPO_PUBLIC_ENV = 'production';
      expect(getApiBaseUrl()).toBe(PROD_API_BASE_URL);
      expect(getApiBaseUrl()).toBe('https://api.101tags.com/api');
    });

    it('returns native dev URL by default when no flags are set', () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = true;
      delete process.env.EXPO_PUBLIC_ENV;
      Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
      expect(getApiBaseUrl()).toBe('http://localhost:8000/api');
    });
  });

  describe('getApiTimeoutMs()', () => {
    const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;

    afterEach(() => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = originalDev;
    });

    it('returns 15000 in dev', () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = true;
      expect(getApiTimeoutMs()).toBe(15_000);
    });

    it('returns 20000 in prod', () => {
      (globalThis as { __DEV__?: boolean }).__DEV__ = false;
      expect(getApiTimeoutMs()).toBe(20_000);
    });
  });
});