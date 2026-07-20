import { isFeatureEnabled } from '@/lib/feature-flags'
import type { UserPermissions } from '@/lib/user-permissions'

/** Liste et fiches des autres membres — réservé au staff (désactivé soft via feature flag). */
export function canViewTeamProfiles(permissions: UserPermissions | null | undefined): boolean {
  if (!isFeatureEnabled('teamProfiles')) return false
  return Boolean(permissions?.isStaff)
}

/** Capitaine désigné en base (table roster_captains) — accès tryouts lecture sur son/ses roster(s). */
export function isEffectiveCaptain(permissions: UserPermissions | null | undefined): boolean {
  return Boolean(permissions?.isCaptain && permissions.captainRosters.length > 0)
}

export function canManageCaptains(permissions: UserPermissions | null | undefined): boolean {
  return Boolean(permissions?.canManageCaptains)
}

export function canEditTeamProfiles(permissions: UserPermissions | null | undefined): boolean {
  return Boolean(permissions?.canEditTeamProfiles)
}
