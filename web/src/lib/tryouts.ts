import type {
  TryoutCampaignStatus,
  TryoutCandidateSource,
  TryoutPipelineStatus,
  TryoutRecommendation,
  TryoutSessionOutcome,
  TryoutSessionType,
  TryoutTargetRoster,
  TryoutCandidate,
} from '@/lib/api'

export const PIPELINE_STATUSES: { value: TryoutPipelineStatus; label: string }[] = [
  { value: 'new', label: 'Nouveau' },
  { value: 'contacted', label: 'Contacté' },
  { value: 'scrim_scheduled', label: 'Scrim planifié' },
  { value: 'in_trial', label: 'En essai' },
  { value: 'shortlist', label: 'Shortlist' },
  { value: 'rejected', label: 'Refusé' },
  { value: 'offered', label: 'Offre' },
  { value: 'joined', label: 'Intégré' },
  { value: 'withdrawn', label: 'Retiré' },
]

export const CAMPAIGN_STATUSES: { value: TryoutCampaignStatus; label: string }[] = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Clôturée' },
]

export const TARGET_ROSTERS: { value: TryoutTargetRoster; label: string }[] = [
  { value: 'high_roster', label: 'High Roster Valo' },
  { value: 'game_changers', label: 'Game Changers' },
  { value: 'high_roster_cs2', label: 'High Roster CS2' },
]

export const CANDIDATE_SOURCES: { value: TryoutCandidateSource; label: string }[] = [
  { value: 'discord_ticket', label: 'Ticket Discord' },
  { value: 'referral', label: 'Recommandation' },
  { value: 'open_application', label: 'Candidature ouverte' },
  { value: 'staff_scout', label: 'Scout staff' },
  { value: 'other', label: 'Autre' },
]

export const SESSION_TYPES: { value: TryoutSessionType; label: string }[] = [
  { value: 'scrim', label: 'Scrim' },
  { value: 'review', label: 'Review VOD' },
  { value: 'interview', label: 'Entretien' },
  { value: 'other', label: 'Autre' },
]

export const SESSION_OUTCOMES: { value: TryoutSessionOutcome; label: string }[] = [
  { value: 'pending', label: 'En attente' },
  { value: 'positive', label: 'Positif' },
  { value: 'neutral', label: 'Neutre' },
  { value: 'negative', label: 'Négatif' },
]

export const RECOMMENDATIONS: { value: TryoutRecommendation; label: string }[] = [
  { value: 'strong_yes', label: 'Fort oui' },
  { value: 'yes', label: 'Oui' },
  { value: 'neutral', label: 'Neutre' },
  { value: 'no', label: 'Non' },
  { value: 'strong_no', label: 'Fort non' },
]

export function pipelineLabel(status: TryoutPipelineStatus | undefined) {
  if (!status) return '—'
  return PIPELINE_STATUSES.find((s) => s.value === status)?.label ?? status
}

export function pipelineBadgeClass(status: TryoutPipelineStatus | undefined) {
  switch (status) {
    case 'shortlist':
    case 'offered':
    case 'joined':
      return 'badge-mint'
    case 'rejected':
    case 'withdrawn':
      return 'badge-coral'
    case 'in_trial':
    case 'scrim_scheduled':
      return 'badge-sky'
    case 'contacted':
      return 'badge-lavender'
    default:
      return 'badge-gold'
  }
}

export function campaignStatusLabel(status: TryoutCampaignStatus) {
  return CAMPAIGN_STATUSES.find((s) => s.value === status)?.label ?? status
}

export function targetRosterLabel(roster: TryoutTargetRoster) {
  return TARGET_ROSTERS.find((r) => r.value === roster)?.label ?? roster
}

export function candidateDisplayName(c: Pick<TryoutCandidate, 'displayName' | 'riotId' | 'riotTag'>) {
  if (c.displayName?.trim()) return c.displayName.trim()
  return `${c.riotId}#${c.riotTag}`
}

export function sessionOutcomeLabel(outcome: TryoutSessionOutcome) {
  return SESSION_OUTCOMES.find((o) => o.value === outcome)?.label ?? outcome
}

export function recommendationLabel(rec: TryoutRecommendation) {
  return RECOMMENDATIONS.find((r) => r.value === rec)?.label ?? rec
}
