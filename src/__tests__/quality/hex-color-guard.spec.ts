import { Linter } from 'eslint';

const HEX_COLOR_PATTERN = /#[0-9A-Fa-f]{3,8}\b/;

const HEX_RULE_CONFIG = [
  {
    ignores: [
      '**/__tests__/**',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      'src/theme/tokens.ts',
    ],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['**/__tests__/**', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=/${HEX_COLOR_PATTERN.source}/]`,
          message:
            'No hex colors en componentes. Usá Nativewind (bg-brand-primary) o brandColors desde src/theme/tokens.ts.',
        },
      ],
    },
  },
];

function lintWithHexRule(code: string, filename: string) {
  const linter = new Linter();
  return linter.verify(code, HEX_RULE_CONFIG as never, { filename });
}

describe('ESLint custom rule — no hex colors in components', () => {
  it('reports no-restricted-syntax on a hex color literal in a component', () => {
    const messages = lintWithHexRule(
      "const style = { color: '#E31E24' };\nexport const X = style;",
      'src/app/bad-component.tsx',
    );
    const hexError = messages.find((m) => m.ruleId === 'no-restricted-syntax');
    expect(hexError).toBeDefined();
    expect(hexError?.severity).toBe(2);
    expect(hexError?.message).toMatch(/brandColors|Nativewind|theme\/tokens/);
  });

  it('does not report when the file is an allowed tokens source', () => {
    const messages = lintWithHexRule(
      "export const primary = '#E31E24';\nexport const dark = '#0a0a0a';",
      'src/theme/tokens.ts',
    );
    // allowed path is excluded via global ignores — should not match a rule
    expect(messages.find((m) => m.ruleId === 'no-restricted-syntax')).toBeUndefined();
  });

  it('does not report when the file is a test spec', () => {
    const messages = lintWithHexRule(
      "const x = '#E31E24';",
      'src/app/__tests__/some.spec.ts',
    );
    // spec files are excluded from the hex rule
    expect(messages.find((m) => m.ruleId === 'no-restricted-syntax')).toBeUndefined();
  });

  it('reports hex with full 6-digit and 3-digit forms', () => {
    const sixDigit = lintWithHexRule(
      "const a = '#abcdef';\nexport const A = a;",
      'src/app/six.tsx',
    );
    const threeDigit = lintWithHexRule(
      "const b = '#abc';\nexport const B = b;",
      'src/app/three.tsx',
    );
    expect(sixDigit.some((m) => m.ruleId === 'no-restricted-syntax')).toBe(true);
    expect(threeDigit.some((m) => m.ruleId === 'no-restricted-syntax')).toBe(true);
  });
});
