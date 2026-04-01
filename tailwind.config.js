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
          purple: '#6F2DBD',
          void: '#1A1C2E',
          abyss: '#0D0E15',
          neon: '#D62F7F'
        }
      },
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        rockSalt: ['Rock Salt', 'cursive'],
        techMono: ['Space Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}

