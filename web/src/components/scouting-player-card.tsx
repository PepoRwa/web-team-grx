'use client'

import Link from 'next/link'
import type { ScoutingPlayer } from '@/lib/api'
import {
  formatTrustScore,
  playerDisplayName,
  roleLabel,
  starterLabel,
  verificationBadgeClass,
  verificationLabel,
} from '@/lib/scouting'

interface ScoutingPlayerCardProps {
  player: ScoutingPlayer
  href: string
}

export function ScoutingPlayerCard({ player, href }: ScoutingPlayerCardProps) {
  return (
    <Link href={href} className="card block p-4 transition hover:border-[var(--accent)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{playerDisplayName(player)}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {roleLabel(player.role)} · {starterLabel(player.isStarter)}
          </p>
        </div>
        <span className={`badge shrink-0 ${verificationBadgeClass(player.verificationStatus)}`}>
          {verificationLabel(player.verificationStatus)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
        {player.currentRank && <span className="badge badge-lavender">{player.currentRank}</span>}
        {player.avgAcs != null && <span>ACS {player.avgAcs}</span>}
        {player.trustFactor != null && (
          <span>Trust {formatTrustScore(player.trustFactor)}</span>
        )}
      </div>
    </Link>
  )
}
