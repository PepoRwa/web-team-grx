'use client'

import { AssoComingSoon } from '@/components/asso/asso-coming-soon'
import { AssoShell } from '@/components/asso/asso-shell'

export default function AssoParametresPage() {
  return (
    <AssoShell activeNav="parametres" title="Paramètres asso" bureauOnly>
      <AssoComingSoon
        title="Paramètres de l'association"
        description="Identité juridique, RNA, siège social, contacts — données affichées sur les courriers et exports RGPD."
      />
    </AssoShell>
  )
}
