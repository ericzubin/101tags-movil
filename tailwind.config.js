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
        },
      },
      fontFamily: {
        brand: ['Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
