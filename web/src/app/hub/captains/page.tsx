'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { RosterCaptainsPanel } from '@/components/roster-captains-panel'
import { useAuth } from '@/hooks/useAuth'
import { canManageCaptains } from '@/lib/permissions'

export default function CaptainsPage() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !canManageCaptains(permissions)) {
      router.replace('/hub/')
    }
  }, [authLoading, session, permissions, router])

  if (authLoading || !session || !permissions?.canManageCaptains) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell activeNav="hub" title="Capitaines" subtitle="Un capitaine par roster" backHref="/hub/">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <RosterCaptainsPanel accessToken={session.access_token} />
      </main>
    </HubShell>
  )
}
