'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { ExternalLink, Plus, Users } from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  getScoutingTournament,
  type ScoutingTeam,
  type ScoutingTournament,
} from '@/lib/api'

function TournamentViewContent() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const id = Number(params.get('id'))
  const [tournament, setTournament] = useState<ScoutingTournament | null>(null)
  const [teams, setTeams] = useState<ScoutingTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canScout) router.replace('/hub/')
  }, [authLoading, session, permissions, router])

  const load = useCallback(async () => {
    if (!session?.access_token || !id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getScoutingTournament(session.access_token, id)
      setTournament(data.tournament)
      setTeams(data.teams)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Tournoi introuvable')
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
    <HubShell
      activeNav="scouting"
      title={tournament?.name ?? 'Tournoi'}
      backHref="/hub/scouting/"
    >
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {loading ? (
          <div className="card h-32 animate-pulse bg-lavender/10" />
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : tournament ? (
          <>
            <section className="card space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold">{tournament.name}</h1>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {[tournament.startDate, tournament.endDate, tournament.format]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <Link
                  href={`/hub/scouting/tournaments/edit/?id=${tournament.id}`}
                  className="btn-ghost text-sm"
                >
                  Modifier
                </Link>
              </div>
              {tournament.rulesUrl && (
                <a
                  href={tournament.rulesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[var(--accent)]"
                >
                  Règlement <ExternalLink size={14} />
                </a>
              )}
              {tournament.notes && (
                <p className="text-sm text-[var(--text-muted)]">{tournament.notes}</p>
              )}
            </section>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Équipes adverses</h2>
              <Link
                href={`/hub/scouting/teams/new/?tournamentId=${tournament.id}`}
                className="btn-primary inline-flex text-sm"
              >
                <Plus size={16} />
                Ajouter équipe
              </Link>
            </div>

            {teams.length === 0 ? (
              <div className="card p-8 text-center text-sm text-[var(--text-muted)]">
                Aucune équipe liée à ce tournoi.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {teams.map((team) => (
                  <Link
                    key={team.id}
                    href={`/hub/scouting/teams/view/?id=${team.id}&tournamentId=${tournament.id}`}
                    className="card flex items-center justify-between gap-3 p-5 transition hover:border-[var(--accent)]"
                  >
                    <div>
                      <p className="font-semibold">
                        {team.name}
                        {team.tag && (
                          <span className="ml-2 text-sm text-[var(--text-muted)]">[{team.tag}]</span>
                        )}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <Users size={12} />
                        {team.playerCount ?? 0} joueur{(team.playerCount ?? 0) !== 1 ? 's' : ''}
                        {team.seed && ` · Seed ${team.seed}`}
                      </p>
                    </div>
                    {team.stats && (
                      <span className="badge badge-lavender">
                        Trust{' '}
                        {team.stats.trustScore != null
                          ? `${Math.round(team.stats.trustScore)}%`
                          : '—'}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : null}
      </main>
    </HubShell>
  )
}

export default function ScoutingTournamentViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <TournamentViewContent />
    </Suspense>
  )
}
