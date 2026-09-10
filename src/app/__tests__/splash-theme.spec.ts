import * as fs from 'node:fs';
import * as path from 'node:path';

import { brandColors } from '@/theme/tokens';

const HEX_LITERAL_PATTERN = /#[0-9a-fA-F]{6}\b/g;
const ALLOWED_HEX_TOKENS = new Set<string>([
  brandColors.primary,
  brandColors.primaryShade,
  brandColors.primaryTint,
  brandColors.dark,
  brandColors.medium,
  brandColors.success,
  brandColors.warning,
  brandColors.danger,
  brandColors.white,
  brandColors.black,
]);

const SCAN_TARGETS = [
  path.resolve(__dirname, '../_layout.tsx'),
  path.resolve(__dirname, '../(auth)/login.tsx'),
  path.resolve(__dirname, '../(auth)/register.tsx'),
  path.resolve(__dirname, '../(tabs)/_layout.tsx'),
  path.resolve(__dirname, '../(tabs)/index.tsx'),
  path.resolve(__dirname, '../index.tsx'),
];

function readSource(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

describe('splash + theme — no raw hex literals in components', () => {
  for (const filePath of SCAN_TARGETS) {
    const relative = path.relative(path.resolve(__dirname, '../..'), filePath);
    it(`does not embed disallowed hex literals in ${relative}`, () => {
      const source = readSource(filePath);
      const matches = source.match(HEX_LITERAL_PATTERN) ?? [];
      const violations = matches.filter((hex) => !ALLOWED_HEX_TOKENS.has(hex.toLowerCase()) && !ALLOWED_HEX_TOKENS.has(hex));
      expect(violations).toEqual([]);
    });
  }

  it('RootLayout uses brandColors.primary for header background, not raw #E31E24', () => {
    const source = readSource(path.resolve(__dirname, '../_layout.tsx'));
    expect(source).not.toMatch(/backgroundColor:\s*['"]#E31E24['"]/);
    expect(source).toContain('brandColors.primary');
  });

  it('(tabs)/index.tsx uses Nativewind className on root container', () => {
    const source = readSource(path.resolve(__dirname, '../(tabs)/index.tsx'));
    expect(source).toMatch(/className=/);
  });
});