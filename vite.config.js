import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Racine puisque tu utilises un nom de domaine personnalisé (team.gowrax.me)
  build: {
    sourcemap: false, // Désactive la génération des source maps pour la prod (sécurité)
  }
})
