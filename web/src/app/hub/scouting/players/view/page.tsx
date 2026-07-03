'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, getScoutingPlayer, verifyScoutingPlayer } from '@/lib/api'
import {
  formatOptionalNumber,
  formatTrustScore,
  playerDisplayName,
  roleLabel,
  starterLabel,
  verificationBadgeClass,
  verificationLabel,
} from '@/lib/scouting'

function PlayerViewContent() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const id = Number(params.get('id'))
  const teamId = params.get('teamId')
  const tournamentId = params.get('tournamentId')
  const backHref = teamId
    ? `/hub/scouting/teams/view/?id=${teamId}${tournamentId ? `&tournamentId=${tournamentId}` : ''}`
    : '/hub/scouting/'

  const [player, setPlayer] = useState<Awaited<ReturnType<typeof getScoutingPlayer>>['player'] | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canScout) router.replace('/hub/')
  }, [authLoading, session, permissions, router])

  const load = useCallback(async () => {
    if (!session?.access_token || !id) return
    setLoading(true)
    try {
      const data = await getScoutingPlayer(session.access_token, id)
      setPlayer(data.player)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Joueur introuvable')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, id])

  useEffect(() => {
    if (!authLoading && session?.access_token && permissions?.canScout && id) void load()
  }, [load, authLoading, session?.access_token, permissions?.canScout, id])

  async function handleVerify() {
    if (!session?.access_token || !player) return
    setVerifying(true)
    try {
      const { player: updated } = await verifyScoutingPlayer(session.access_token, player.id)
      setPlayer(updated)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Validation échouée')
    } finally {
      setVerifying(false)
    }
  }

  if (authLoading || !session || (permissions && !permissions.canScout)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell activeNav="scouting" title={player ? playerDisplayName(player) : 'Joueur'} backHref={backHref}>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        {loading ? (
          <div className="card h-40 animate-pulse bg-lavender/10" />
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : player ? (
          <>
            <section className="card space-y-4 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold">{playerDisplayName(player)}</h1>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {roleLabel(player.role)} · {starterLabel(player.isStarter)}
                  </p>
                </div>
                <span className={`badge ${verificationBadgeClass(player.verificationStatus)}`}>
                  {verificationLabel(player.verificationStatus)}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Info label="Rang actuel" value={player.currentRank} />
                <Info label="Peak saison" value={player.peakRankCurrent} />
                <Info label="Peak S-1" value={player.peakRankPrev} />
                <Info label="Fin S-1" value={player.endRankPrev} />
                <Info label="Games" value={formatOptionalNumber(player.gamesThisSeason)} />
                <Info label="Winrate" value={formatOptionalNumber(player.recentWinrate, '%')} />
                <Info label="ACS" value={formatOptionalNumber(player.avgAcs)} />
                <Info label="KDA" value={formatOptionalNumber(player.avgKda)} />
                <Info label="Trust factor" value={formatTrustScore(player.trustFactor)} />
              </div>

              {player.agentPool && player.agentPool.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)]">Agent pool</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {player.agentPool.map((a) => (
                      <span key={a.agent} className="badge badge-lavender">
                        {a.agent}
                        {a.pickRate != null ? ` ${a.pickRate}%` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {player.formerTeam && (
                <Info label="Ancienne structure" value={player.formerTeam} />
              )}
              {player.notes && (
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)]">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{player.notes}</p>
                </div>
              )}

              <p className="text-xs text-[var(--text-muted)]">
                Mis à jour par {player.updatedByUsername ?? player.updatedByDiscordId} ·{' '}
                {new Date(player.updatedAt).toLocaleString('fr-FR')}
                {player.verifiedAt && (
                  <>
                    {' '}
                    · Vérifié par {player.verifiedByUsername ?? player.verifiedByDiscordId}
                  </>
                )}
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/hub/scouting/players/edit/?id=${player.id}&teamId=${player.teamId}${tournamentId ? `&tournamentId=${tournamentId}` : ''}`}
                  className="btn-ghost"
                >
                  Modifier
                </Link>
                {permissions?.isStaff && player.verificationStatus === 'pending' && (
                  <button
                    type="button"
                    className="btn-primary inline-flex"
                    disabled={verifying}
                    onClick={() => void handleVerify()}
                  >
                    <CheckCircle size={18} />
                    {verifying ? 'Validation…' : 'Valider la fiche'}
                  </button>
                )}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </HubShell>
  )
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value || '—'}</p>
    </div>
  )
}

export default function ScoutingPlayerViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <PlayerViewContent />
    </Suspense>
  )
}
