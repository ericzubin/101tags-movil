/**
 * Recursively converts snake_case keys to camelCase in plain objects.
 * Arrays are traversed; primitives and null/undefined are preserved.
 * Date objects and class instances are preserved as-is.
 */
export function toCamel<T = unknown>(input: unknown): T {
  if (input === null || input === undefined) return input as T;
  if (Array.isArray(input)) {
    return input.map((item) => toCamel(item)) as unknown as T;
  }
  if (typeof input !== 'object') return input as T;
  if (input instanceof Date) return input as T;
  if (Object.prototype.toString.call(input) !== '[object Object]') {
    return input as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const camelKey = key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
    out[camelKey] = toCamel(value);
  }
  return out as T;
}
