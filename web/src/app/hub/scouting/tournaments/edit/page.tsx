'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { ScoutingTournamentForm } from '@/components/scouting-tournament-form'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  deleteScoutingTournament,
  getScoutingTournament,
  updateScoutingTournament,
} from '@/lib/api'

function EditTournamentContent() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const id = Number(params.get('id'))
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canScout) router.replace('/hub/')
  }, [authLoading, session, permissions, router])

  const [tournament, setTournament] = useState<Awaited<
    ReturnType<typeof getScoutingTournament>
  >['tournament'] | null>(null)

  useEffect(() => {
    if (!session?.access_token || !id) return
    getScoutingTournament(session.access_token, id)
      .then((d) => setTournament(d.tournament))
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

  if (!tournament) return null

  return (
    <HubShell
      activeNav="scouting"
      title="Modifier tournoi"
      backHref={`/hub/scouting/tournaments/view/?id=${id}`}
    >
      <main className="mx-auto max-w-2xl px-4 py-6">
        <ScoutingTournamentForm
          initial={tournament}
          submitting={submitting}
          onCancel={() => router.push(`/hub/scouting/tournaments/view/?id=${id}`)}
          onDelete={
            permissions?.isStaff
              ? async () => {
                  if (!session.access_token || !confirm('Supprimer ce tournoi ?')) return
                  await deleteScoutingTournament(session.access_token, id)
                  router.push('/hub/scouting/')
                }
              : undefined
          }
          onSubmit={async (data) => {
            if (!session.access_token) return
            setSubmitting(true)
            try {
              await updateScoutingTournament(session.access_token, id, data)
              router.push(`/hub/scouting/tournaments/view/?id=${id}`)
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

export default function EditScoutingTournamentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <EditTournamentContent />
    </Suspense>
  )
}
