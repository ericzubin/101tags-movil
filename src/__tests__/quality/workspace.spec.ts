// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('node:child_process');

describe('workspace quality smoke', () => {
  it('counts at least 54 individual test cases in the workspace', () => {
    let output = '';
    try {
      output = execSync(
        'grep -rh "^\\s*it(" src --include="*.spec.ts" --include="*.spec.tsx"',
        {
          encoding: 'utf8',
          cwd: process.cwd(),
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
    } catch {
      output = '';
    }
    const total = output.split('\n').filter((l) => /\bit\s*\(/.test(l)).length;
    expect(total).toBeGreaterThanOrEqual(54);
  });

  it('exposes ESLint custom rule for hex colors in eslint.config.js', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../../../eslint.config.js') as {
      rules?: Record<string, unknown>;
      files?: string[];
      ignores?: string[];
    }[];
    const hexBlock = config.find(
      (c) =>
        Array.isArray(c.files) &&
        c.files.some(
          (f) => typeof f === 'string' && f.includes('src/**/*.{ts,tsx}'),
        ) &&
        c.rules &&
        'no-restricted-syntax' in (c.rules ?? {}),
    );
    expect(hexBlock).toBeDefined();
    const rule = hexBlock?.rules?.['no-restricted-syntax'];
    const ruleSpec = Array.isArray(rule) ? rule[1] : undefined;
    expect(ruleSpec).toBeDefined();
    const spec = ruleSpec as { selector?: string; message?: string };
    expect(spec.selector).toMatch(/0-9A-Fa-f/);
    expect(spec.message).toMatch(/brandColors|Nativewind|theme\/tokens/);
  });

  it('exposes ESLint custom rules for no-explicit-any and consistent-type-imports', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require('../../../eslint.config.js') as {
      rules?: Record<string, unknown>;
    }[];
    const block = config.find(
      (c) =>
        c.rules &&
        '@typescript-eslint/no-explicit-any' in (c.rules ?? {}) &&
        '@typescript-eslint/consistent-type-imports' in (c.rules ?? {}),
    );
    expect(block).toBeDefined();
    expect(block?.rules?.['@typescript-eslint/no-explicit-any']).toBe('error');
    expect(block?.rules?.['@typescript-eslint/consistent-type-imports']).toBe('error');
  });
});
