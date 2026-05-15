/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        accent: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          50:  '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50:  '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          50:  'var(--surface-50)',
          100: 'var(--surface-100)',
          200: 'var(--surface-200)',
          300: 'var(--surface-300)',
          400: 'var(--surface-400)',
        },
      },
      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary':  'linear-gradient(135deg, #334155 0%, #06b6d4 100%)',
        'gradient-glow':     'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(51,65,85,0.12))',
        'glass-gradient':    'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass':      '0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-sm':   '0 4px 16px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glow':       '0 0 20px rgba(6,182,212,0.18)',
        'glow-slate': '0 0 20px rgba(71,85,105,0.20)',
        'card':       '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.04)',
        'premium':    '0 20px 40px -12px rgba(0,0,0,0.12)',
      },
      animation: {
        'shimmer':    'shimmer 2s linear infinite',
        'slide-up':   'slide-up 0.4s ease-out',
        'slide-down': 'slide-down 0.25s ease-out',
        'fade-in':    'fade-in 0.4s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-down': {
          '0%':   { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
