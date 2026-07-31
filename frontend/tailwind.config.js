/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './utils/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17212b',
        mint: '#22a06b',
        amber: '#d97706',
        coral: '#e45757'
      }
    }
  },
  plugins: []
};
