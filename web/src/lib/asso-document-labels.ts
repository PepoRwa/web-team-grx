import type { AssoDocumentFolder } from '@/lib/api'

export const assoDocumentFolderLabels: Record<AssoDocumentFolder, string> = {
  statuts: 'Statuts',
  pv_ag: 'PV AG',
  pv_bureau: 'PV Bureau',
  conventions: 'Conventions',
  interne: 'Interne',
}

export const assoDocumentFolderHints: Record<AssoDocumentFolder, string> = {
  statuts: 'Visible par tous les adhérents actifs',
  pv_ag: 'Bureau ou accès sur demande',
  pv_bureau: 'Bureau ou accès sur demande',
  conventions: 'Bureau uniquement',
  interne: 'Bureau uniquement',
}

export const assoAccessLevelLabels = {
  aucun: 'Aucun',
  lecture: 'Lecture',
  edition: 'Édition',
  admin: 'Administration',
} as const
