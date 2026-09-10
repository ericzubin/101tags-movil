import {
  brandColors,
  brandFonts,
  fontFamily,
  fontWeights,
  radii,
  spacing,
} from '@/theme/tokens';

describe('brand tokens', () => {
  it('declares 101tags primary red as #E31E24', () => {
    expect(brandColors.primary).toBe('#E31E24');
  });

  it('declares primary shade and tint', () => {
    expect(brandColors.primaryShade).toBe('#c81a20');
    expect(brandColors.primaryTint).toBe('#e6353a');
  });

  it('declares dark and medium brand colors', () => {
    expect(brandColors.dark).toBe('#0a0a0a');
    expect(brandColors.medium).toBe('#F5F5F5');
  });

  it('declares extra palette tokens', () => {
    expect(brandColors.success).toMatch(/^#[0-9a-f]{6}$/i);
    expect(brandColors.warning).toMatch(/^#[0-9a-f]{6}$/i);
    expect(brandColors.danger).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('declares Montserrat as brand font', () => {
    expect(brandFonts.brand).toBe('Montserrat');
    expect(fontFamily).toContain('Montserrat');
    expect(fontFamily).toContain('system-ui');
    expect(fontFamily).toContain('sans-serif');
  });

  it('declares fontWeights for body and headings', () => {
    expect(fontWeights.regular).toBe('400');
    expect(fontWeights.medium).toBe('500');
    expect(fontWeights.semibold).toBe('600');
    expect(fontWeights.bold).toBe('700');
    expect(fontWeights.black).toBe('800');
  });

  it('declares radii tokens aligned with brand-md default', () => {
    expect(radii.sm).toBe(4);
    expect(radii.md).toBe(8);
    expect(radii.lg).toBe(12);
    expect(radii.pill).toBe(999);
  });

  it('declares brand-1..brand-8 spacing scale', () => {
    expect(spacing['brand-1']).toBe(4);
    expect(spacing['brand-2']).toBe(8);
    expect(spacing['brand-3']).toBe(12);
    expect(spacing['brand-4']).toBe(16);
    expect(spacing['brand-5']).toBe(20);
    expect(spacing['brand-6']).toBe(24);
    expect(spacing['brand-7']).toBe(32);
    expect(spacing['brand-8']).toBe(48);
  });
});