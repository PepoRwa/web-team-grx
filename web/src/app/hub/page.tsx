'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LogOut, RefreshCw } from 'lucide-react'
import { HubDashboard } from '@/components/hub/hub-dashboard'
import { HubShell } from '@/components/hub/hub-shell'
import { useAuth } from '@/hooks/useAuth'

export default function HubPage() {
  const {
    session,
    user,
    permissions,
    loading,
    signOut,
    requestRoleResync,
  } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !session) router.replace('/')
  }, [loading, session, router])

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-lavender/40" />
          <div className="absolute inset-0 animate-ping rounded-2xl bg-lavender/20" />
        </div>
      </div>
    )
  }

  const inOnboarding = user && !user.onboardingCompletedAt

  if (permissions && !permissions.canAccessSite && !inOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-xl font-bold">Accès refusé</h1>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Tu es connecté Discord mais tu n&apos;as pas le rôle Membre Gowrax,
            ou la sync bot n&apos;est pas encore faite.
          </p>
          <button
            type="button"
            className="btn-primary mt-6"
            onClick={requestRoleResync}
          >
            <RefreshCw size={16} />
            Resync rôles
          </button>
          <button type="button" className="btn-ghost mt-3 w-full" onClick={signOut}>
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </div>
    )
  }

  return (
    <HubShell activeNav="hub">
      <HubDashboard />
    </HubShell>
  )
}
