import type { AssoAccessLevel, AssoModule } from '@/lib/api'

export const assoModuleLabels: Record<AssoModule, string> = {
  membres: 'Dossiers membres',
  documents: 'Documents',
  cotisations: 'Cotisations',
  assemblees: 'Assemblées',
  parametres: 'Paramètres',
}

export const assoAccessLevelLabels: Record<AssoAccessLevel, string> = {
  aucun: 'Aucun',
  lecture: 'Lecture',
  edition: 'Édition',
  admin: 'Admin',
}

export const structureRoleKindLabels = {
  joueur: 'Joueur compétitif',
  staff_sportif: 'Staff sportif',
  staff_com: 'Staff communication',
  medias: 'Médias',
  autre: 'Autre',
} as const

export const playerDivisionLabels = {
  ascendants: 'Ascendants',
  valkyries: 'Valkyries',
  cs2: 'CS2',
} as const
