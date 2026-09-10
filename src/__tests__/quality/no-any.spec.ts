import * as path from 'node:path';
import { Linter } from 'eslint';

function loadTsParser(): unknown {
  const candidates = [
    'node_modules/.pnpm/@typescript-eslint+parser@8.45.0_eslint@9.39.0_jiti@1.21.7__typescript@5.9.3/node_modules/@typescript-eslint/parser/dist/index.js',
  ];
  for (const candidate of candidates) {
    const abs = path.resolve(__dirname, '../../..', candidate);
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require(abs);
    } catch {
      // try next
    }
  }
  throw new Error('Could not locate @typescript-eslint/parser in node_modules/.pnpm');
}

function loadTsPlugin(): unknown {
  const candidates = [
    'node_modules/.pnpm/@typescript-eslint+eslint-plugin@8.45.0_@typescript-eslint+parser@8.45.0_eslint@9.39.0__6fd6395b34dfc69c6dc05948531c1bac/node_modules/@typescript-eslint/eslint-plugin/dist/index.js',
  ];
  for (const candidate of candidates) {
    const abs = path.resolve(__dirname, '../../..', candidate);
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require(abs);
    } catch {
      // try next
    }
  }
  throw new Error('Could not locate @typescript-eslint/eslint-plugin in node_modules/.pnpm');
}

function makeNoAnyConfig() {
  const tsParser = loadTsParser() as Record<string, unknown>;
  const tsPlugin = loadTsPlugin() as Record<string, unknown>;
  return [
    {
      files: ['src/**/*.ts', 'src/**/*.tsx'],
      ignores: ['**/__tests__/**', '**/*.spec.ts', '**/*.spec.tsx'],
      plugins: {
        '@typescript-eslint': tsPlugin,
      },
      languageOptions: {
        parser: tsParser as never,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
  ];
}

function lintWithNoAny(code: string, filename: string) {
  const linter = new Linter();
  return linter.verify(code, makeNoAnyConfig() as never, { filename });
}

describe('ESLint custom rule — no-explicit-any in components', () => {
  it('reports @typescript-eslint/no-explicit-any on `const x: any`', () => {
    const messages = lintWithNoAny(
      'const x: any = 1; export { x };',
      'src/app/bad-any.ts',
    );
    const error = messages.find((m) => m.ruleId === '@typescript-eslint/no-explicit-any');
    expect(error).toBeDefined();
    expect(error?.severity).toBe(2);
    expect(error?.message).toMatch(/any/i);
  });

  it('reports on `as any` cast', () => {
    const messages = lintWithNoAny(
      'const x = 1 as any; export { x };',
      'src/app/bad-cast.ts',
    );
    const error = messages.find((m) => m.ruleId === '@typescript-eslint/no-explicit-any');
    expect(error).toBeDefined();
  });

  it('does not report when there is no any', () => {
    const messages = lintWithNoAny(
      'const x: number = 1; export { x };',
      'src/app/good.ts',
    );
    expect(messages.find((m) => m.ruleId === '@typescript-eslint/no-explicit-any')).toBeUndefined();
  });

  it('does not report when the file is a test spec (ignored)', () => {
    const messages = lintWithNoAny(
      'const x: any = 1;',
      'src/app/__tests__/some.spec.ts',
    );
    expect(messages.find((m) => m.ruleId === '@typescript-eslint/no-explicit-any')).toBeUndefined();
  });
});
