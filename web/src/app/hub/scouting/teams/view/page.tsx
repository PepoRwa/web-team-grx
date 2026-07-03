'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { ScoutingPlayerCard } from '@/components/scouting-player-card'
import { ScoutingTeamStatsPanel } from '@/components/scouting-team-stats'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, getScoutingTeam, type ScoutingPlayer, type ScoutingTeam } from '@/lib/api'

function TeamViewContent() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const id = Number(params.get('id'))
  const tournamentId = params.get('tournamentId')
  const backHref = tournamentId
    ? `/hub/scouting/tournaments/view/?id=${tournamentId}`
    : '/hub/scouting/'

  const [team, setTeam] = useState<ScoutingTeam | null>(null)
  const [players, setPlayers] = useState<ScoutingPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canScout) router.replace('/hub/')
  }, [authLoading, session, permissions, router])

  const load = useCallback(async () => {
    if (!session?.access_token || !id) return
    setLoading(true)
    try {
      const data = await getScoutingTeam(session.access_token, id)
      setTeam(data.team)
      setPlayers(data.players)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Équipe introuvable')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, id])

  useEffect(() => {
    if (!authLoading && session?.access_token && permissions?.canScout && id) void load()
  }, [load, authLoading, session?.access_token, permissions?.canScout, id])

  if (authLoading || !session || (permissions && !permissions.canScout)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell activeNav="scouting" title={team?.name ?? 'Équipe'} backHref={backHref}>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {loading ? (
          <div className="card h-32 animate-pulse bg-lavender/10" />
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : team ? (
          <>
            <section className="card flex flex-wrap items-start justify-between gap-3 p-5">
              <div>
                <h1 className="text-xl font-bold">
                  {team.name}
                  {team.tag && (
                    <span className="ml-2 text-base font-normal text-[var(--text-muted)]">
                      [{team.tag}]
                    </span>
                  )}
                </h1>
                {team.notes && (
                  <p className="mt-2 text-sm text-[var(--text-muted)]">{team.notes}</p>
                )}
              </div>
              <Link
                href={`/hub/scouting/teams/edit/?id=${team.id}${tournamentId ? `&tournamentId=${tournamentId}` : ''}`}
                className="btn-ghost text-sm"
              >
                Modifier
              </Link>
            </section>

            <ScoutingTeamStatsPanel stats={team.stats} players={players} />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Joueurs</h2>
              <Link
                href={`/hub/scouting/players/new/?teamId=${team.id}${tournamentId ? `&tournamentId=${tournamentId}` : ''}`}
                className="btn-primary inline-flex text-sm"
              >
                <Plus size={16} />
                Ajouter joueur
              </Link>
            </div>

            {players.length === 0 ? (
              <div className="card p-8 text-center text-sm text-[var(--text-muted)]">
                Aucun joueur scouté pour cette équipe.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {players.map((p) => (
                  <ScoutingPlayerCard
                    key={p.id}
                    player={p}
                    href={`/hub/scouting/players/view/?id=${p.id}&teamId=${team.id}${tournamentId ? `&tournamentId=${tournamentId}` : ''}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : null}
      </main>
    </HubShell>
  )
}

export default function ScoutingTeamViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <TeamViewContent />
    </Suspense>
  )
}
