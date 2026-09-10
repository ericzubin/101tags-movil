// @ts-check
const { FlatCompat } = require('@eslint/eslintrc');
const path = require('node:path');

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
    ],
  },
  ...compat.config({ extends: ['expo'] }),
];
