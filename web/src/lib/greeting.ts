export function hubGreeting(date = new Date()) {
  const h = date.getHours()
  if (h < 6) return 'Bonne nuit'
  if (h < 12) return 'Bon matin'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export function relativeTime(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'À l\'instant'
  if (mins < 60) return `Il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Il y a ${days} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
