'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { ProfileForm } from '@/components/profile-form'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  getProfile,
  updateMemberProfile,
  type Profile,
  type ProfileUpdate,
} from '@/lib/api'
import { canEditTeamProfiles } from '@/lib/permissions'

function ProfileEditContent() {
  const searchParams = useSearchParams()
  const discordId = searchParams.get('id') ?? ''
  const { session, loading: authLoading, permissions } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !canEditTeamProfiles(permissions)) {
      router.replace('/hub/')
    }
  }, [authLoading, session, permissions, router])

  const load = useCallback(async () => {
    if (!session?.access_token || !discordId) return
    setLoading(true)
    try {
      const { profile: p } = await getProfile(session.access_token, discordId)
      setProfile(p)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Profil introuvable')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, discordId])

  useEffect(() => {
    if (!authLoading && session?.access_token && discordId) void load()
  }, [load, authLoading, session?.access_token, discordId])

  const handleSubmit = useCallback(
    async (data: ProfileUpdate) => {
      if (!session?.access_token || !discordId) return
      setSubmitting(true)
      const { profile: updated } = await updateMemberProfile(
        session.access_token,
        discordId,
        data,
      )
      setProfile(updated)
      router.push(`/hub/profiles/view/?id=${discordId}`)
    },
    [session?.access_token, discordId, router],
  )

  if (authLoading || !session || !canEditTeamProfiles(permissions)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell
      activeNav="profile"
      title="Modifier profil"
      backHref={`/hub/profiles/view/?id=${discordId}`}
    >
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        {loading ? (
          <div className="card h-64 animate-pulse bg-[var(--accent-soft)]/30" />
        ) : error || !profile ? (
          <div className="card p-8 text-center">
            <p className="text-red-500">{error ?? 'Introuvable'}</p>
            <Link href="/hub/profiles/" className="btn-primary mt-6 inline-flex">
              Retour
            </Link>
          </div>
        ) : (
          <ProfileForm
            initial={profile}
            submitting={submitting}
            onSubmit={handleSubmit}
            submitLabel="Enregistrer le profil"
          />
        )}
      </main>
    </HubShell>
  )
}

export default function ProfileEditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <ProfileEditContent />
    </Suspense>
  )
}
