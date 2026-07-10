import type { AssoCotisationType } from '@/lib/api'

export function requiresCotisationExemptionJustification(
  cotisationType: AssoCotisationType,
): boolean {
  return cotisationType === 'partielle' || cotisationType === 'dispense'
}

export function validateCotisationExemptionClient(
  cotisationType: AssoCotisationType,
  exemptionRef: string,
  exemptionNote: string,
): string | null {
  if (!requiresCotisationExemptionJustification(cotisationType)) return null
  if (!exemptionRef.trim() && !exemptionNote.trim()) {
    return 'Cotisation partielle ou dispensée : indiquez le n° de délibération du bureau, ou un engagement sur l\'honneur d\'un membre du staff avec les motifs.'
  }
  return null
}
