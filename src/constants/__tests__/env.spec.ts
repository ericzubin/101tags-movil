import { environment } from '@/constants/env';

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
});
