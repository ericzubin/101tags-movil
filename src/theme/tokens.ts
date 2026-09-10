/**
 * 101tags brand tokens — TypeScript constants.
 * Source of truth: AGENTS.md §Stack funcional esperado.
 *
 * Branding oficial:
 * - Primary (rojo 101tags):  #E31E24
 * - Dark:                    #0a0a0a
 * - Medium (gris claro):     #F5F5F5
 * - Font family:             Montserrat, system-ui, sans-serif
 *
 * Tokens extra (alineados con Ionic palette + Nativewind v4):
 * - Success:                 #2dd36f
 * - Warning:                 #ffc409
 * - Danger:                  #eb445a
 *
 * Esta capa es la **fuente de verdad** de tokens. `tailwind.config.js` los
 * espeja (con tests de sincronía en `src/theme/__tests__/nativewind-tokens.spec.ts`),
 * y `src/global.css` los publica como CSS custom props en tripletas RGB.
 *
 * @see .spec/2026-09-09-m0-5-pivot-theme-nativewind-env.md
 */

export const brandColors = {
  primary: '#E31E24',
  primaryShade: '#c81a20',
  primaryTint: '#e6353a',
  dark: '#0a0a0a',
  medium: '#F5F5F5',
  success: '#2dd36f',
  warning: '#ffc409',
  danger: '#eb445a',
  white: '#ffffff',
  black: '#000000',
} as const;

export type BrandColor = keyof typeof brandColors;

export const brandFonts = {
  brand: 'Montserrat',
  system: 'system-ui',
  fallback: 'sans-serif',
} as const;

export const fontFamily = [
  brandFonts.brand,
  brandFonts.system,
  brandFonts.fallback,
].join(', ');

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '800',
} as const;

export type FontWeightToken = keyof typeof fontWeights;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radii;

/**
 * Escala de spacing 101tags.
 *
 * - Aliases legacy (`xs/sm/md/lg/xl/xxl`) se conservan para no romper
 *   componentes que ya los usan.
 * - `brand-1..brand-8` es la escala numérica explícita que se espeja en
 *   `tailwind.config.js` para utilidades como `p-brand-4` / `mt-brand-6`.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  'brand-1': 4,
  'brand-2': 8,
  'brand-3': 12,
  'brand-4': 16,
  'brand-5': 20,
  'brand-6': 24,
  'brand-7': 32,
  'brand-8': 48,
} as const;

export type SpacingToken = keyof typeof spacing;