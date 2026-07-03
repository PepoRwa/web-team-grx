'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { ScoutingPlayerForm } from '@/components/scouting-player-form'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, createScoutingPlayer } from '@/lib/api'

function NewPlayerContent() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const teamId = Number(params.get('teamId'))
  const tournamentId = params.get('tournamentId')
  const backHref = `/hub/scouting/teams/view/?id=${teamId}${tournamentId ? `&tournamentId=${tournamentId}` : ''}`
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canScout) router.replace('/hub/')
    if (!authLoading && !teamId) router.replace('/hub/scouting/')
  }, [authLoading, session, permissions, teamId, router])

  if (authLoading || !session || (permissions && !permissions.canScout)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell activeNav="scouting" title="Nouveau joueur" backHref={backHref}>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <ScoutingPlayerForm
          submitting={submitting}
          onCancel={() => router.push(backHref)}
          onSubmit={async (data) => {
            if (!session.access_token) return
            setSubmitting(true)
            try {
              const { player } = await createScoutingPlayer(session.access_token, teamId, data)
              router.push(
                `/hub/scouting/players/view/?id=${player.id}&teamId=${teamId}${tournamentId ? `&tournamentId=${tournamentId}` : ''}`,
              )
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

export default function NewScoutingPlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <NewPlayerContent />
    </Suspense>
  )
}
