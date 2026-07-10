'use client'

import { AssoComingSoon } from '@/components/asso/asso-coming-soon'
import { AssoShell } from '@/components/asso/asso-shell'

export default function AssoDocumentsPage() {
  return (
    <AssoShell activeNav="documents" title="Documents">
      <AssoComingSoon
        title="Gestion documentaire"
        description="Statuts, PV, dossiers par niveau d'accès — arborescence et téléchargement sécurisé."
      />
    </AssoShell>
  )
}
