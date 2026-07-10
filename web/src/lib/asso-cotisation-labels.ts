import type { AssoCotisationStatus, AssoCotisationType } from '@/lib/api'

export const cotisationTypeLabels: Record<AssoCotisationType, string> = {
  complete: 'Complète',
  partielle: 'Partielle',
  dispense: 'Dispensée',
}

export const cotisationStatusLabels: Record<AssoCotisationStatus, string> = {
  paye: 'Payé',
  en_attente: 'En attente',
  expire: 'Expiré',
  dispense: 'Dispensé',
}

export const cotisationStatusBadgeClass: Record<AssoCotisationStatus, string> = {
  paye: 'badge-mint',
  en_attente: 'badge-lavender',
  expire: '',
  dispense: 'badge',
}
