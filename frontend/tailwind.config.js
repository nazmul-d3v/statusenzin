/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#30ff87',
          light: '#65ffaa',
          dark: '#00cc5e',
          darker: '#042713',
          deep: '#003819',
          glow: 'rgba(48, 255, 135, 0.25)',
          muted: 'rgba(48, 255, 135, 0.12)',
        },
        vercel: {
          bg: '#000000',
          card: '#0a0a0a',
          elevated: '#111111',
          border: '#222222',
          borderHover: '#333333',
          borderFocus: '#444444',
          text: '#ededed',
          muted: '#888888',
          subtle: '#555555',
          accent: '#30ff87',
          accentGlow: 'rgba(48, 255, 135, 0.2)',
          success: '#30ff87',
          successGlow: 'rgba(48, 255, 135, 0.15)',
          warning: '#f59e0b',
          warningGlow: 'rgba(245, 158, 11, 0.15)',
          danger: '#ef4444',
          dangerGlow: 'rgba(239, 68, 68, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(48, 255, 135, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(48, 255, 135, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
