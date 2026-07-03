'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { ScoutingTeamForm } from '@/components/scouting-team-form'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  deleteScoutingTeam,
  getScoutingTeam,
  updateScoutingTeam,
} from '@/lib/api'

function EditTeamContent() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const id = Number(params.get('id'))
  const tournamentId = params.get('tournamentId')
  const backHref = `/hub/scouting/teams/view/?id=${id}${tournamentId ? `&tournamentId=${tournamentId}` : ''}`
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [team, setTeam] = useState<Awaited<ReturnType<typeof getScoutingTeam>>['team'] | null>(
    null,
  )

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canScout) router.replace('/hub/')
  }, [authLoading, session, permissions, router])

  useEffect(() => {
    if (!session?.access_token || !id) return
    getScoutingTeam(session.access_token, id)
      .then((d) => setTeam(d.team))
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

  if (!team) return null

  return (
    <HubShell activeNav="scouting" title="Modifier équipe" backHref={backHref}>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <ScoutingTeamForm
          initial={team}
          submitting={submitting}
          onCancel={() => router.push(backHref)}
          onDelete={
            permissions?.isStaff
              ? async () => {
                  if (!session.access_token || !confirm('Supprimer cette équipe ?')) return
                  await deleteScoutingTeam(session.access_token, id)
                  router.push(
                    tournamentId
                      ? `/hub/scouting/tournaments/view/?id=${tournamentId}`
                      : '/hub/scouting/',
                  )
                }
              : undefined
          }
          onSubmit={async (data) => {
            if (!session.access_token) return
            setSubmitting(true)
            try {
              await updateScoutingTeam(session.access_token, id, data)
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

export default function EditScoutingTeamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <EditTeamContent />
    </Suspense>
  )
}
