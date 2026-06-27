'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('gowrax-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = stored ?? (prefersDark ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', theme)
  }, [])
  return <>{children}</>
}

export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    setThemeState(
      (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') ?? 'light',
    )
  }, [])

  const setTheme = (t: 'light' | 'dark') => {
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('gowrax-theme', t)
    setThemeState(t)
  }

  const toggle = () => setTheme(theme === 'light' ? 'dark' : 'light')

  return { theme, setTheme, toggle }
}

import { syncSession, ApiError } from '@/lib/api'

export function AuthCallback() {
  const router = useRouter()
  const [message, setMessage] = useState('Connexion en cours…')

  useEffect(() => {
    const handle = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setMessage(`Erreur : ${error.message}`)
          return
        }
      }

      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) {
        setMessage('Session introuvable. Réessaie.')
        return
      }

      try {
        await syncSession(data.session.access_token)
        router.replace('/hub/')
      } catch (err) {
        if (err instanceof ApiError && err.code === 'LAUNCH_LOCKED') {
          await supabase.auth.signOut()
          router.replace('/launch/')
          return
        }
        setMessage(err instanceof Error ? err.message : 'Sync échouée')
      }
    }

    handle()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="card max-w-md p-8 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        <p className="text-lg font-medium">{message}</p>
      </div>
    </div>
  )
}
