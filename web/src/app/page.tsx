'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LandingPage } from '@/components/landing/landing-page'
import { SystemOutage } from '@/components/system-outage'
import { useAuth } from '@/hooks/useAuth'
import { useLaunchStatus } from '@/hooks/useLaunchStatus'

export default function HomePage() {
  const { session, loading: authLoading, signInWithDiscord, error } = useAuth()
  const { loading: launchLoading, isPreLive, incident: launchIncident, refresh } = useLaunchStatus()
  const router = useRouter()

  useEffect(() => {
    if (launchIncident) return
    if (!launchLoading && isPreLive) {
      router.replace('/launch/')
      return
    }
    if (!authLoading && !launchLoading && session && !isPreLive) {
      router.replace('/hub/')
    }
  }, [authLoading, launchLoading, session, isPreLive, launchIncident, router])

  if (launchIncident) {
    return <SystemOutage incident={launchIncident} onRetry={() => void refresh()} />
  }

  if (authLoading || launchLoading || isPreLive) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-lavender/40" />
      </div>
    )
  }

  if (session) return null

  return (
    <LandingPage
      onLogin={signInWithDiscord}
      loginLoading={authLoading}
      loginError={error}
    />
  )
}
