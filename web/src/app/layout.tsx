import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/components/providers'
import { SiteOverlays } from '@/components/site-overlays'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <Script src="/legacy-sw-cleanup.js" strategy="beforeInteractive" />
      </head>
      <body className={`${dmSans.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <SiteOverlays />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
