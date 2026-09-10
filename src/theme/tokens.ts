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

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
