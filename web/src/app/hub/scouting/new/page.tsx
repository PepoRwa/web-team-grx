'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { ScoutingTournamentForm } from '@/components/scouting-tournament-form'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, createScoutingTournament } from '@/lib/api'

export default function NewScoutingTournamentPage() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canScout) router.replace('/hub/')
  }, [authLoading, session, permissions, router])

  if (authLoading || !session || (permissions && !permissions.canScout)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell activeNav="scouting" title="Nouveau tournoi" backHref="/hub/scouting/">
      <main className="mx-auto max-w-2xl px-4 py-6">
        <ScoutingTournamentForm
          submitting={submitting}
          onCancel={() => router.push('/hub/scouting/')}
          onSubmit={async (data) => {
            if (!session.access_token) return
            setSubmitting(true)
            try {
              const { tournament } = await createScoutingTournament(session.access_token, data)
              router.push(`/hub/scouting/tournaments/view/?id=${tournament.id}`)
            } catch (err) {
              throw err instanceof ApiError ? err : new Error('Création échouée')
            } finally {
              setSubmitting(false)
            }
          }}
        />
      </main>
    </HubShell>
  )
}
