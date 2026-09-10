import { brandColors, brandFonts, fontFamily } from '@/theme/tokens';

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
});
