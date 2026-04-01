import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/web-team-grx/', // Indispensable pour un bon routage sur Github Pages
  build: {
    sourcemap: false, // Désactive la génération des source maps pour la prod (sécurité)
    target: 'esnext',
    minify: 'esbuild',
  },
  esbuild: {
    drop: ['console', 'debugger'], // Supprime automatiquement les console.log en prod
  }
})
