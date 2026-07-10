import type { AssoCotisationType, StructureRole } from '@/lib/api'

export function requiresLegalGuardian(dateOfBirth: string | null | undefined): boolean {
  if (!dateOfBirth) return false
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return false
  const ageMs = Date.now() - dob.getTime()
  return ageMs / (365.25 * 24 * 60 * 60 * 1000) < 16
}

export function requiresExemptionJustification(type: AssoCotisationType): boolean {
  return type === 'partielle' || type === 'dispense'
}

export function validateStructureRoles(roles: StructureRole[]): string | null {
  if (roles.length === 0) return 'Au moins un rôle structure est requis.'
  for (const role of roles) {
    if (role.kind === 'joueur' && !role.division) {
      return 'Division requise pour un joueur compétitif.'
    }
    if (
      (role.kind === 'staff_sportif' || role.kind === 'staff_com' || role.kind === 'medias') &&
      !role.function?.trim()
    ) {
      return 'Fonction requise pour ce rôle.'
    }
    if (role.kind === 'autre' && !role.label?.trim()) {
      return 'Libellé requis pour le rôle « autre ».'
    }
  }
  return null
}
