/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { colors: { accent: { DEFAULT: '#B8860B', dark: '#8C6A08' } }, maxWidth: { screen: '100vw' } } },
  plugins: [],
};
