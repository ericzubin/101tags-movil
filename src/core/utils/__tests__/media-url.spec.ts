import { resolveMediaUrl } from '@/core/utils/media-url';

describe('resolveMediaUrl', () => {
  const originalBase = process.env.EXPO_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://api.test/api';
  });

  afterEach(() => {
    if (originalBase === undefined) {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    } else {
      process.env.EXPO_PUBLIC_API_BASE_URL = originalBase;
    }
  });

  it('AC9: prepends domain base + path when path starts with /storage; strips /api from base', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://api.test/api';
    const result = resolveMediaUrl('/storage/products/x.jpg');
    expect(result).toBe('http://api.test/storage/products/x.jpg');
  });

  it('AC10: returns absolute http(s) URLs unchanged', () => {
    expect(resolveMediaUrl('https://cdn.example.com/x.jpg')).toBe('https://cdn.example.com/x.jpg');
    expect(resolveMediaUrl('http://cdn.example.com/x.jpg')).toBe('http://cdn.example.com/x.jpg');
  });

  it('returns null for null or undefined or empty input', () => {
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl(undefined)).toBeNull();
    expect(resolveMediaUrl('')).toBeNull();
  });

  it('handles protocol-relative URLs (//cdn.test/x.jpg) by adding https:', () => {
    expect(resolveMediaUrl('//cdn.test/x.jpg')).toBe('https://cdn.test/x.jpg');
  });

  it('strips trailing slash from base, normalizes missing leading slash on path', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://api.test/api/';
    expect(resolveMediaUrl('storage/x.jpg')).toBe('http://api.test/storage/x.jpg');
  });

  it('strips /api prefix even when dev native URLs include /api', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:8000/api';
    expect(resolveMediaUrl('/storage/x.jpg')).toBe('http://localhost:8000/storage/x.jpg');
  });
});
