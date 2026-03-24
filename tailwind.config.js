/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta primaria corporativa (teal)
        primary: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#0d9488',
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#042f2e',
        },
        // Superficies y fondos
        surface: {
          0:   '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
        },
        // Tipografía
        ink: {
          primary:   '#0f172a',
          secondary: '#475569',
          muted:     '#94a3b8',
        },
        // Estados de partes
        status: {
          success: '#16a34a',
          warning: '#d97706',
          error:   '#dc2626',
          info:    '#2563eb',
          draft:   '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        card:  '12px',
        input: '8px',
        badge: '6px',
      },
      boxShadow: {
        card:          '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover':  '0 4px 12px rgba(0,0,0,0.10)',
        'card-elevated': '0 8px 24px rgba(0,0,0,0.12)',
        'nav':         '0 1px 0 rgba(0,0,0,0.06)',
        'bottom-nav':  '0 -1px 0 rgba(0,0,0,0.06), 0 -4px 12px rgba(0,0,0,0.04)',
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.2s ease-out',
        'slide-up':       'slide-up 0.25s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'scale-in':       'scale-in 0.2s ease-out',
        'shimmer':        'shimmer 1.5s infinite linear',
      },
      spacing: {
        'bottom-nav': '4rem', // 64px — altura de la barra de navegación inferior
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
