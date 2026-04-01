import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Gowrax Team Hub',
        short_name: 'Gowrax',
        description: 'Application officielle de la Team Gowrax (Planning, check-in, etc.)',
        theme_color: '#0D0E15',
        background_color: '#0D0E15',
        display: 'standalone',
        icons: [
          {
            src: 'logo-team-esport.png', // Idéalement à remplacer par pwa-192x192.png et 512x512.png
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/', // Racine puisque tu utilises un nom de domaine personnalisé (team.gowrax.me)
  build: {
    sourcemap: false, // Désactive la génération des source maps pour la prod (sécurité)
  }
})
