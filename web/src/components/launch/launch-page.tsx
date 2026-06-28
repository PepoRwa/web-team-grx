'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  BookOpen,
  Film,
  LayoutDashboard,
  Megaphone,
  Moon,
  Sun,
  User,
} from 'lucide-react'
import { LaunchCountdown } from '@/components/launch/launch-countdown'
import { OrbitalHub } from '@/components/landing/landing-visuals'
import { SystemOutage } from '@/components/system-outage'
import { useTheme } from '@/components/providers'
import { useAuth } from '@/hooks/useAuth'
import { useLaunchStatus } from '@/hooks/useLaunchStatus'

interface LaunchPageProps {
  onLogin: () => void
  loginLoading: boolean
  loginError: string | null
}

const TEASERS = [
  { icon: Film, label: 'VODs' },
  { icon: BookOpen, label: 'Strats' },
  { icon: User, label: 'Profils' },
  { icon: Megaphone, label: 'News' },
]

export function LaunchPage({ onLogin, loginLoading, loginError }: LaunchPageProps) {
  const { status, loading, incident, refresh } = useLaunchStatus()
  const { permissions, session } = useAuth()
  const { theme, toggle } = useTheme()
  const router = useRouter()

  const isCEO = permissions?.isCEO ?? false
  const phase = status?.phase ?? 'countdown'
  const canLogin = phase === 'live' || isCEO

  useEffect(() => {
    if (!loading && status?.phase === 'live') {
      router.replace('/')
    }
  }, [loading, status?.phase, router])

  useEffect(() => {
    if (!loading && session && permissions?.isCEO && phase === 'countdown') {
      router.replace('/hub/')
    }
  }, [loading, session, permissions?.isCEO, phase, router])

  if (incident) {
    return <SystemOutage incident={incident} onRetry={() => void refresh()} />
  }

  if (loading || !status || status.phase === 'live') {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-lavender/40" />
      </div>
    )
  }

  return (
    <div className="launch-root">
      <div className="launch-bg" aria-hidden>
        <div className="launch-bg-blob launch-bg-blob-1" />
        <div className="launch-bg-blob launch-bg-blob-2" />
      </div>

      <header className="launch-nav">
        <Link href="/launch/" className="flex items-center gap-2.5">
          <Image src="/logo-team-esport.png" alt="Gowrax" width={36} height={36} className="rounded-xl" />
          <span className="text-sm font-bold tracking-wide text-[var(--accent)]">GOWRAX</span>
        </Link>
        <button type="button" onClick={toggle} className="btn-ghost p-2" aria-label="Thème">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </header>

      <main className="launch-main">
        <div className="launch-visual-xl">
          <OrbitalHub />
        </div>

        {phase === 'countdown' && (
          <>
            <h1 className="launch-title">Le hub Gowrax arrive.</h1>
            <p className="launch-subtitle">27 juin 2026 · 19h45 · Team Hub</p>

            {status.ceoMessageBody && (
              <blockquote className="launch-ceo-message">
                {status.ceoMessageTitle && (
                  <p className="mb-2 text-sm font-semibold text-[var(--accent)]">
                    {status.ceoMessageTitle}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{status.ceoMessageBody}</p>
              </blockquote>
            )}

            <LaunchCountdown
              secondsRemaining={status.secondsRemaining}
              progress={status.progress}
            />

            <div className="launch-teasers">
              {TEASERS.map((t) => (
                <div key={t.label} className="launch-teaser">
                  <t.icon size={18} className="text-[var(--accent)]" />
                  <span>{t.label}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className={`launch-cta-primary mt-8 ${!canLogin ? 'launch-cta-disabled' : ''}`}
              onClick={canLogin ? onLogin : undefined}
              disabled={!canLogin || loginLoading}
            >
              <LayoutDashboard size={20} />
              {loginLoading
                ? 'Connexion…'
                : isCEO
                  ? 'Accès anticipé CEO'
                  : 'Ouverture à 19h45'}
            </button>
            {loginError && <p className="mt-3 text-sm text-red-500">{loginError}</p>}
          </>
        )}
      </main>
    </div>
  )
}
