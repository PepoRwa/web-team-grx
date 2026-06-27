'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { StratForm } from '@/components/strat-form'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  deleteStrat,
  getStrat,
  updateStrat,
  uploadStratImage,
  type Strat,
  type StratInput,
} from '@/lib/api'

function EditStratContent() {
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const { session, user, permissions, loading: authLoading } = useAuth()
  const router = useRouter()

  const [strat, setStrat] = useState<Strat | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isStaff = Boolean(permissions?.isStaff)
  const canEdit =
    strat &&
    (isStaff || (strat.authorDiscordId === user?.discordId && strat.status === 'proposed'))

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
  }, [authLoading, session, router])

  useEffect(() => {
    if (!session?.access_token || !Number.isFinite(id) || id < 1) return
    setLoading(true)
    getStrat(session.access_token, id)
      .then((r) => setStrat(r.strat))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Strat introuvable'))
      .finally(() => setLoading(false))
  }, [session?.access_token, id])

  const handleSubmit = useCallback(
    async (data: StratInput) => {
      if (!session?.access_token) return
      setSubmitting(true)
      try {
        const { strat: updated } = await updateStrat(session.access_token, id, data)
        router.push(`/hub/strats/view/?id=${updated.id}`)
      } finally {
        setSubmitting(false)
      }
    },
    [session?.access_token, id, router],
  )

  const handleDelete = useCallback(async () => {
    if (!session?.access_token || !confirm('Supprimer cette strat ?')) return
    setSubmitting(true)
    try {
      await deleteStrat(session.access_token, id)
      router.push('/hub/strats/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression échouée')
      setSubmitting(false)
    }
  }, [session?.access_token, id, router])

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !session?.access_token) return
    setUploading(true)
    setError(null)
    try {
      const { strat: updated } = await uploadStratImage(session.access_token, id, file)
      setStrat(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload échoué')
    } finally {
      setUploading(false)
    }
  }

  if (authLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell
      activeNav="strats"
      title="Modifier la strat"
      backHref={`/hub/strats/view/?id=${id}`}
    >
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:py-8">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading ? (
          <div className="card h-64 animate-pulse bg-[var(--accent-soft)]/30" />
        ) : !canEdit ? (
          <div className="card p-8 text-center text-[var(--text-muted)]">
            Modification non autorisée.
            <Link href={`/hub/strats/view/?id=${id}`} className="btn-primary mt-4 inline-flex">
              Retour
            </Link>
          </div>
        ) : strat ? (
          <>
            {isStaff && (
              <div className="card p-6">
                <p className="text-sm font-medium">Image tactique</p>
                {strat.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={strat.imageUrl} alt="" className="mt-3 max-h-48 rounded-xl object-contain" />
                )}
                <label className="btn-ghost mt-3 inline-flex cursor-pointer">
                  {uploading ? 'Upload…' : 'Changer l\'image'}
                  <input type="file" accept="image/*" className="sr-only" onChange={handleImageChange} disabled={uploading} />
                </label>
              </div>
            )}
            <StratForm
              initial={strat}
              isStaff={isStaff}
              submitting={submitting}
              onSubmit={handleSubmit}
              onCancel={() => router.push(`/hub/strats/view/?id=${id}`)}
              onDelete={handleDelete}
            />
          </>
        ) : null}
      </main>
    </HubShell>
  )
}

export default function EditStratPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" /></div>}>
      <EditStratContent />
    </Suspense>
  )
}
