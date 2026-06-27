import type { VodStatus } from './api'

export function formatMatchDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function statusLabel(status: VodStatus) {
  switch (status) {
    case 'win':
      return 'Victoire'
    case 'loss':
      return 'Défaite'
    case 'draw':
      return 'Nul'
    default:
      return status
  }
}

export function statusBadgeClass(status: VodStatus) {
  switch (status) {
    case 'win':
      return 'badge-mint'
    case 'loss':
      return 'badge-rose'
    default:
      return 'badge-gold'
  }
}
