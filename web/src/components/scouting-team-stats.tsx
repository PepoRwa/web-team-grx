'use client'

import type { ScoutingTeamStats } from '@/lib/api'
import { formatTrustScore, formatOptionalNumber } from '@/lib/scouting'

interface ScoutingTeamStatsProps {
  stats: ScoutingTeamStats | null
  players: { id: number; riotDisplay: string }[]
}

export function ScoutingTeamStatsPanel({ stats, players }: ScoutingTeamStatsProps) {
  if (!stats) return null

  const strongest = players.find((p) => p.id === stats.strongestPlayerId)
  const weakest = players.find((p) => p.id === stats.weakestPlayerId)

  return (
    <section className="card space-y-4 p-5">
      <div>
        <h2 className="text-lg font-bold">Stats équipe</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Agrégats basés sur {stats.verifiedCount} fiche{stats.verifiedCount !== 1 ? 's' : ''}{' '}
          vérifiée{stats.verifiedCount !== 1 ? 's' : ''}
          {stats.pendingCount > 0
            ? ` · ${stats.pendingCount} en attente exclue${stats.pendingCount !== 1 ? 's' : ''}`
            : ''}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Trust score" value={formatTrustScore(stats.trustScore)} highlight />
        <StatCard label="ACS moyen" value={formatOptionalNumber(stats.avgAcs)} />
        <StatCard label="KDA moyen" value={formatOptionalNumber(stats.avgKda)} />
        <StatCard label="Winrate moy." value={formatOptionalNumber(stats.avgWinrate, '%')} />
        <StatCard label="Rang moyen" value={formatOptionalNumber(stats.avgRank)} />
        <StatCard label="Rang médian" value={formatOptionalNumber(stats.medianRank)} />
        <StatCard label="Écart-type rangs" value={formatOptionalNumber(stats.rankStdDev)} />
      </div>

      {(strongest || weakest) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {strongest && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm">
              <span className="text-[var(--text-muted)]">Plus fort · </span>
              <span className="font-semibold">{strongest.riotDisplay}</span>
            </div>
          )}
          {weakest && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm">
              <span className="text-[var(--text-muted)]">Plus faible · </span>
              <span className="font-semibold">{weakest.riotDisplay}</span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight
          ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
          : 'border-[var(--border)] bg-[var(--bg)]'
      }`}
    >
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  )
}
