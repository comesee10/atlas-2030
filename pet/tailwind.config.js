/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'tw-',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        coral: '#ff4d2e',
        ink: '#171614',
        paper: '#fbf8f3'
      }
    }
  },
  plugins: []
};
