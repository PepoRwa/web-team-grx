'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { VodForm } from '@/components/vod-form'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, createVod, listProfiles, type Profile, type VodInput } from '@/lib/api'

export default function NewVodPage() {
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
  }, [authLoading, session, router])

  useEffect(() => {
    if (!session?.access_token) return
    listProfiles(session.access_token)
      .then((r) => setProfiles(r.profiles))
      .catch(() => setProfiles([]))
  }, [session?.access_token])

  const handleSubmit = useCallback(
    async (data: VodInput) => {
      if (!session?.access_token) return
      setSubmitting(true)
      setError(null)
      try {
        const { vod } = await createVod(session.access_token, data)
        router.push(`/hub/vods/view/?id=${vod.id}`)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Création échouée')
        throw err
      } finally {
        setSubmitting(false)
      }
    },
    [session?.access_token, router],
  )

  if (authLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell activeNav="vods" title="Nouvelle VOD" backHref="/hub/vods/">
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <VodForm
          profiles={profiles}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/hub/vods/')}
        />
      </main>
    </HubShell>
  )
}
