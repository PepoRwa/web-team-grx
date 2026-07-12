'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { VodForm } from '@/components/vod-form'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  deleteVod,
  getVod,
  listProfiles,
  updateVod,
  type Profile,
  type Vod,
  type VodInput,
} from '@/lib/api'

function EditVodContent() {
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const { session, user, permissions, loading: authLoading } = useAuth()
  const router = useRouter()

  const [vod, setVod] = useState<Vod | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canEdit =
    vod &&
    (permissions?.isStaff || vod.authorDiscordId === user?.discordId)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
  }, [authLoading, session, router])

  useEffect(() => {
    if (!session?.access_token || !Number.isFinite(id) || id < 1) return
    setLoading(true)
    Promise.all([
      getVod(session.access_token, id),
      permissions?.isStaff
        ? listProfiles(session.access_token)
        : Promise.resolve({ profiles: [] as Profile[] }),
    ])
      .then(([vodRes, profRes]) => {
        setVod(vodRes.vod)
        setProfiles(profRes.profiles)
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'VOD introuvable')
      })
      .finally(() => setLoading(false))
  }, [session?.access_token, id, permissions?.isStaff])

  const handleSubmit = useCallback(
    async (data: VodInput) => {
      if (!session?.access_token) return
      setSubmitting(true)
      try {
        const { vod: updated } = await updateVod(session.access_token, id, data)
        router.push(`/hub/vods/view/?id=${updated.id}`)
      } finally {
        setSubmitting(false)
      }
    },
    [session?.access_token, id, router],
  )

  const handleDelete = useCallback(async () => {
    if (!session?.access_token || !confirm('Supprimer cette VOD ?')) return
    setSubmitting(true)
    try {
      await deleteVod(session.access_token, id)
      router.push('/hub/vods/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression échouée')
      setSubmitting(false)
    }
  }, [session?.access_token, id, router])

  if (authLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  if (!Number.isFinite(id) || id < 1) {
    return (
      <HubShell activeNav="vods" title="Modifier" backHref="/hub/vods/">
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <Link href="/hub/vods/" className="btn-primary inline-flex">
            Retour
          </Link>
        </main>
      </HubShell>
    )
  }

  return (
    <HubShell
      activeNav="vods"
      title="Modifier la VOD"
      backHref={`/hub/vods/view/?id=${id}`}
    >
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        {loading ? (
          <div className="card h-64 animate-pulse bg-[var(--accent-soft)]/30" />
        ) : error ? (
          <div className="card p-8 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : !canEdit ? (
          <div className="card p-8 text-center">
            <p className="text-[var(--text-muted)]">
              Tu ne peux modifier que tes propres VODs (ou être staff).
            </p>
          </div>
        ) : vod ? (
          <VodForm
            initial={vod}
            profiles={profiles}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/hub/vods/view/?id=${id}`)}
            onDelete={handleDelete}
          />
        ) : null}
      </main>
    </HubShell>
  )
}

export default function EditVodPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <EditVodContent />
    </Suspense>
  )
}
