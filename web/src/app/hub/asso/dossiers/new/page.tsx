'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AssoDossierForm } from '@/components/asso/asso-dossier-form'
import { AssoShell } from '@/components/asso/asso-shell'
import { useAssoGate } from '@/hooks/useAssoGate'
import { createAssoDossier, type AssoDossierInput } from '@/lib/api'

export default function AssoNewDossierPage() {
  const router = useRouter()
  const { session, ready } = useAssoGate({ module: 'membres', moduleMin: 'edition' })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(data: AssoDossierInput) {
    if (!session?.access_token) return
    setSubmitting(true)
    try {
      const { dossier } = await createAssoDossier(session.access_token, data)
      router.push(`/hub/asso/dossiers/view/?id=${dossier.id}`)
    } catch (err) {
      setSubmitting(false)
      throw err
    }
  }

  if (!ready || !session) return null

  return (
    <AssoShell
      activeNav="dossiers"
      title="Nouveau dossier"
      subtitle="Saisie bureau"
      backHref="/hub/asso/dossiers/"
    >
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <AssoDossierForm
          accessToken={session.access_token}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </main>
    </AssoShell>
  )
}
