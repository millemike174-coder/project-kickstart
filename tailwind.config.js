/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'serif'],
      },
      colors: {
        ink: '#0A0908',
        bone: '#F5F1E8',
        muted: '#8B8680',
        gold: '#E8DCC8',
        red: {
          glow: '#E64E2E',
          deep: '#A8200E',
        },
        blue: {
          glow: '#4A8BE6',
          deep: '#1E3A8A',
        },
      },
    },
  },
  plugins: [],
};
