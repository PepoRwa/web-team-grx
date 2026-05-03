/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gowrax: {
          // Base sombre historique (conservée pour le fond)
          void: '#1A1C2E',
          abyss: '#0D0E15',
          purple: '#6F2DBD',
          neon: '#D62F7F',
          
          // Nouvelle Charte "Soft Tech / Pastel"
          lavender: '#B185DB', // Variante douce du purple
          quartz: '#F7CAD0',   // Pour remplacer le magenta par touches
          ether: '#A2D2FF',    // Bleu ciel numérique
          starlight: '#F0F2F5',// Blanc nacré/lumineux
          gold: '#E9C46A'      // Accents pour les schémas techniques
        }
      },
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        rockSalt: ['Rock Salt', 'cursive'],
        techMono: ['Space Mono', 'monospace'],
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'bloom': 'bloom 4s infinite ease-in-out',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bloom: {
          '0%, 100%': { opacity: '0.6', filter: 'blur(4px)' },
          '50%': { opacity: '1', filter: 'blur(8px)' },
        }
      },
    },
  },
  plugins: [],
}