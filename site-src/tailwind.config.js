/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Heebo', 'Rubik', 'system-ui', 'sans-serif'], mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'] },
      colors: {
        brand: { 50: '#eff4ff', 100: '#dbe6fe', 200: '#bfd0fd', 300: '#93aefb', 400: '#6685f6', 500: '#3f5fe9', 600: '#2f47cf', 700: '#2638a8', 800: '#1b2a86', 900: '#0f1a4d' },
        leaf: { DEFAULT: '#10b981', light: '#d1fae5' },
        coral: { DEFAULT: '#e07b17', dark: '#b45f0a', light: '#fdf0dc' },
        sand: { DEFAULT: '#e6ecf9', light: '#f3f6fd' },
        ink: '#0f1a4d',
        night: { DEFAULT: '#0a1230', 2: '#0f1a42', 3: '#16235c' },
        aqua: { DEFAULT: '#38bdf8', soft: '#7dd3fc', ink: '#075985' },
      },
      keyframes: { marquee: { from: { transform: 'translate3d(-50%,0,0)' }, to: { transform: 'translate3d(0,0,0)' } }, floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } }, pulseRing: { '0%': { transform: 'scale(.9)', opacity: '.7' }, '100%': { transform: 'scale(1.6)', opacity: '0' } } },
      animation: { marquee: 'marquee 80s linear infinite', floaty: 'floaty 6s ease-in-out infinite', pulseRing: 'pulseRing 2.4s ease-out infinite' },
      boxShadow: {
        aqua: '0 0 0 1px rgba(56,189,248,.45), 0 24px 60px -18px rgba(56,189,248,.5)',
        soft: '0 10px 40px -12px rgba(10,18,48,.18)',
        lift: '0 28px 60px -18px rgba(10,18,48,.35)',
        glow: '0 0 0 1px rgba(63,95,233,.55), 0 24px 56px -16px rgba(63,95,233,.45)',
      },
    },
  },
  plugins: [],
};
