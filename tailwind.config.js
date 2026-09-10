/**
 * Tailwind / Nativewind config.
 *
 * `brand.*` colors se espejan desde `src/theme/tokens.ts` (brandColors).
 * Sincronía validada por `src/theme/__tests__/nativewind-tokens.spec.ts`.
 *
 * Si modificas `brandColors` en tokens.ts, replica aquí los valores
 * hex (no se puede importar .ts directamente porque tailwind.config.js
 * es CJS y se ejecuta antes del loader TS).
 *
 * @see .spec/2026-09-09-m0-5-pivot-theme-nativewind-env.md
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#E31E24',
          'primary-shade': '#c81a20',
          'primary-tint': '#e6353a',
          dark: '#0a0a0a',
          medium: '#F5F5F5',
          success: '#2dd36f',
          warning: '#ffc409',
          danger: '#eb445a',
          white: '#ffffff',
          black: '#000000',
        },
      },
      fontFamily: {
        brand: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'brand-1': 4,
        'brand-2': 8,
        'brand-3': 12,
        'brand-4': 16,
        'brand-5': 20,
        'brand-6': 24,
        'brand-7': 32,
        'brand-8': 48,
      },
      borderRadius: {
        'brand-sm': 4,
        'brand-md': 8,
        'brand-lg': 12,
        'brand-pill': 999,
      },
    },
  },
  plugins: [],
};