import { getApiBaseUrl } from '@/constants/env';

/**
 * Resolves a media path from the backend to a fully-qualified URL.
 *
 * The backend returns paths like `/storage/products/x.jpg`. The API base
 * (`getApiBaseUrl()`) terminates in `/api`, but media lives outside the API
 * namespace, so we strip the trailing `/api` before composing the final URL.
 *
 * - `null` / `undefined` / '' → `null`
 * - `http(s)://...`          → returned as-is
 * - `//cdn.test/x.jpg`       → prefixed with `https:`
 * - everything else          → prepended with the (stripped) base URL
 */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith('//')) return `https:${path}`;
  const apiBase = getApiBaseUrl().replace(/\/api\/?$/, '').replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${apiBase}${normalized}`;
}
