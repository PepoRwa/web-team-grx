'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { AssoDossierForm } from '@/components/asso/asso-dossier-form'
import { useAuth } from '@/hooks/useAuth'
import { useAssoAccess } from '@/hooks/useAssoAccess'
import { createAssoDossier, type AssoDossierInput } from '@/lib/api'

export default function AssoNewDossierPage() {
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()
  const { access, loading: assoLoading } = useAssoAccess(session?.access_token, Boolean(session))
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && !assoLoading && session && !access.isBureau) router.replace('/hub/')
  }, [authLoading, assoLoading, session, access.isBureau, router])

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

  if (authLoading || assoLoading || !session || !access.isBureau) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell
      activeNav="asso"
      title="Nouveau dossier"
      subtitle="Adhésion — saisie bureau"
      backHref="/hub/asso/"
      showAsso
    >
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <AssoDossierForm
          accessToken={session.access_token}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </main>
    </HubShell>
  )
}
