'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { ScoutingPlayerForm } from '@/components/scouting-player-form'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  deleteScoutingPlayer,
  getScoutingPlayer,
  updateScoutingPlayer,
} from '@/lib/api'

function EditPlayerContent() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const id = Number(params.get('id'))
  const teamId = params.get('teamId')
  const tournamentId = params.get('tournamentId')
  const backHref = `/hub/scouting/players/view/?id=${id}&teamId=${teamId ?? ''}${tournamentId ? `&tournamentId=${tournamentId}` : ''}`
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [player, setPlayer] = useState<Awaited<ReturnType<typeof getScoutingPlayer>>['player'] | null>(
    null,
  )

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canScout) router.replace('/hub/')
  }, [authLoading, session, permissions, router])

  useEffect(() => {
    if (!session?.access_token || !id) return
    getScoutingPlayer(session.access_token, id)
      .then((d) => setPlayer(d.player))
      .catch(() => router.replace('/hub/scouting/'))
      .finally(() => setLoading(false))
  }, [session?.access_token, id, router])

  if (authLoading || !session || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  if (!player) return null

  return (
    <HubShell activeNav="scouting" title="Modifier joueur" backHref={backHref}>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <ScoutingPlayerForm
          initial={player}
          submitting={submitting}
          onCancel={() => router.push(backHref)}
          onDelete={
            permissions?.isStaff
              ? async () => {
                  if (!session.access_token || !confirm('Supprimer cette fiche ?')) return
                  await deleteScoutingPlayer(session.access_token, id)
                  router.push(
                    teamId
                      ? `/hub/scouting/teams/view/?id=${teamId}${tournamentId ? `&tournamentId=${tournamentId}` : ''}`
                      : '/hub/scouting/',
                  )
                }
              : undefined
          }
          onSubmit={async (data) => {
            if (!session.access_token) return
            setSubmitting(true)
            try {
              await updateScoutingPlayer(session.access_token, id, data)
              router.push(backHref)
            } catch (err) {
              throw err instanceof ApiError ? err : new Error('Mise à jour échouée')
            } finally {
              setSubmitting(false)
            }
          }}
        />
      </main>
    </HubShell>
  )
}

export default function EditScoutingPlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <EditPlayerContent />
    </Suspense>
  )
}
