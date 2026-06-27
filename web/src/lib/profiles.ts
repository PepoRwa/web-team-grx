import type { ProfileGame } from './api'

export function gameLabel(game: ProfileGame | string) {
  switch (game) {
    case 'valorant':
      return 'Valorant'
    case 'cs2':
      return 'CS2'
    default:
      return 'Autre'
  }
}

export function gameBadgeClass(game: ProfileGame | string) {
  switch (game) {
    case 'valorant':
      return 'badge-rose'
    case 'cs2':
      return 'badge-gold'
    default:
      return 'badge-lavender'
  }
}

export function trackerDisplayUrl(url: string | null) {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.hostname.replace('www.', '')
  } catch {
    return url
  }
}
