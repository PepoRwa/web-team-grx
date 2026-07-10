'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { AssoDossierForm } from '@/components/asso/asso-dossier-form'
import { AssoShell } from '@/components/asso/asso-shell'
import { useAssoGate } from '@/hooks/useAssoGate'
import {
  ApiError,
  getAssoDossier,
  updateAssoDossier,
  type AssoDossier,
  type AssoDossierInput,
} from '@/lib/api'

function DossierEditContent() {
  const { session, ready } = useAssoGate({ module: 'membres', moduleMin: 'edition' })
  const router = useRouter()
  const params = useSearchParams()
  const id = Number(params.get('id'))

  const [dossier, setDossier] = useState<AssoDossier | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!session?.access_token || !id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getAssoDossier(session.access_token, id)
      setDossier(data.dossier)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Dossier introuvable')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, id])

  useEffect(() => {
    if (ready && session?.access_token && id) void load()
  }, [load, ready, session?.access_token, id])

  useEffect(() => {
    if (ready && !id) router.replace('/hub/asso/dossiers/')
  }, [ready, id, router])

  async function handleSubmit(data: AssoDossierInput) {
    if (!session?.access_token || !dossier) return
    setSubmitting(true)
    try {
      const { dossier: updated } = await updateAssoDossier(session.access_token, dossier.id, data)
      router.push(`/hub/asso/dossiers/view/?id=${updated.id}`)
    } catch (err) {
      setSubmitting(false)
      throw err
    }
  }

  if (!ready) return null

  return (
    <AssoShell
      activeNav="dossiers"
      title={dossier ? `Modifier — ${dossier.pseudo}` : 'Modifier le dossier'}
      subtitle="Édition bureau"
      backHref={id ? `/hub/asso/dossiers/view/?id=${id}` : '/hub/asso/dossiers/'}
    >
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        {loading && <div className="card h-48 animate-pulse bg-lavender/10" />}
        {dossier && session?.access_token && (
          <AssoDossierForm
            accessToken={session.access_token}
            mode="edit"
            initial={dossier}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/hub/asso/dossiers/view/?id=${dossier.id}`)}
          />
        )}
      </main>
    </AssoShell>
  )
}

export default function AssoDossierEditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <DossierEditContent />
    </Suspense>
  )
}
