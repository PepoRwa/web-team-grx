import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { DM_Sans, Good_Vibes } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/components/providers'
import { SiteOverlays } from '@/components/site-overlays'
import { SystemGate } from '@/components/system-gate'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

const goodVibes = Good_Vibes({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-good-vibes',
})

export const metadata: Metadata = {
  title: 'Gowrax Team Hub',
  description: 'Hub staff & joueurs — Gowrax Esport',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Gowrax',
    statusBarStyle: 'default',
  },
  icons: {
    apple: '/logo-team-esport.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#C4B5FD',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const SW_CLEANUP = `(function(){if(!('serviceWorker'in navigator))return;navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(x){x.unregister()})});if('caches'in window){caches.keys().then(function(k){k.forEach(function(c){caches.delete(c)})})}navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).catch(function(){})})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SW_CLEANUP }} />
        <Script src="/legacy-sw-cleanup.js" strategy="beforeInteractive" />
      </head>
      <body className={`${dmSans.variable} ${goodVibes.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <SystemGate>
              {children}
              <SiteOverlays />
            </SystemGate>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
