'use client'

import { AssoComingSoon } from '@/components/asso/asso-coming-soon'
import { AssoShell } from '@/components/asso/asso-shell'

export default function AssoCotisationsPage() {
  return (
    <AssoShell activeNav="cotisations" title="Cotisations" bureauOnly>
      <AssoComingSoon
        title="Suivi des cotisations"
        description="Statuts payé / en attente, dispenses et exports trésorier — reprend le module cotisations de l'ancien site asso."
      />
    </AssoShell>
  )
}
