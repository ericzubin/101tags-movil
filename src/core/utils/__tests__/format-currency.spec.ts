import { formatMXN } from '@/core/utils/format-currency';

describe('formatMXN', () => {
  it('AC11: formatea números como MXN con locale es-MX', () => {
    const out = formatMXN(499);
    expect(out).toContain('499');
    expect(out).toMatch(/\$|MXN/);
    expect(out).toMatch(/499[.,]00/);
  });

  it('AC12: devuelve $0.00 para null, undefined y NaN', () => {
    expect(formatMXN(null)).toBe('$0.00');
    expect(formatMXN(undefined)).toBe('$0.00');
    expect(formatMXN(NaN)).toBe('$0.00');
    expect(formatMXN('not-a-number')).toBe('$0.00');
  });

  it('acepta strings numéricos válidos', () => {
    expect(formatMXN('1250.5')).toContain('1,250.50');
    expect(formatMXN('1250.5')).toMatch(/1,250\.50/);
  });

  it('formatea correctamente valores pequeños con dos decimales', () => {
    const out = formatMXN(9.99);
    expect(out).toMatch(/9[.,]99/);
  });
});
