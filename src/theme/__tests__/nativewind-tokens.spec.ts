import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';

import { brandColors, brandFonts } from '@/theme/tokens';

type TailwindConfig = {
  theme?: {
    extend?: {
      colors?: { brand?: Record<string, string> };
      fontFamily?: Record<string, string[]>;
      spacing?: Record<string, number>;
      borderRadius?: Record<string, number>;
    };
  };
};

const requireFromHere = createRequire(__filename);
const tailwindConfig = requireFromHere(
  path.resolve(__dirname, '../../../tailwind.config.js'),
) as TailwindConfig;

const brand = tailwindConfig.theme?.extend?.colors?.brand ?? {};
const fontFamilies = tailwindConfig.theme?.extend?.fontFamily ?? {};
const spacings = tailwindConfig.theme?.extend?.spacing ?? {};
const radii = tailwindConfig.theme?.extend?.borderRadius ?? {};

describe('nativewind ↔ tokens sync', () => {
  it('tailwind.config.js mirrors brandColors hex values', () => {
    expect(brand.primary).toBe(brandColors.primary);
    expect(brand['primary-shade']).toBe(brandColors.primaryShade);
    expect(brand['primary-tint']).toBe(brandColors.primaryTint);
    expect(brand.dark).toBe(brandColors.dark);
    expect(brand.medium).toBe(brandColors.medium);
    expect(brand.success).toBe(brandColors.success);
    expect(brand.warning).toBe(brandColors.warning);
    expect(brand.danger).toBe(brandColors.danger);
    expect(brand.white).toBe(brandColors.white);
    expect(brand.black).toBe(brandColors.black);
  });

  it('M1.8 AC7: tailwind.config.js fontFamily.brand uses unified family name + fallbacks', () => {
    expect(fontFamilies.brand).toBeDefined();
    // Single family name `Montserrat` (not -Regular/-Bold) so CSS @font-face
    // and native Font.loadAsync variants resolve via font-weight.
    expect(fontFamilies.brand?.[0]).toBe(brandFonts.brand);
    expect(fontFamilies.brand?.[0]).toBe('Montserrat');
    expect(fontFamilies.brand).toContain('system-ui');
    expect(fontFamilies.brand).toContain('sans-serif');
  });

  it('M1.8 AC6: src/global.css declares @font-face for 400 and 700 weights', () => {
    const css = fs.readFileSync(
      path.resolve(__dirname, '../../global.css'),
      'utf8',
    );
    // Family declaration
    expect(css).toMatch(/@font-face[\s\S]*?font-family:\s*['"]Montserrat['"]/);
    // Both weight sources must be present
    expect(css).toMatch(/font-weight:\s*400/);
    expect(css).toMatch(/font-weight:\s*700/);
    // Both bundled .ttf assets must be referenced
    expect(css).toMatch(/Montserrat-Regular\.ttf/);
    expect(css).toMatch(/Montserrat-Bold\.ttf/);
  });

  it('tailwind.config.js exposes brand-1..brand-8 spacing scale', () => {
    expect(spacings['brand-1']).toBe(4);
    expect(spacings['brand-2']).toBe(8);
    expect(spacings['brand-3']).toBe(12);
    expect(spacings['brand-4']).toBe(16);
    expect(spacings['brand-5']).toBe(20);
    expect(spacings['brand-6']).toBe(24);
    expect(spacings['brand-7']).toBe(32);
    expect(spacings['brand-8']).toBe(48);
  });

  it('tailwind.config.js exposes brand-sm/md/lg/pill radii', () => {
    expect(radii['brand-sm']).toBe(4);
    expect(radii['brand-md']).toBe(8);
    expect(radii['brand-lg']).toBe(12);
    expect(radii['brand-pill']).toBe(999);
  });
});