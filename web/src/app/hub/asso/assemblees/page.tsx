'use client'

import { AssoComingSoon } from '@/components/asso/asso-coming-soon'
import { AssoShell } from '@/components/asso/asso-shell'

export default function AssoAssembleesPage() {
  return (
    <AssoShell activeNav="assemblees" title="Assemblées générales" bureauOnly>
      <AssoComingSoon
        title="Assemblées & PV"
        description="Convocations, ordres du jour et liens vers les procès-verbaux archivés."
      />
    </AssoShell>
  )
}
