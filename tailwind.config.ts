import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        void: '#000000',
        cosmos: '#050510',
        nebula: {
          50: '#f0e6ff',
          100: '#d9c2ff',
          200: '#b694ff',
          300: '#8c5fff',
          400: '#6b2fff',
          500: '#5000ff',
          600: '#3d00cc',
          700: '#2a0099',
          800: '#180066',
          900: '#080033',
        },
        aurora: {
          cyan: '#00f5ff',
          green: '#00ff94',
          pink: '#ff0080',
          orange: '#ff6b00',
          purple: '#9b00ff',
          gold: '#ffd700',
        },
        glass: {
          white: 'rgba(255,255,255,0.06)',
          border: 'rgba(255,255,255,0.1)',
          hover: 'rgba(255,255,255,0.12)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2.5s linear infinite',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { filter: 'brightness(1) drop-shadow(0 0 5px currentColor)' },
          '100%': { filter: 'brightness(1.3) drop-shadow(0 0 20px currentColor)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-cyan': '0 0 30px rgba(0,245,255,0.4)',
        'glow-pink': '0 0 30px rgba(255,0,128,0.4)',
        'glow-purple': '0 0 30px rgba(155,0,255,0.4)',
        'glow-green': '0 0 30px rgba(0,255,148,0.4)',
        'inner-glow': 'inset 0 0 30px rgba(255,255,255,0.05)',
        'glass': '0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
