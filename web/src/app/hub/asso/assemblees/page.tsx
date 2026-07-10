'use client'

import { AssoAssemblyList } from '@/components/asso/asso-assembly-list'
import { AssoShell } from '@/components/asso/asso-shell'
import { useAssoGate } from '@/hooks/useAssoGate'

export default function AssoAssembleesPage() {
  const { session, ready } = useAssoGate({ module: 'assemblees', moduleMin: 'lecture' })

  if (!ready) return null

  return (
    <AssoShell activeNav="assemblees" title="Assemblées générales">
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <p className="text-sm text-[var(--text-muted)]">
          Convocations, ordres du jour et liens vers les procès-verbaux archivés.
        </p>
        <AssoAssemblyList accessToken={session!.access_token} />
      </main>
    </AssoShell>
  )
}
