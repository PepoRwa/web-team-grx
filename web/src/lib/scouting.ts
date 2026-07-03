import type { ScoutingPlayer, ScoutingRole, ScoutingVerificationStatus } from '@/lib/api'

export const SCOUTING_ROLES: { value: ScoutingRole; label: string }[] = [
  { value: 'duellist', label: 'Duelliste' },
  { value: 'initiator', label: 'Initiateur' },
  { value: 'controller', label: 'Contrôleur' },
  { value: 'sentinel', label: 'Sentinelle' },
  { value: 'flex', label: 'Flex' },
]

export const VALORANT_RANKS = [
  'Iron 1',
  'Iron 2',
  'Iron 3',
  'Bronze 1',
  'Bronze 2',
  'Bronze 3',
  'Silver 1',
  'Silver 2',
  'Silver 3',
  'Gold 1',
  'Gold 2',
  'Gold 3',
  'Platinum 1',
  'Platinum 2',
  'Platinum 3',
  'Diamond 1',
  'Diamond 2',
  'Diamond 3',
  'Ascendant 1',
  'Ascendant 2',
  'Ascendant 3',
  'Immortal 1',
  'Immortal 2',
  'Immortal 3',
  'Radiant',
] as const

export function roleLabel(role: ScoutingRole | null | undefined) {
  if (!role) return '—'
  return SCOUTING_ROLES.find((r) => r.value === role)?.label ?? role
}

export function verificationBadgeClass(status: ScoutingVerificationStatus) {
  return status === 'verified' ? 'badge-mint' : 'badge-gold'
}

export function verificationLabel(status: ScoutingVerificationStatus) {
  return status === 'verified' ? 'Vérifié' : 'À vérifier'
}

export function starterLabel(isStarter: boolean | null | undefined) {
  if (isStarter === true) return 'Titulaire'
  if (isStarter === false) return 'Remplaçant'
  return 'Inconnu'
}

export function formatTrustScore(score: number | null | undefined) {
  if (score == null) return '—'
  return `${Math.round(score)}%`
}

export function formatOptionalNumber(value: number | null | undefined, suffix = '') {
  if (value == null) return '—'
  return `${value}${suffix}`
}

export function playerDisplayName(player: Pick<ScoutingPlayer, 'riotDisplay' | 'riotId' | 'riotTag'>) {
  return player.riotDisplay || `${player.riotId}#${player.riotTag}`
}

export const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]'
