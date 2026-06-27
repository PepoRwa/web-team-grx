import type { VodPlayer } from '@/lib/api'
import { displayPlayerName } from '@/lib/vods'

interface VodPlayersProps {
  players: VodPlayer[]
}

export function VodPlayers({ players }: VodPlayersProps) {
  if (!players.length) return null

  const hasUnknown = players.some((p) => !p.username)

  return (
    <div className="mt-4">
      <p className="text-sm font-medium">Joueurs présents</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {players.map((p) => (
          <span key={p.discordId} className="badge badge-lavender">
            {displayPlayerName(p)}
          </span>
        ))}
      </div>
      {hasUnknown && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Les pseudos complets s&apos;affichent quand le joueur s&apos;est connecté au site au
          moins une fois.
        </p>
      )}
    </div>
  )
}
