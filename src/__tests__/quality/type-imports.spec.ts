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

function makeTypeImportsConfig() {
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
        '@typescript-eslint/consistent-type-imports': 'error',
      },
    },
  ];
}

function lintWithTypeImports(code: string, filename: string) {
  const linter = new Linter();
  return linter.verify(code, makeTypeImportsConfig() as never, { filename });
}

describe('ESLint custom rule — consistent-type-imports', () => {
  it('reports when an import is used only as a type but lacks `import type`', () => {
    const messages = lintWithTypeImports(
      "import { Foo } from './types';\nconst x: Foo = { a: 1 };\nexport { x };",
      'src/app/bad-import.ts',
    );
    const error = messages.find(
      (m) => m.ruleId === '@typescript-eslint/consistent-type-imports',
    );
    expect(error).toBeDefined();
    expect(error?.severity).toBe(2);
    expect(error?.message).toMatch(/import type/i);
  });

  it('does not report when `import type` is used', () => {
    const messages = lintWithTypeImports(
      "import type { Foo } from './types';\nconst x: Foo = { a: 1 };\nexport { x };",
      'src/app/good-import.ts',
    );
    expect(
      messages.find((m) => m.ruleId === '@typescript-eslint/consistent-type-imports'),
    ).toBeUndefined();
  });

  it('does not report when import is used as a value (not type-only)', () => {
    const messages = lintWithTypeImports(
      "import { foo } from './utils';\nexport const x = foo();",
      'src/app/value-import.ts',
    );
    expect(
      messages.find((m) => m.ruleId === '@typescript-eslint/consistent-type-imports'),
    ).toBeUndefined();
  });

  it('does not report when the file is a test spec (ignored)', () => {
    const messages = lintWithTypeImports(
      "import { Foo } from './types';\nconst x: Foo = { a: 1 };\nexport { x };",
      'src/app/__tests__/some.spec.ts',
    );
    expect(
      messages.find((m) => m.ruleId === '@typescript-eslint/consistent-type-imports'),
    ).toBeUndefined();
  });
});
