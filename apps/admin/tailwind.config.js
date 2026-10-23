/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#111111',
        graphite: '#191919',
        deepBlack: '#191919',
        gold: {
          DEFAULT: '#C9A45C',
          light: '#E2CB97',
          dark: '#B08B42',
        },
        ivory: {
          DEFAULT: '#F5F1E8',
          tint: '#FAF8F4',
        },
        sandstone: '#D8D2C7',
        ink: {
          900: '#111111',
          700: '#3A3835',
          600: '#77736B',
          500: '#9E9A90',
        },
      },
      fontFamily: {
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        sans: ['Instrument Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        luxury: '0 10px 30px -10px rgba(0, 0, 0, 0.25)',
        subtle: '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
