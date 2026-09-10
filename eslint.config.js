// @ts-check
const { FlatCompat } = require('@eslint/eslintrc');

const HEX_COLOR_PATTERN = /#[0-9A-Fa-f]{3,8}\b/;

const ALLOWED_HEX_PATHS = [
  'src/theme/tokens.ts',
  'tailwind.config.js',
  'src/global.css',
];

const TEST_FILE_PATTERNS = ['**/__tests__/**', '**/*.spec.ts', '**/*.spec.tsx'];

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'web-build/**',
      'android/**',
      'ios/**',
      'coverage/**',
      '*.config.js',
      ...ALLOWED_HEX_PATHS,
    ],
  },
  ...compat.config({ extends: ['expo'] }),
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: TEST_FILE_PATTERNS,
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
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
